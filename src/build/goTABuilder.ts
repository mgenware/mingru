/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Dialect } from '../dialect';
import { SelectIO } from '../io/selectIO';
import { UpdateIO } from '../io/updateIO';
import { InsertIO } from '../io/insertIO';
import { DeleteIO } from '../io/deleteIO';
import VarInfo, { TypeInfo } from '../lib/varInfo';
import * as go from './goCode';
import * as defs from '../defs';
import logger from '../logger';
import { TAIO } from '../io/taIO';
import { ActionIO } from '../io/actionIO';
import { WrapIO } from '../io/wrapIO';
import { TransactIO } from '../io/transactIO';
import LinesBuilder from './linesBuilder';
import * as utils from '../lib/stringUtils';
import { BuildOptions, JSONEncodingStyle } from './buildOptions';
import GoBuilderContext from './goBuilderContext';

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

export default class GoTABuilder {
  private options: BuildOptions;
  private imports = new go.ImportList();
  private dialect: Dialect;

  constructor(
    public taIO: TAIO,
    public opts: BuildOptions,
    public context: GoBuilderContext,
  ) {
    throwIfFalsy(taIO, 'taIO');
    this.dialect = taIO.dialect;
    this.options = opts;
  }

  build(): string {
    const { options } = this;
    let code = options.noFileHeader ? '' : defs.fileHeader;
    code += `package ${options.packageName || defs.defaultPackageName}\n\n`;

    // this.buildActions will set this.systemImports and this.userImports
    let body = '';
    body += this.buildTableObject();
    body += go.sep('Actions');
    body += this.buildActions();

    // Add imports
    code = code + this.imports.code() + body;
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

    // Prepare variables.
    const funcName = pri ? utils.lowercaseFirstChar(io.funcName) : io.funcName;
    // Used for generating interface member if needed.
    let funcSigString = '';
    // Use funcArgs.distinctList cuz duplicate vars are not allowed.
    const funcArgs = io.funcArgs.distinctList;
    const returnValues = io.returnValues.list;
    const { className: tableClassName } = this.taIO;
    let code = '';

    // Build func head.
    if (!pri) {
      code += `// ${funcName} ...\n`;
    }
    funcSigString += `func (da *${tableClassName}) ${funcName}`;

    // Build func params
    // allFuncArgs = original func args + arg stubs.
    const allFuncArgs = [...funcArgs, ...io.funcStubs];
    this.imports.addVars(allFuncArgs);
    const funcParamsCode = allFuncArgs
      .map((p) => `${p.name} ${p.type.typeString}`)
      .join(', ');
    // Wrap all params with parentheses.
    funcSigString += `(${funcParamsCode})`;

    // Build return values.
    this.imports.addVars(returnValues);
    const returnsWithError = this.appendErrorType(returnValues);
    let returnCode = returnsWithError.map((v) => v.type.typeString).join(', ');
    if (returnsWithError.length > 1) {
      returnCode = `(${returnCode})`;
    }
    if (returnCode) {
      returnCode = ' ' + returnCode;
    }
    funcSigString += returnCode;
    code += funcSigString;

    const actionAttr = io.action.__attrs;
    if (actionAttr[mm.ActionAttributes.groupTypeName]) {
      // Remove the type name from signature:
      // example: func (a) name() ret -> name() ret.
      const idx = funcSigString.indexOf(')');
      funcSigString = funcSigString.substr(idx + 2);

      const funcSig = new go.FuncSignature(
        funcName,
        funcSigString,
        allFuncArgs,
        returnsWithError,
      );

      this.context.handleInterfaceMember(
        actionAttr[mm.ActionAttributes.groupTypeName] as string,
        funcSig,
      );
    }

    // Func start.
    code += ' {\n';

    let bodyMap: CodeMap;
    switch (io.action.actionType) {
      case mm.ActionType.select: {
        bodyMap = this.select(io as SelectIO);
        break;
      }

      case mm.ActionType.update: {
        bodyMap = this.update(io as UpdateIO);
        break;
      }

      case mm.ActionType.insert: {
        bodyMap = this.insert(io as InsertIO);
        break;
      }

      case mm.ActionType.delete: {
        bodyMap = this.delete(io as DeleteIO);
        break;
      }

      case mm.ActionType.wrap: {
        bodyMap = this.wrap(io as WrapIO);
        break;
      }

      case mm.ActionType.transact: {
        bodyMap = this.transact(io as TransactIO);
        break;
      }

      default: {
        throw new Error(
          `Not supported action type "${io.action.actionType}" in goBuilder.processActionIO`,
        );
      }
    }

    // Increase indent on all body lines.
    code += this.increaseIndent(bodyMap.body);

    // Closing func.
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
    let code = go.struct(className, [], JSONEncodingStyle.none);
    code += `\n// ${instanceName} ...
var ${mm.utils.capitalizeFirstLetter(instanceName)} = &${className}{}\n\n`;
    return code;
  }

  private select(io: SelectIO): CodeMap {
    const { options } = this;
    const { action } = io;
    const selMode = action.mode;
    const isPageMode = selMode === mm.SelectActionMode.page;
    const { limitValue, offsetValue } = action;
    const isLimitInput = limitValue instanceof mm.SQLVariable;
    const isOffsetInput = offsetValue instanceof mm.SQLVariable;
    let { pagination } = action;
    if (isPageMode) {
      // Page mode can be considered a special case of pagination.
      pagination = true;
    }

    // We only need the type name here, the namespace(import) is already
    // handled in `processActionIO`.
    const firstReturn = io.returnValues.getByIndex(0);
    const resultType = firstReturn.type.typeString;
    // originalResultType is used to generate additional type definition,
    // e.g. resultType is '[]*Person', the originalResultType is 'Person'.
    const originalResultType = firstReturn.type.sourceTypeString || resultType;
    // Additional type definition for result type, empty on select field action.
    let resultTypeDef: string | undefined;
    let errReturnCode = '';
    if (isPageMode) {
      errReturnCode = 'nil, false, err';
    } else if (pagination) {
      errReturnCode = 'nil, 0, err';
    } else {
      errReturnCode = 'nil, err';
    }
    errReturnCode = 'return ' + errReturnCode;

    let succReturnCode = '';
    if (isPageMode) {
      succReturnCode = `${defs.resultVarName}, itemCounter > len(result), nil`;
    } else if (pagination) {
      succReturnCode = `${defs.resultVarName}, itemCounter, nil`;
    } else {
      succReturnCode = `${defs.resultVarName}, nil`;
    }
    succReturnCode = 'return ' + succReturnCode;

    const codeBuilder = new LinesBuilder();

    // Selected columns.
    const selectedFields: VarInfo[] = [];
    const jsonIgnoreFields = new Set<VarInfo>();
    const omitEmptyFields = new Set<VarInfo>();
    const omitAllEmptyFields =
      options.jsonEncoding?.excludeEmptyValues || false;

    for (const col of io.cols) {
      const fieldName = mm.utils.toPascalCase(col.varName);
      const typeInfo = this.dialect.colTypeToGoType(col.getResultType());
      const varInfo = new VarInfo(fieldName, typeInfo);

      selectedFields.push(varInfo);

      // Checking explicitly set attributes.
      if (col.selectedColumn instanceof mm.RawColumn) {
        const attrs = col.selectedColumn.__attrs;
        if (attrs[mm.ColumnAttributes.isPrivate] === true) {
          jsonIgnoreFields.add(varInfo);
        }
        if (
          omitAllEmptyFields ||
          attrs[mm.ColumnAttributes.excludeEmptyValue] === true
        ) {
          omitEmptyFields.add(varInfo);
        }
      }

      // Checking inherited attributes.
      if (omitAllEmptyFields) {
        omitEmptyFields.add(varInfo);
      }
    }

    // Generate result type definition.
    const resultMemberJSONStyle =
      options.jsonEncoding?.encodingStyle || JSONEncodingStyle.none;
    if (
      selMode !== mm.SelectActionMode.field &&
      selMode !== mm.SelectActionMode.exists
    ) {
      if (action.__attrs[mm.ActionAttributes.resultTypeName]) {
        this.context.handleResultType(
          originalResultType,
          new go.StructInfo(
            originalResultType,
            selectedFields,
            resultMemberJSONStyle,
            jsonIgnoreFields,
            omitEmptyFields,
          ),
        );
      } else {
        resultTypeDef = go.struct(
          originalResultType,
          selectedFields,
          resultMemberJSONStyle,
          jsonIgnoreFields,
          omitEmptyFields,
        );

        this.imports.addVars(selectedFields);
      }
    }

    const queryParamsCode = io.execArgs.list
      .map((p) => `, ${p.valueOrName}`)
      .join('');
    let sqlSource = io.sql;

    // LIMIT and OFFSET
    if (pagination) {
      sqlSource += ' LIMIT ? OFFSET ?';
    } else if (limitValue !== undefined) {
      sqlSource += ' LIMIT ';
      sqlSource += isLimitInput ? '?' : limitValue.toString();

      if (offsetValue !== undefined) {
        sqlSource += ' OFFSET ';
        sqlSource += isOffsetInput ? '?' : offsetValue.toString();
      }
    }

    const sqlLiteral = go.makeStringLiteral(sqlSource);
    if (selMode === mm.SelectActionMode.list || isPageMode) {
      const scanParams = joinParams(
        selectedFields.map((p) => `&item.${p.name}`),
      );
      if (isPageMode) {
        codeBuilder.pushLines(
          'limit := pageSize + 1',
          'offset := (page - 1) * pageSize',
          'max := pageSize',
        );
      }
      // Call the Query method
      codeBuilder.push(
        `rows, err := ${defs.queryableParam}.Query(${sqlLiteral}${queryParamsCode})`,
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
          pagination ? defs.limitVarName : 0,
        ),
        pagination ? 'itemCounter := 0' : null,
        'defer rows.Close()',
        'for rows.Next() {',
      );
      codeBuilder.incrementIndent();
      // Wrap the object scan code inside a "if itemCounter <= max" block if hasLimit
      if (pagination) {
        codeBuilder.pushLines('itemCounter++', 'if itemCounter <= max {');
        codeBuilder.incrementIndent();
      }
      codeBuilder.pushLines(
        go.pointerVar('item', originalResultType),
        `err = rows.Scan(${scanParams})`,
        'if err != nil {',
      );
      codeBuilder.incrementIndent();
      codeBuilder.push(errReturnCode);
      codeBuilder.decrementIndent();
      codeBuilder.push('}');
      codeBuilder.push('result = append(result, item)');
      if (pagination) {
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
      // For `select/selectField`.
      let scanParams: string;
      // Declare the result variable.
      if (
        selMode === mm.SelectActionMode.field ||
        selMode === mm.SelectActionMode.exists
      ) {
        scanParams = `&${defs.resultVarName}`;
        codeBuilder.push(`var ${defs.resultVarName} ${resultType}`);
      } else {
        scanParams = joinParams(
          selectedFields.map((p) => `&${defs.resultVarName}.${p.name}`),
        );
        codeBuilder.push(
          `${go.pointerVar(defs.resultVarName, originalResultType)}`,
        );
      }
      // For `selectField` and `selectExists`, we return the default value,
      // for `select`, return nil.
      const resultVarOnError =
        selMode === mm.SelectActionMode.field ||
        selMode === mm.SelectActionMode.exists
          ? 'result'
          : 'nil';
      codeBuilder.push();

      // Call query func
      codeBuilder.push(
        `err := ${defs.queryableParam}.QueryRow(${sqlLiteral}${queryParamsCode}).Scan(${scanParams})`,
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
      .map((p) => `, ${p.valueOrName}`)
      .join('');
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `${defs.resultVarName}, err := ${defs.queryableParam}.Exec(${sqlLiteral}${queryParamsCode})\n`;

    // Return the result
    if (action.ensureOneRowAffected) {
      code += `return mingru.CheckOneRowAffectedWithError(${defs.resultVarName}, err)`;
    } else {
      code += `return mingru.GetRowsAffectedIntWithError(${defs.resultVarName}, err)`;
    }
    return new CodeMap(code);
  }

  private insert(io: InsertIO): CodeMap {
    const { fetchInsertedID } = io;
    let code = '';

    const queryParamsCode = io.execArgs.list
      .map((p) => `, ${p.valueOrName}`)
      .join('');
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `${fetchInsertedID ? 'result' : '_'}, err := ${
      defs.queryableParam
    }.Exec(${sqlLiteral}${queryParamsCode})
`;

    // Return the result
    if (fetchInsertedID) {
      code += `return mingru.GetLastInsertIDUint64WithError(${defs.resultVarName}, err)`;
    } else {
      code += 'return err';
    }
    return new CodeMap(code);
  }

  private delete(io: DeleteIO): CodeMap {
    const { action } = io;
    let code = '';

    const queryParamsCode = io.execArgs.list
      .map((p) => `, ${p.valueOrName}`)
      .join('');
    const sqlLiteral = go.makeStringLiteral(io.sql);
    code += `${defs.resultVarName}, err := ${defs.queryableParam}.Exec(${sqlLiteral}${queryParamsCode})\n`;
    // Return the result
    if (action.ensureOneRowAffected) {
      code += `return mingru.CheckOneRowAffectedWithError(${defs.resultVarName}, err)`;
    } else {
      code += `return mingru.GetRowsAffectedIntWithError(${defs.resultVarName}, err)`;
    }
    return new CodeMap(code);
  }

  private wrap(io: WrapIO): CodeMap {
    let code = '';

    const queryParamsCode = io.execArgs.list
      .map((p) => `${p.valueOrName}`)
      .join(', ');
    code += `return ${io.funcPath}(${queryParamsCode})\n`;
    return new CodeMap(code);
  }

  private transact(io: TransactIO): CodeMap {
    let headCode = '';
    let innerBody = '';
    const { memberIOs, returnValues } = io;

    // We don't use queryable in transaction arguments but we still need to
    // import the dbx namespace as we're calling mingru.transact.
    this.imports.addVars([defs.dbxQueryableVar]);

    // Declare err variable.
    innerBody += 'var err error\n';

    let memberIdx = -1;
    const memberCount = memberIOs.length;
    for (const memberIO of memberIOs) {
      memberIdx++;
      const mActionIO = memberIO.actionIO;

      // Return value code:
      // e.g. _, val1, _, val2, err = action(a, b, ...)
      const declaredReturnValueNames = memberIO.member.returnValues || {};

      // Iterate through return values.
      let hasDeclaredVars = false;
      for (const ret of mActionIO.returnValues.list) {
        // Check if this value has been exported (declared).
        const varName = declaredReturnValueNames[ret.name];
        if (varName) {
          hasDeclaredVars = true;
        }
        innerBody += `${varName || '_'}, `;
      }
      innerBody += `err ${hasDeclaredVars ? ':' : ''}= `;
      innerBody += memberIO.callPath;
      // Generating the calling code of this member
      const queryParamsCode = mActionIO.funcArgs.list
        .slice(1) // Strip the first queryable param
        .map((p) => p.valueOrName)
        .join(', ');
      // If this is a temp member (created inside transaction),
      // then we also need to generate the member func body code.
      if (memberIO.isTemp) {
        const methodCode = this.handleActionIO(memberIO.actionIO, true);
        // Put func code into head.
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
      innerBody += '\nif err != nil {\n\treturn err\n}\n';
    }

    // Assign inner variables to outer return values if needed.
    if (returnValues.length) {
      for (const v of returnValues.list) {
        innerBody += `${this.txExportedVar(v.name)} = ${v.name}\n`;
      }
    }

    innerBody += 'return nil\n';

    let body = '';
    // Declare return variables if needed.
    if (returnValues.length) {
      this.imports.addVars(returnValues.list);
      for (const v of returnValues.list) {
        body += `var ${this.txExportedVar(v.name)} ${v.type.typeString}\n`;
      }
    }
    body += 'txErr := mingru.Transact(db, func(tx *sql.Tx) error {\n';
    body += this.increaseIndent(innerBody);
    body += '\n})\nreturn ';
    if (returnValues.length) {
      for (const v of returnValues.list) {
        body += `${this.txExportedVar(v.name)}, `;
      }
    }
    body += 'txErr\n';
    return new CodeMap(body, headCode);
  }

  // A varList usually ends without an error type, call this to append
  // an Go error type to the varList.
  private appendErrorType(vars: VarInfo[]): VarInfo[] {
    return [...vars, new VarInfo('error', TypeInfo.type('error'))];
  }

  private increaseIndent(code: string): string {
    const lines = code.match(/[^\r\n]+/g) || [code];
    return lines.map((line) => `\t${line}`).join('\n');
  }

  private txExportedVar(name: string): string {
    return `${name}Exported`;
  }
}
