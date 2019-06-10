import { Dialect } from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SelectIO } from '../io/selectIO';
import { UpdateIO } from '../io/updateIO';
import { InsertIO } from '../io/insertIO';
import { DeleteIO } from '../io/deleteIO';
import VarInfo, { TypeInfo } from '../lib/varInfo';
import * as go from './go';
import * as defs from './defs';
import logger from '../logger';
import { TAIO } from '../io/taIO';
import { ActionIO } from '../io/actionIO';
import VarList from '../lib/varList';

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

function joinParams(arr: string[]): string {
  return arr.join(', ');
}

// For some actions, like SELECT, it uses CodeMap type to return multiple code blocks.
class CodeMap {
  constructor(public body: string, public header?: string) {}
}

export default class GoBuilder {
  private imports = new Set<string>();
  private dialect: Dialect;

  constructor(public taIO: TAIO, public packageName = 'da') {
    throwIfFalsy(taIO, 'taIO');
    this.imports.add(defs.SQLXPath);
    this.dialect = taIO.dialect;
  }

  build(actionsOnly: boolean, noHeader: boolean): string {
    let code = noHeader ? '' : FileHeader;
    if (actionsOnly) {
      return this.buildActions();
    }
    code += `package ${this.packageName}\n\n`;

    // this.buildActions will set this.systemImports and this.userImports
    let body = '';
    body += this.buildTableObject();
    body += go.sep('Actions');
    body += this.buildActions();

    // Add imports
    code = code + go.makeImports([...this.imports]) + body;
    return code;
  }

  private buildActions(): string {
    let code = '';
    for (const actionIO of this.taIO.actions) {
      code += '\n';
      code += this.processActionIO(actionIO);
    }
    return code;
  }

  private processActionIO(io: ActionIO): string {
    logger.debug(`Building action "${io.action.__name}"`);

    // Prepare variables
    const { funcName } = io;
    const { className: tableClassName } = this.taIO;
    let code = '';

    // Build func head
    code += `// ${funcName} ...
func (da *${tableClassName}) ${funcName}`;

    // Build func params
    this.scanImports(io.inputVarList);
    let funcParamsCode = `${QueryableParam} ${QueryableType}`;
    funcParamsCode += io.inputVarList.list
      .map(p => `, ${p.name} ${p.type.typeName}`)
      .join('');
    code += `(${funcParamsCode})`;

    // Build return values
    this.scanImports(io.returnVarList);
    const returnsWithError = this.appendErrorType(io.returnVarList);
    let returnCode = returnsWithError.map(v => v.type.typeName).join(', ');
    if (returnsWithError.length > 1) {
      returnCode = `(${returnCode})`;
    }
    if (returnCode) {
      returnCode = ' ' + returnCode;
    }
    code += returnCode;

    // Func start
    code += ' {\n';

    let bodyMap: CodeMap;
    switch (io.action.actionType) {
      case dd.ActionType.select: {
        bodyMap = this.select(io as SelectIO);
        break;
      }

      case dd.ActionType.update: {
        bodyMap = this.update(io as UpdateIO);
        break;
      }

      case dd.ActionType.insert: {
        bodyMap = this.insert(io as InsertIO);
        break;
      }

      case dd.ActionType.delete: {
        bodyMap = this.delete(io as DeleteIO);
        break;
      }

      default: {
        throw new Error(
          `Not supported action type "${
            io.action.actionType
          }" in goBuilder.processActionIO`,
        );
      }
    }

    // Add starting indent to all body lines
    const bodyLines = bodyMap.body.match(/[^\r\n]+/g) || [bodyMap.body];
    code += bodyLines.map(line => `\t${line}`).join('\n');

    // Closing func
    code += '\n}\n';

    if (bodyMap.header) {
      return `${bodyMap.header}\n${code}`;
    }
    return code;
  }

  private buildTableObject(): string {
    const { className, instanceName } = this.taIO;
    let code = go.struct(className, []);
    code += `// ${instanceName} ...
var ${dd.utils.capitalizeFirstLetter(instanceName)} = &${className}{}\n\n`;
    return code;
  }

  private select(io: SelectIO): CodeMap {
    const { action } = io;
    const { pagination } = action;

    // We only need the type name here, the namespace(import) is already handled in `processActionIO`
    const firstReturn = io.returnVarList.getByIndex(0);
    const resultType = firstReturn.type.typeName;
    // originalResultType is used to generate additional type definition, e.g. resultType is '[]*Person', the origianlResultType is 'Person'
    const originalResultType = firstReturn.originalName || resultType;
    // Additional type definition for result type, empty on select field action
    let resultTypeDef: string | undefined;
    let code = '';
    // Selected columns
    const selectedFields: go.InstanceVariable[] = [];
    for (const col of io.cols) {
      const fieldName = col.varName;
      const typeInfo = this.dialect.convertColumnType(col.getResultType());
      selectedFields.push(
        new go.InstanceVariable(fieldName, typeInfo.typeName),
      );
      if (typeInfo.namespace) {
        this.imports.add(typeInfo.namespace);
      }
    }

    // Generate result type definition
    if (!action.isSelectField) {
      resultTypeDef = go.struct(originalResultType, selectedFields);
    }

    const queryParamsCode = io.inputVarList.list
      .map(p => `, ${p.name}`)
      .join('');
    let sqlSource = io.sql;
    if (pagination) {
      sqlSource += ' LIMIT ? OFFSET ?';
    }
    const sqlLiteral = go.makeStringLiteral(sqlSource);
    if (action.isSelectAll) {
      const scanParams = joinParams(selectedFields.map(p => `&item.${p.name}`));
      // > call Query
      code += `rows, err := ${QueryableParam}.Query(${sqlLiteral}${queryParamsCode})
if err != nil {
\treturn nil, err
}
${go.makeArray(ResultVar, `*${originalResultType}`, 0, pagination ? Limit : 0)}
defer rows.Close()
for rows.Next() {
\t${go.pointerVar('item', originalResultType)}
\terr = rows.Scan(${scanParams})
\tif err != nil {
\t\treturn nil, err
\t}
\tresult = append(result, item)
}
err = rows.Err()
if err != nil {
\treturn nil, err
}
`;
    } else {
      // select/selectField
      let scanParams: string;
      // Declare the result variable
      if (action.isSelectField) {
        scanParams = `&${ResultVar}`;
        code += `var ${ResultVar} ${resultType}`;
      } else {
        scanParams = joinParams(
          selectedFields.map(p => `&${ResultVar}.${p.name}`),
        );
        code += `${go.pointerVar(ResultVar, originalResultType)}`;
      }
      // For selectField, we return the default value, for select, return nil
      const resultVarOnError = action.isSelectField ? 'result' : 'nil';
      code += '\n';

      // Call query func
      code += `err := ${QueryableParam}.QueryRow(${sqlLiteral}${queryParamsCode}).Scan(${scanParams})
if err != nil {
\treturn ${resultVarOnError}, err
}
`;
    }
    // Return the result
    code += `return ${ResultVar}, nil`;

    return new CodeMap(code, resultTypeDef);
  }

  private update(io: UpdateIO): CodeMap {
    const { action } = io;
    let code = '';

    const queryParamsCode = io.queryVarList.list
      .map(p => `, ${p.name}`)
      .join('');
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `${ResultVar}, err := ${QueryableParam}.Exec(${sqlLiteral}${queryParamsCode})\n`;

    // Return the result
    if (action.checkOnlyOneAffected) {
      code += `return dbx.CheckOneRowAffectedWithError(${ResultVar}, err)`;
    } else {
      code += `return dbx.GetRowsAffectedIntWithError(${ResultVar}, err)`;
    }
    return new CodeMap(code);
  }

  private insert(io: InsertIO): CodeMap {
    const { action } = io;
    let code = '';

    const queryParamsCode = io.inputVarList.list
      .map(p => `, ${p.name}`)
      .join('');
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `${
      action.fetchInsertedID ? 'result' : '_'
    }, err := ${QueryableParam}.Exec(${sqlLiteral}${queryParamsCode})
`;

    // Return the result
    if (action.fetchInsertedID) {
      code += `return dbx.GetLastInsertIDUint64WithError(${ResultVar}, err)`;
    } else {
      code += 'return err';
    }
    return new CodeMap(code);
  }

  private delete(io: DeleteIO): CodeMap {
    const { action } = io;
    let code = '';

    const queryParamsCode = io.inputVarList.list
      .map(p => `, ${p.name}`)
      .join('');
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `${ResultVar}, err := ${QueryableParam}.Exec(${sqlLiteral}${queryParamsCode})\n`;
    // Return the result
    if (action.checkOnlyOneAffected) {
      code += `return dbx.CheckOneRowAffectedWithError(${ResultVar}, err)`;
    } else {
      code += `return dbx.GetRowsAffectedIntWithError(${ResultVar}, err)`;
    }
    return new CodeMap(code);
  }

  private scanImports(varList: VarList) {
    for (const info of varList.list) {
      if (info.type.namespace) {
        this.imports.add(info.type.namespace);
      }
    }
  }

  // A varList usually ends without an error type, call this to append an Go error type to the varList
  private appendErrorType(varList: VarList): VarInfo[] {
    return [...varList.list, new VarInfo('error', new TypeInfo('error'))];
  }
}
