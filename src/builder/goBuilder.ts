import { SelectIO, UpdateIO, InsertIO } from '../io/io';
import Dialect from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import toSelectIO from '../io/toSelectIO';
import toUpdateIO from '../io/toUpdateIO';
import toInsertIO from '../io/toInsertIO';
import ParamInfo from './paramInfo';
import * as go from './go';
import * as defs from './defs';

const QueryableParam = 'queryable';
const QueryableType = 'sqlx.Queryable';
const ResultVar = 'result';

function joinParams(arr: string[]): string {
  return arr.join(', ');
}

export default class GoBuilder {
  memberNames: Set<string> = new Set<string>();

  private tableClassObject: string;
  private tableClassType: string;
  private sysImports: string[] = [];
  private userImports: string[] = [];

  constructor(
    public tableActions: dd.TableActionCollection,
    public dialect: Dialect,
    public packageName = 'da',
  ) {
    throwIfFalsy(tableActions, 'tableActions');
    const capTableName = dd.utils.capitalizeFirstLetter(dd.utils.toCamelCase(tableActions.table.__name));
    this.tableClassType = `TableType${capTableName}`;
    this.tableClassObject = capTableName;

    this.userImports.push(defs.SQLXPath);
  }

  build(actionsOnly?: boolean): string {
    let code = '';
    if (actionsOnly) {
      return this.buildActions();
    }
    code += `package ${this.packageName}

`;

    // this.buildActions will set this.systemImports and this.userImports
    let body = '';
    body += this.buildTableObject();
    body += go.sep('Actions');
    body += this.buildActions();

    // Add imports
    code = code + go.makeImports(this.sysImports, this.userImports) + body;
    return code;
  }

  private buildActions(): string {
    const { dialect } = this;
    let code = '';
    for (const action of this.tableActions.map.values()) {
      switch (action.type) {
        case dd.ActionType.select: {
          const io = toSelectIO(action as dd.SelectAction, dialect);
          code += this.select(io);
          break;
        }

        case dd.ActionType.update: {
          const io = toUpdateIO(action as dd.UpdateAction, dialect);
          code += this.update(io);
          break;
        }

        case dd.ActionType.insert: {
          const io = toInsertIO(action as dd.InsertAction, dialect);
          code += this.insert(io);
          break;
        }

        default: {
          throw new Error(`Not supported io object "${toTypeString(action)}"`);
        }
      }
    }
    return code;
  }

  private buildTableObject(): string {
    let code = go.struct(this.tableClassType, []);
    code += `// ${this.tableClassObject} ...
var ${dd.utils.capitalizeFirstLetter(this.tableClassObject)} = &${
      this.tableClassType
    }{}

`;
    return code;
  }

  private select(io: SelectIO): string {
    const { dialect, tableClassType } = this;
    const actionName = io.action.name;
    const resultType = `${actionName}Result`;
    const selectAll = io.action.selectAll;

    let code = '';
    // Collect selected columns info, used to generate result type and params passed to `Scan`.
    const selectedFields: go.InstanceVariable[] = [];
    for (const col of io.cols) {
      const fieldName = col.varName;
      const fieldType = dialect.goType(col.col.__getTargetColumn());
      selectedFields.push(new go.InstanceVariable(fieldName, fieldType.type));
    }
    code += go.struct(resultType, selectedFields);

    // Collect params info, used to generate function header, e.g. `(queryable sqlx.Queryable, id uint64, name string)`.
    let funcParams = `${QueryableParam} ${QueryableType}`;
    const paramInfos = ParamInfo.fromSQLArray(dialect, io.where ? [io.where] : []);
    funcParams += paramInfos.map(p => `, ${p.name} ${p.type}`).join('');
    const queryParams = paramInfos.map(p => `, ${p.name}`).join('');

    code += `// ${actionName} ...
func (da *${tableClassType}) ${actionName}(${funcParams}) (${selectAll ? `[]*${resultType}` : `*${resultType}`}, error) {
`;

    const sqlLiteral = go.makeStringLiteral(io.sql);
    if (selectAll) {
      const scanParams = joinParams(selectedFields.map(p => `&item.${p.name}`));
      // > call Query
      code += `\trows, err := ${QueryableParam}.Query(${sqlLiteral}${queryParams})
\tif err != nil {
\t\treturn nil, err
\t}
\t${go.makeArray(ResultVar, `*${resultType}`)}
\tdefer rows.Close()
\tfor rows.Next() {
\t\t${go.pointerVar('item', resultType)}
\t\terr = rows.Scan(${scanParams})
\t\tif err != nil {
\t\t\treturn nil, err
\t\t}
\t\tresult = append(result, item)
\t}
\terr = rows.Err()
\tif err != nil {
\t\treturn nil, err
\t}
`;
    } else {
      const scanParams = joinParams(selectedFields.map(p => `&${ResultVar}.${p.name}`));
      code += `\t${go.pointerVar(ResultVar, resultType)}
\terr := ${QueryableParam}.QueryRow(${sqlLiteral}${queryParams}).Scan(${scanParams})
\tif err != nil {
\t\treturn nil, err
\t}
`;
    }
    // Return the result
    code += `\treturn ${ResultVar}, nil
}
`;
    return code;
  }

  private update(io: UpdateIO): string {
    const { dialect, tableClassType } = this;
    const { action } = io;
    const actionName = action.name;

    let code = '';

    // Prepare params
    let funcParams = `${QueryableParam} ${QueryableType}`;
    const setterSQLs = io.setters.map(setter => setter.sql);
    const paramInfos = ParamInfo.fromSQLArray(dialect, setterSQLs);
    funcParams += paramInfos.map(p => `, ${p.name} ${p.type}`).join('');
    const queryParams = paramInfos.map(p => `, ${p.name}`).join('');
    code += `// ${actionName} ...
func (da *${tableClassType}) ${actionName}(${funcParams}) error {
`;
    // Body
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `\t_, err := ${QueryableParam}.Exec(${sqlLiteral}${queryParams})
\tif err != nil {
\t\treturn err
\t}
`;

    // Return the result
    code += `\treturn nil
}
`;
    return code;
  }

  private insert(io: InsertIO): string {
    const { dialect, tableClassType } = this;
    const { action } = io;
    const actionName = action.name;

    let code = '';

    // Prepare params
    let funcParams = `${QueryableParam} ${QueryableType}`;
    const paramInfos = action.columns.map(c => ParamInfo.fromColumn(dialect, c));
    funcParams += paramInfos.map(p => `, ${p.name} ${p.type}`).join('');
    const queryParams = paramInfos.map(p => `, ${p.name}`).join('');
    code += `// ${actionName} ...
func (da *${tableClassType}) ${actionName}(${funcParams}) error {
`;
    // Body
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `\t_, err := ${QueryableParam}.Exec(${sqlLiteral}${queryParams})
\tif err != nil {
\t\treturn err
\t}
`;

    // Return the result
    code += `\treturn nil
}
`;
    return code;
  }
}
