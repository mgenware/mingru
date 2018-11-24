import { SelectIO } from '../io/select';
import { capitalizeFirstLetter } from '../lib/stringUtil';
import Dialect from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import select from '../io/select';
import ParamInfo from './paramInfo';
import {
  struct,
  sep,
  pointerVar,
  InstanceVariable,
  makeArray,
} from './go';

const QueryableParam = 'queryable';
const QueryableType = 'sqlx.Queryable';
const ResultVar = 'res';

function joinParams(arr: string[]): string {
  return arr.join(', ');
}

export default class GoBuilder {
  memberNames: Set<string> = new Set<string>();

  private tableName: string;
  private tableClassType: string;

  constructor(
    public tableActions: dd.TableActionCollection,
    public dialect: Dialect,
    public packageName = 'da',
  ) {
    throwIfFalsy(tableActions, 'tableActions');
    this.tableName = this.tableActions.table.__name;
    const tableName = tableActions.table.__name;
    this.tableClassType = `TableType${capitalizeFirstLetter(tableName)}`;
  }

  build(actionsOnly?: boolean): string {
    const { tableActions } = this;

    let code = '';
    if (!actionsOnly) {
      code +=
        `package ${this.packageName}

`;
      code += `import (
\t"github.com/mgenware/go-packagex/database/sqlx"
)

`;

      code += this.buildDataObject();
      code += sep('Actions');
    }
    for (const action of tableActions.map.values()) {
      code += this.buildAction(action);
    }
    return code;
  }

  private buildAction(action: unknown): string {
    const { dialect } = this;
    if (action instanceof dd.SelectAction) {
      const selectAction = action as dd.SelectAction;
      const io = select(selectAction, dialect);
      return this.select(io);
    }
    throw new Error(`Not supported io object "${toTypeString(action)}"`);
  }

  private buildDataObject(): string {
    let code = struct(this.tableClassType, []);
    code += `var ${capitalizeFirstLetter(this.tableName)} = &${
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
    // Build result type
    const colNames = new Set<string>();
    const selectedFields: InstanceVariable[] = [];
    for (const col of io.cols) {
      const fieldName = col.name;
      // TOOO: support alias
      if (colNames.has(fieldName)) {
        throw new Error(`Column name "${fieldName}" already exists`);
      }
      colNames.add(fieldName);
      const fieldType = dialect.goType(col.col.__getTargetColumn());
      selectedFields.push(new InstanceVariable(fieldName, fieldType));
    }
    code += struct(resultType, selectedFields);

    // Prepare
    let funcParams = `${QueryableParam} ${QueryableType}`;
    const paramInfos = ParamInfo.getList(dialect, io.where);
    funcParams += paramInfos.map(p => `, ${p.name} ${p.type}`).join();
    const queryParams = paramInfos.map(p => `, ${p.name}`).join();
    const scanParams = joinParams(selectedFields.map(p => `&${ResultVar}.${p.name}`));

    // > func
    code += `// ${actionName} ...
func (da *${tableClassType}) ${actionName}(${funcParams}) (${selectAll ? `[]*${resultType}` : `*${resultType}`}, error) {
`;
    // Result var
    if (selectAll) {
      // > call Query
      code += `\trows, err := ${QueryableParam}.Query("${io.sql}${queryParams})
\tif err != nil {
\t\treturn nil, err
\t}
\t${makeArray(ResultVar, `*${resultType}`)}
\tdefer rows.Close()
\tfor rows.Next() {
\t\t${pointerVar('item', resultType)}
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
      code += `\t${pointerVar(ResultVar, resultType)}
\terr := ${QueryableParam}.QueryRow("${io.sql}${queryParams}").Scan(${scanParams})
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
}
