import {
  SelectIO,
  UpdateIO,
  InsertIO,
  DeleteIO,
  SQLIO,
  SetterIO,
} from '../io/io';
import Dialect, { TypeBridge } from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import toSelectIO from '../io/toSelectIO';
import toUpdateIO from '../io/toUpdateIO';
import toInsertIO from '../io/toInsertIO';
import toDeleteIO from '../io/toDeleteIO';
import VarInfo from './varInfo';
import * as go from './go';
import * as defs from './defs';
import NameContext from '../lib/nameContext';

const HeaderRepeatCount = 90;
const QueryableParam = 'queryable';
const QueryableType = 'sqlx.Queryable';
const ResultVar = 'result';
const FileHeader = ` /${'*'.repeat(HeaderRepeatCount)}
 * The code was automatically generated by mingru (https://github.com/mgenware/mingru)
 * Do not edit this file manually, your changes will be overwritten.
 ${'*'.repeat(HeaderRepeatCount)}/

`;

function joinParams(arr: string[]): string {
  return arr.join(', ');
}

export default class GoBuilder {
  tableClassObject: string;
  tableClassType: string;
  sysImports = new Set<string>();
  userImports = new Set<string>();

  constructor(
    public tableActions: dd.TableActionCollection,
    public dialect: Dialect,
    public packageName = 'da',
  ) {
    throwIfFalsy(tableActions, 'tableActions');
    const capTableName = dd.utils.capitalizeFirstLetter(
      dd.utils.toCamelCase(tableActions.table.__name),
    );
    this.tableClassType = `TableType${capTableName}`;
    this.tableClassObject = capTableName;

    this.userImports.add(defs.SQLXPath);
  }

  build(actionsOnly: boolean, noHeader: boolean): string {
    let code = noHeader ? '' : FileHeader;
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
    code =
      code + go.makeImports([...this.sysImports], [...this.userImports]) + body;
    return code;
  }

  private buildActions(): string {
    const { dialect } = this;
    let code = '';
    for (const action of this.tableActions.map.values()) {
      code += '\n';
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

        case dd.ActionType.delete: {
          const io = toDeleteIO(action as dd.DeleteAction, dialect);
          code += this.delete(io);
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
    const { action } = io;

    const actionName = action.name;
    // The struct type of result, null if isSelectField is true
    const resultType = action.isSelectField ? '' : `${actionName}Result`;

    let code = '';
    // Collect selected columns info, used to generate result type and params passed to `Scan`.
    const selectedFields: go.InstanceVariable[] = [];
    for (const col of io.cols) {
      const fieldName = col.varName;
      const fieldType = dialect.goType(col.col.__getTargetColumn());
      this.addTypeBridge(fieldType);
      selectedFields.push(new go.InstanceVariable(fieldName, fieldType.type));
    }

    if (resultType) {
      code += go.struct(resultType, selectedFields);
    }

    // The return type of the function
    let returnType: string;
    if (action.isSelectField) {
      // selectedFields are guaranteed not empty, cuz the action ctor will throw on empty columns
      returnType = selectedFields[0].type;
    } else if (action.isSelectAll) {
      returnType = `[]*${resultType}`;
    } else {
      returnType = `*${resultType}`;
    }

    // Collect params info, used to generate function header, e.g. `(queryable sqlx.Queryable, id uint64, name string)`.
    let funcParamsCode = `${QueryableParam} ${QueryableType}`;
    const varContext = new NameContext();
    const whereVars = this.whereToVars(io.where, varContext);
    funcParamsCode += whereVars.map(p => `, ${p.name} ${p.type}`).join('');
    const queryParamsCode = whereVars.map(p => `, ${p.name}`).join('');

    code += `// ${actionName} ...
func (da *${tableClassType}) ${actionName}(${funcParamsCode}) (${returnType}, error) {
`;

    const sqlLiteral = go.makeStringLiteral(io.sql);
    if (action.isSelectAll) {
      const scanParams = joinParams(selectedFields.map(p => `&item.${p.name}`));
      // > call Query
      code += `\trows, err := ${QueryableParam}.Query(${sqlLiteral}${queryParamsCode})
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
      let scanParams: string;
      // Declare the result variable
      if (action.isSelectField) {
        scanParams = `&${ResultVar}`;
        code += `\tvar ${ResultVar} ${returnType}`;
      } else {
        scanParams = joinParams(
          selectedFields.map(p => `&${ResultVar}.${p.name}`),
        );
        code += `\t${go.pointerVar(ResultVar, resultType)}`;
      }
      code += '\n';

      // Call query func
      code += `\terr := ${QueryableParam}.QueryRow(${sqlLiteral}${queryParamsCode}).Scan(${scanParams})
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
    const { tableClassType } = this;
    const { action } = io;
    const actionName = action.name;

    let code = '';

    // Prepare params
    let funcParamsCode = `${QueryableParam} ${QueryableType}`;
    const varContext = new NameContext();
    // Note: WHERE vars takes precedence over setter vars, e.g. UPDATE id = ? WHERE id = ? would produces func with params like (id, id2) where id is for WHERE, id2 for setter
    const whereVars = this.whereToVars(io.where, varContext);
    const setterVars = this.settersToVars(io.setters, varContext);

    // For func params, WHERE vars are put before setter vars
    const funcParams = [...whereVars, ...setterVars];
    // For query call arguments, WHERE vars are put behind setter vars
    const queryParams = [...setterVars, ...whereVars];

    funcParamsCode += funcParams.map(p => `, ${p.name} ${p.type}`).join('');
    const queryParamsCode = queryParams.map(p => `, ${p.name}`).join('');
    code += `// ${actionName} ...
func (da *${tableClassType}) ${actionName}(${funcParamsCode}) `;
    // Return type is determined by checkRowsAffected
    if (action.checkAffectedRows) {
      code += 'error';
    } else {
      code += '(int, error)';
    }
    code += ' {\n';

    // Body
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `\t${ResultVar}, err := ${QueryableParam}.Exec(${sqlLiteral}${queryParamsCode})\n`;

    // Return the result
    if (action.checkAffectedRows) {
      code += `\treturn sqlx.CheckOneRowAffectedWithError(${ResultVar}, err)`;
    } else {
      code += `\treturn sqlx.GetRowsAffectedIntWithError(${ResultVar}, err)`;
    }
    code += '\n}\n';
    return code;
  }

  private insert(io: InsertIO): string {
    const { tableClassType } = this;
    const { action } = io;
    const actionName = action.name;

    let code = '';

    // Prepare params
    let funcParamsCode = `${QueryableParam} ${QueryableType}`;
    const varContext = new NameContext();
    const setterVars = this.settersToVars(io.setters, varContext);
    funcParamsCode += setterVars.map(p => `, ${p.name} ${p.type}`).join('');
    const queryParamsCode = setterVars.map(p => `, ${p.name}`).join('');
    code += `// ${actionName} ...
func (da *${tableClassType}) ${actionName}(${funcParamsCode}) `;
    // Return type is determined by fetchInsertedID
    if (action.fetchInsertedID) {
      code += '(uint64, error)';
    } else {
      code += 'error';
    }
    code += ' {\n';

    // Body
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `\t${
      action.fetchInsertedID ? 'result' : '_'
    }, err := ${QueryableParam}.Exec(${sqlLiteral}${queryParamsCode})
`;

    // Return the result
    if (action.fetchInsertedID) {
      code += `\treturn sqlx.GetLastInsertIDUint64WithError(${ResultVar}, err)`;
    } else {
      code += '\treturn err';
    }
    code += '\n}\n';
    return code;
  }

  private delete(io: DeleteIO): string {
    const { tableClassType } = this;
    const { action } = io;
    const actionName = action.name;

    let code = '';

    // Prepare params
    let funcParamsCode = `${QueryableParam} ${QueryableType}`;
    const varContext = new NameContext();
    const whereVars = this.whereToVars(io.where, varContext);
    funcParamsCode += whereVars.map(p => `, ${p.name} ${p.type}`).join('');
    const queryParamsCode = whereVars.map(p => `, ${p.name}`).join('');
    code += `// ${actionName} ...
func (da *${tableClassType}) ${actionName}(${funcParamsCode}) `;
    // Return type is determined by checkRowsAffected
    if (action.checkAffectedRows) {
      code += 'error';
    } else {
      code += '(int, error)';
    }
    code += ' {\n';

    // Body
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `\t${ResultVar}, err := ${QueryableParam}.Exec(${sqlLiteral}${queryParamsCode})\n`;
    // Return the result
    if (action.checkAffectedRows) {
      code += `\treturn sqlx.CheckOneRowAffectedWithError(${ResultVar}, err)`;
    } else {
      code += `\treturn sqlx.GetRowsAffectedIntWithError(${ResultVar}, err)`;
    }
    code += '\n}\n';
    return code;
  }

  private whereToVars(where: SQLIO | null, context: NameContext): VarInfo[] {
    if (!where) {
      return [];
    }
    return this.sqlsToVars([where], context);
  }

  private settersToVars(setters: SetterIO[], context: NameContext): VarInfo[] {
    return this.sqlsToVars(setters.map(s => s.sql), context);
  }

  private sqlsToVars(sqls: SQLIO[], context: NameContext): VarInfo[] {
    const params = VarInfo.fromSQLArray(this.dialect, sqls, context);
    for (const param of params) {
      this.addTypeBridge(param.type);
    }
    return params;
  }

  private addTypeBridge(bridge: TypeBridge) {
    if (!bridge.importPath) {
      return;
    }
    if (bridge.isSystemImport) {
      this.sysImports.add(bridge.importPath);
    } else {
      this.userImports.add(bridge.importPath);
    }
  }
}
