import Dialect, { TypeBridge } from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SelectIO } from '../io/selectIO';
import { UpdateIO } from '../io/updateIO';
import { InsertIO } from '../io/insertIO';
import { DeleteIO } from '../io/deleteIO';
import VarInfo from './varInfo';
import * as go from './go';
import * as defs from './defs';
import NameContext from '../lib/nameContext';
import logger from '../logger';
import SQLVariableList from '../io/sqlInputList';
import { ActionResult } from './common';
import { TAIO, ActionIO } from '../io/common';

const HeaderRepeatCount = 90;
const QueryableParam = 'queryable';
const QueryableType = 'dbx.Queryable';
const ResultVar = 'result';
const FileHeader = ` /${'*'.repeat(HeaderRepeatCount)}
 * This code was automatically generated by mingru (https://github.com/mgenware/mingru)
 * Do not edit this file manually, your changes will be overwritten.
 ${'*'.repeat(HeaderRepeatCount)}/

`;
const Limit = 'limit';
const Offset = 'offset';

function joinParams(arr: string[]): string {
  return arr.join(', ');
}

export default class GoBuilder {
  private tableClassObject: string;
  private tableClassType: string;
  private sysImports = new Set<string>();
  private userImports = new Set<string>();
  private actionResults: { [name: string]: ActionResult } = {};

  constructor(
    public taIO: TAIO,
    public dialect: Dialect,
    public packageName = 'da',
  ) {
    throwIfFalsy(taIO, 'taIO');
    this.tableClassType = taIO.className;
    this.tableClassObject = taIO.instanceName;
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
    let code = '';
    for (const actionIO of this.taIO.actions) {
      code += '\n';
      const actionResult = this.processActionIO(actionIO);
      this.actionResults[actionResult.io.funcName] = actionResult;
      code += actionResult.code;
    }
    return code;
  }

  private processActionIO(io: ActionIO): ActionResult {
    logger.debug(`Building action "${io.action.__name}"`);

    switch (io.action.actionType) {
      case dd.ActionType.select: {
        return this.select(io as SelectIO);
      }

      case dd.ActionType.update: {
        return this.update(io as UpdateIO);
      }

      case dd.ActionType.insert: {
        return this.insert(io as InsertIO);
      }

      case dd.ActionType.delete: {
        return this.delete(io as DeleteIO);
      }

      default: {
        throw new Error(
          `Not supported action type "${
            io.action.actionType
          }" in goBuilder.processActionIO`,
        );
      }
    }
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

  private select(io: SelectIO): ActionResult {
    const { dialect, tableClassType } = this;
    const { action, funcName } = io;

    const tableName = dd.utils.toPascalCase(action.__table.__name);
    const { pagination } = action;
    // The struct type of result, null if isSelectField is true
    // Table name is prefixed cuz class names are in global namespace (unlike instance methods which is scoped to a class)
    const resultType = action.isSelectField
      ? ''
      : `${tableName}Table${funcName}Result`;

    let code = '';
    // Collect selected columns info, used to generate result type and params passed to `Scan`.
    const selectedFields: go.InstanceVariable[] = [];
    for (const col of io.cols) {
      const fieldName = col.inputName;
      const fieldType = dialect.goType(col.getResultType());
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

    // Collect params info, used to generate function header, e.g. `(queryable dbx.Queryable, id uint64, name string)`.
    let funcParamsCode = `${QueryableParam} ${QueryableType}`;
    const varContext = new NameContext();
    const inputVars = this.inputsToVars(varContext, io.getInputs());
    funcParamsCode += inputVars.map(p => `, ${p.name} ${p.type}`).join('');
    let queryParamsCode = inputVars.map(p => `, ${p.name}`).join('');
    if (pagination) {
      funcParamsCode += `, ${Limit}, ${Offset} int`;
      queryParamsCode += `, ${Limit}, ${Offset}`;
    }

    const returnTypes = [returnType, 'error'];
    code += `// ${funcName} ...
func (da *${tableClassType}) ${funcName}(${funcParamsCode}) (${returnTypes.join(
      ', ',
    )}) {
`;

    let sqlSource = io.sql;
    if (pagination) {
      sqlSource += ' LIMIT ? OFFSET ?';
    }
    const sqlLiteral = go.makeStringLiteral(sqlSource);
    if (action.isSelectAll) {
      const scanParams = joinParams(selectedFields.map(p => `&item.${p.name}`));
      // > call Query
      code += `\trows, err := ${QueryableParam}.Query(${sqlLiteral}${queryParamsCode})
\tif err != nil {
\t\treturn nil, err
\t}
\t${go.makeArray(ResultVar, `*${resultType}`, 0, pagination ? Limit : 0)}
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
      // select/selectField
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
      // For selectField, we return the default value, for select, return nil
      const resultVarOnError = action.isSelectField ? 'result' : 'nil';
      code += '\n';

      // Call query func
      code += `\terr := ${QueryableParam}.QueryRow(${sqlLiteral}${queryParamsCode}).Scan(${scanParams})
\tif err != nil {
\t\treturn ${resultVarOnError}, err
\t}
`;
    }
    // Return the result
    code += `\treturn ${ResultVar}, nil
}
`;
    return new ActionResult(io, code, returnTypes, inputVars);
  }

  private update(io: UpdateIO): ActionResult {
    const { tableClassType } = this;
    const { action, funcName } = io;
    let code = '';

    // Prepare params
    let funcParamsCode = `${QueryableParam} ${QueryableType}`;
    const varContext = new NameContext();
    // Note: WHERE vars takes precedence over setter vars,
    // e.g. UPDATE id = ? WHERE id = ? would produces func with params like (id, id2) where id is for WHERE, id2 for setter
    const whereVars = io.where
      ? this.inputsToVars(varContext, io.where.inputs)
      : [];
    const setterVars = this.inputsToVars(varContext, io.setterInputs);

    // For func params, WHERE vars are put before setter vars
    const funcParams = [...whereVars, ...setterVars];
    // For query call arguments, WHERE vars are put behind setter vars
    const queryParams = [...setterVars, ...whereVars];

    funcParamsCode += funcParams.map(p => `, ${p.name} ${p.type}`).join('');
    const queryParamsCode = queryParams.map(p => `, ${p.name}`).join('');
    let returnTypes: string[];
    code += `// ${funcName} ...
func (da *${tableClassType}) ${funcName}(${funcParamsCode}) `;
    // Return type is determined by checkRowsAffected
    if (action.checkAffectedRows) {
      returnTypes = ['error'];
      code += returnTypes[0];
    } else {
      returnTypes = ['int', 'error'];
      code += `(${returnTypes.join(', ')})`;
    }
    code += ' {\n';

    // Body
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `\t${ResultVar}, err := ${QueryableParam}.Exec(${sqlLiteral}${queryParamsCode})\n`;

    // Return the result
    if (action.checkAffectedRows) {
      code += `\treturn dbx.CheckOneRowAffectedWithError(${ResultVar}, err)`;
    } else {
      code += `\treturn dbx.GetRowsAffectedIntWithError(${ResultVar}, err)`;
    }
    code += '\n}\n';
    return new ActionResult(io, code, returnTypes, funcParams);
  }

  private insert(io: InsertIO): ActionResult {
    const { tableClassType } = this;
    const { action, funcName } = io;
    let code = '';

    // Prepare params
    let funcParamsCode = `${QueryableParam} ${QueryableType}`;
    const varContext = new NameContext();
    const funcParams = this.inputsToVars(varContext, io.getInputs());
    funcParamsCode += funcParams.map(p => `, ${p.name} ${p.type}`).join('');
    const queryParamsCode = funcParams.map(p => `, ${p.name}`).join('');
    code += `// ${funcName} ...
func (da *${tableClassType}) ${funcName}(${funcParamsCode}) `;

    let returnTypes: string[];
    // Return type is determined by fetchInsertedID
    if (action.fetchInsertedID) {
      returnTypes = ['uint64', 'error'];
      code += `(${returnTypes.join(', ')})`;
    } else {
      returnTypes = ['error'];
      code += returnTypes[0];
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
      code += `\treturn dbx.GetLastInsertIDUint64WithError(${ResultVar}, err)`;
    } else {
      code += '\treturn err';
    }
    code += '\n}\n';
    return new ActionResult(io, code, returnTypes, funcParams);
  }

  private delete(io: DeleteIO): ActionResult {
    const { tableClassType } = this;
    const { action, funcName } = io;
    let code = '';

    // Prepare params
    let funcParamsCode = `${QueryableParam} ${QueryableType}`;
    const varContext = new NameContext();
    const funcParams = this.inputsToVars(varContext, io.getInputs());
    funcParamsCode += funcParams.map(p => `, ${p.name} ${p.type}`).join('');
    const queryParamsCode = funcParams.map(p => `, ${p.name}`).join('');
    code += `// ${funcName} ...
func (da *${tableClassType}) ${funcName}(${funcParamsCode}) `;

    let returnTypes: string[];
    // Return type is determined by checkRowsAffected
    if (action.checkAffectedRows) {
      returnTypes = ['error'];
      code += returnTypes[0];
    } else {
      returnTypes = ['int', 'error'];
      code += `(${returnTypes.join(', ')})`;
    }
    code += ' {\n';

    // Body
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `\t${ResultVar}, err := ${QueryableParam}.Exec(${sqlLiteral}${queryParamsCode})\n`;
    // Return the result
    if (action.checkAffectedRows) {
      code += `\treturn dbx.CheckOneRowAffectedWithError(${ResultVar}, err)`;
    } else {
      code += `\treturn dbx.GetRowsAffectedIntWithError(${ResultVar}, err)`;
    }
    code += '\n}\n';
    return new ActionResult(io, code, returnTypes, funcParams);
  }

  private inputsToVars(
    context: NameContext,
    inputs: SQLVariableList,
  ): VarInfo[] {
    if (!inputs.length) {
      return [];
    }
    const params = VarInfo.fromInputs(this.dialect, context, inputs);
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
