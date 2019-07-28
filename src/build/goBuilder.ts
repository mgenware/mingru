import { Dialect } from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SelectIO } from '../io/selectIO';
import { UpdateIO } from '../io/updateIO';
import { InsertIO } from '../io/insertIO';
import { DeleteIO } from '../io/deleteIO';
import VarInfo, { TypeInfo } from '../lib/varInfo';
import * as go from './go';
import * as defs from '../defs';
import logger from '../logger';
import { TAIO } from '../io/taIO';
import { ActionIO } from '../io/actionIO';
import { WrapIO } from '../io/wrapIO';
import { TransactIO } from '../io/transactIO';
import LinesBuilder from './linesBuilder';
import * as utils from '../io/utils';

function joinParams(arr: string[]): string {
  return arr.join(', ');
}

// For some actions, like SELECT, it uses CodeMap type to return multiple code blocks.
/**
 * <CodeMap.head>
 * func foo(...) { // auto generated
 *   <CodeMap.body>
 * } // closing brace, auto generated
 * <CodeMap.tail>
 */
class CodeMap {
  constructor(
    public body: string,
    public head?: string,
    public tail?: string,
  ) {}
}

export default class GoBuilder {
  private imports = new Set<string>();
  private dialect: Dialect;

  constructor(public taIO: TAIO, public packageName = 'da') {
    throwIfFalsy(taIO, 'taIO');
    this.dialect = taIO.dialect;
  }

  build(noHeader: boolean): string {
    let code = noHeader ? '' : defs.fileHeader;
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
      code += this.handleActionIO(actionIO);
    }
    return code;
  }

  private handleActionIO(io: ActionIO, pri?: boolean): string {
    logger.debug(`Building action "${io.action.__name}"`);

    // Prepare variables
    const funcName = pri ? utils.lowercaseFirstChar(io.funcName) : io.funcName;
    const funcArgs = io.funcArgs.distinctList;
    const returnValues = io.returnValues.list;
    const { className: tableClassName } = this.taIO;
    let code = '';

    // Build func head
    if (!pri) {
      code += `// ${funcName} ...\n`;
    }
    code += `func (da *${tableClassName}) ${funcName}`;

    // Build func params
    // Use funcArgs.distinctList as duplicate var defs are not allowed in func args
    this.scanImports(funcArgs);
    const funcParamsCode = funcArgs
      .map(p => `${p.name} ${p.type.typeName}`)
      .join(', ');
    code += `(${funcParamsCode})`;

    // Build return values
    this.scanImports(returnValues);
    const returnsWithError = this.appendErrorType(returnValues);
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

      case dd.ActionType.wrap: {
        bodyMap = this.wrap(io as WrapIO);
        break;
      }

      case dd.ActionType.transact: {
        bodyMap = this.transact(io as TransactIO);
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

    // Increase indent on all body lines
    code += this.increaseIndent(bodyMap.body);

    // Closing func
    code += '\n}\n';

    if (bodyMap.head) {
      code = `${bodyMap.head}\n${code}`;
    }
    if (bodyMap.tail) {
      code = `${code}\n${bodyMap.tail}`;
    }
    return code;
  }

  private buildTableObject(): string {
    const { className, instanceName } = this.taIO;
    let code = go.struct(className, []);
    code += `\n// ${instanceName} ...
var ${dd.utils.capitalizeFirstLetter(instanceName)} = &${className}{}\n\n`;
    return code;
  }

  private select(io: SelectIO): CodeMap {
    const { action } = io;
    const selMode = action.mode;
    const isPageMode = selMode === dd.SelectActionMode.page;
    let { hasLimit } = action;
    if (isPageMode) {
      // Page mode can be considered a special case of hasLimit
      hasLimit = true;
    }

    // We only need the type name here, the namespace(import) is already handled in `processActionIO`
    const firstReturn = io.returnValues.getByIndex(0);
    const resultType = firstReturn.type.typeName;
    // originalResultType is used to generate additional type definition, e.g. resultType is '[]*Person', the origianlResultType is 'Person'
    const originalResultType = firstReturn.originalName || resultType;
    // Additional type definition for result type, empty on select field action
    let resultTypeDef: string | undefined;
    let errReturnCode = '';
    if (isPageMode) {
      errReturnCode = 'nil, false, err';
    } else if (hasLimit) {
      errReturnCode = 'nil, 0, err';
    } else {
      errReturnCode = 'nil, err';
    }
    errReturnCode = 'return ' + errReturnCode;

    let succReturnCode = '';
    if (isPageMode) {
      succReturnCode = `${defs.resultVarName}, itemCounter > len(result), nil`;
    } else if (hasLimit) {
      succReturnCode = `${defs.resultVarName}, itemCounter, nil`;
    } else {
      succReturnCode = `${defs.resultVarName}, nil`;
    }
    succReturnCode = 'return ' + succReturnCode;

    const codeBuilder = new LinesBuilder();

    // Selected columns
    const selectedFields: go.InstanceVariable[] = [];
    for (const col of io.cols) {
      const fieldName = col.varName;
      const typeInfo = this.dialect.colTypeToGoType(col.getResultType());
      selectedFields.push(
        new go.InstanceVariable(fieldName, typeInfo.typeName),
      );
      if (typeInfo.namespace) {
        this.imports.add(typeInfo.namespace);
      }
    }

    // Generate result type definition
    if (selMode !== dd.SelectActionMode.field) {
      resultTypeDef = go.struct(originalResultType, selectedFields);
    }

    const queryParamsCode = io.execArgs.list
      .map(p => `, ${p.valueOrName}`)
      .join('');
    let sqlSource = io.sql;
    if (hasLimit) {
      sqlSource += ' LIMIT ? OFFSET ?';
    }
    const sqlLiteral = go.makeStringLiteral(sqlSource);
    if (selMode === dd.SelectActionMode.list || isPageMode) {
      const scanParams = joinParams(selectedFields.map(p => `&item.${p.name}`));
      if (isPageMode) {
        codeBuilder.pushLines(
          'limit := pageSize + 1',
          'offset := (page - 1) * pageSize',
          'max := pageSize',
        );
      }
      // Call the Query method
      codeBuilder.push(
        `rows, err := ${
          defs.queryableParam
        }.Query(${sqlLiteral}${queryParamsCode})`,
      );
      codeBuilder.push('if err != nil {');
      codeBuilder.incrementIndent();
      codeBuilder.push(errReturnCode);
      codeBuilder.decrementIndent();
      codeBuilder.push('}');
      codeBuilder.pushLines(
        go.makeArray(
          defs.resultVarName,
          `*${originalResultType}`,
          0,
          hasLimit ? defs.limitVarName : 0,
        ),
        hasLimit ? 'itemCounter := 0' : null,
        'defer rows.Close()',
        'for rows.Next() {',
      );
      codeBuilder.incrementIndent();
      // Wrap the object scan code inside a "if itemCounter <= max" block if hasLimit
      if (hasLimit) {
        codeBuilder.pushLines('itemCounter++', 'if itemCounter <= max {');
        codeBuilder.incrementIndent();
      }
      codeBuilder.pushLines(
        go.pointerVar('item', originalResultType),
        `err = rows.Scan(${scanParams})`,
        `if err != nil {`,
      );
      codeBuilder.incrementIndent();
      codeBuilder.push(errReturnCode);
      codeBuilder.decrementIndent();
      codeBuilder.push('}');
      codeBuilder.push('result = append(result, item)');
      if (hasLimit) {
        codeBuilder.decrementIndent();
        codeBuilder.push('}');
      }
      codeBuilder.decrementIndent();
      codeBuilder.push('}');
      codeBuilder.push('err = rows.Err()');
      codeBuilder.push('if err != nil {');
      codeBuilder.incrementIndent();
      codeBuilder.push(errReturnCode);
      codeBuilder.decrementIndent();
      codeBuilder.push('}');
    } else {
      // select/selectField
      let scanParams: string;
      // Declare the result variable
      if (selMode === dd.SelectActionMode.field) {
        scanParams = `&${defs.resultVarName}`;
        codeBuilder.push(`var ${defs.resultVarName} ${resultType}`);
      } else {
        scanParams = joinParams(
          selectedFields.map(p => `&${defs.resultVarName}.${p.name}`),
        );
        codeBuilder.push(
          `${go.pointerVar(defs.resultVarName, originalResultType)}`,
        );
      }
      // For selectField, we return the default value, for select, return nil
      const resultVarOnError =
        selMode === dd.SelectActionMode.field ? 'result' : 'nil';
      codeBuilder.push();

      // Call query func
      codeBuilder.push(
        `err := ${
          defs.queryableParam
        }.QueryRow(${sqlLiteral}${queryParamsCode}).Scan(${scanParams})`,
      );
      codeBuilder.push('if err != nil {');
      codeBuilder.incrementIndent();
      codeBuilder.push(`return ${resultVarOnError}, err`);
      codeBuilder.decrementIndent();
      codeBuilder.push('}');
    }
    // Return the result
    codeBuilder.push(succReturnCode);

    return new CodeMap(codeBuilder.toString(), resultTypeDef);
  }

  private update(io: UpdateIO): CodeMap {
    const { action } = io;
    let code = '';

    const queryParamsCode = io.execArgs.list
      .map(p => `, ${p.valueOrName}`)
      .join('');
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `${defs.resultVarName}, err := ${
      defs.queryableParam
    }.Exec(${sqlLiteral}${queryParamsCode})\n`;

    // Return the result
    if (action.ensureOneRowAffected) {
      code += `return dbx.CheckOneRowAffectedWithError(${
        defs.resultVarName
      }, err)`;
    } else {
      code += `return dbx.GetRowsAffectedIntWithError(${
        defs.resultVarName
      }, err)`;
    }
    return new CodeMap(code);
  }

  private insert(io: InsertIO): CodeMap {
    const { fetchInsertedID } = io;
    let code = '';

    const queryParamsCode = io.execArgs.list
      .map(p => `, ${p.valueOrName}`)
      .join('');
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `${fetchInsertedID ? 'result' : '_'}, err := ${
      defs.queryableParam
    }.Exec(${sqlLiteral}${queryParamsCode})
`;

    // Return the result
    if (fetchInsertedID) {
      code += `return dbx.GetLastInsertIDUint64WithError(${
        defs.resultVarName
      }, err)`;
    } else {
      code += 'return err';
    }
    return new CodeMap(code);
  }

  private delete(io: DeleteIO): CodeMap {
    const { action } = io;
    let code = '';

    const queryParamsCode = io.execArgs.list
      .map(p => `, ${p.valueOrName}`)
      .join('');
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `${defs.resultVarName}, err := ${
      defs.queryableParam
    }.Exec(${sqlLiteral}${queryParamsCode})\n`;
    // Return the result
    if (action.ensureOneRowAffected) {
      code += `return dbx.CheckOneRowAffectedWithError(${
        defs.resultVarName
      }, err)`;
    } else {
      code += `return dbx.GetRowsAffectedIntWithError(${
        defs.resultVarName
      }, err)`;
    }
    return new CodeMap(code);
  }

  private wrap(io: WrapIO): CodeMap {
    let code = '';

    const queryParamsCode = io.execArgs.list
      .map(p => `${p.valueOrName}`)
      .join(', ');
    code += `return ${io.funcPath}(${queryParamsCode})\n`;
    return new CodeMap(code);
  }

  private transact(io: TransactIO): CodeMap {
    let headCode = '';
    let innerBody = '';
    const { memberIOs, returnValues, lastInsertedMember } = io;

    // We don't use queryable in transaction arguments but we still need to import the dbx namespace as we're calling dbx.transact.
    this.scanImports([defs.dbxQueryableVar]);

    // Declare err
    innerBody += 'var err error\n';

    let memberIdx = -1;
    const memberCount = memberIOs.length;
    for (const memberIO of memberIOs) {
      memberIdx++;
      const mActionIO = memberIO.actionIO;
      if (lastInsertedMember === memberIO) {
        innerBody += `${mActionIO.returnValues.list[0].name}, `;
      } else if (mActionIO.returnValues.length) {
        // Ignore all return values: _, _, _, err = action(a, b, ...)
        innerBody += '_, '.repeat(mActionIO.returnValues.length);
      }
      innerBody += 'err = ';
      innerBody += memberIO.callPath;
      // Generating the calling code of this member
      const queryParamsCode = mActionIO.funcArgs.list
        .slice(1) // Stripe the first queryable param
        .map(p => `${p.name}`)
        .join(', ');
      // If this is a temp member (created inside transaction),
      // then we also need to generate the member func body code.
      if (memberIO.isTemp) {
        const methodCode = this.handleActionIO(memberIO.actionIO, true);
        // Put func code into head
        headCode += methodCode;
        if (memberIdx !== memberCount - 1) {
          headCode += '\n';
        }
      }

      innerBody += '(tx';
      if (queryParamsCode) {
        innerBody += `, ${queryParamsCode}`;
      }
      innerBody += ')\n';
      innerBody += `\nif err != nil {\n\treturn err\n}\n`;
    }
    innerBody += 'return nil\n';

    let body = '';
    // Declare return variables if needed
    if (returnValues.length) {
      this.scanImports(returnValues.list);
      for (const v of returnValues.list) {
        body += `var ${v.name} ${v.type.typeName}\n`;
      }
    }
    body += 'txErr := dbx.Transact(db, func(tx *sql.Tx) error {\n';
    body += this.increaseIndent(innerBody);
    body += '\n})\nreturn ';
    if (returnValues.length) {
      for (const v of returnValues.list) {
        body += `${v.name}, `;
      }
    }
    body += 'txErr\n';
    return new CodeMap(body, headCode);
  }

  private scanImports(vars: VarInfo[]) {
    for (const info of vars) {
      if (info.type.namespace) {
        this.imports.add(info.type.namespace);
      }
    }
  }

  // A varList usually ends without an error type, call this to append an Go error type to the varList
  private appendErrorType(vars: VarInfo[]): VarInfo[] {
    return [...vars, new VarInfo('error', new TypeInfo('error'))];
  }

  private increaseIndent(code: string): string {
    const lines = code.match(/[^\r\n]+/g) || [code];
    return lines.map(line => `\t${line}`).join('\n');
  }
}
