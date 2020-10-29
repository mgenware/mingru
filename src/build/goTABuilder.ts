/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Dialect } from '../dialect';
import { SelectIO } from '../io/selectIO';
import { UpdateIO } from '../io/updateIO';
import { InsertIO } from '../io/insertIO';
import { DeleteIO } from '../io/deleteIO';
import VarInfo, { CompoundTypeInfo, getAtomicTypeInfo } from '../lib/varInfo';
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
 * func foo(...) { // generated in outer scope.
 *   <CodeMap.body>
 * } // closing brace, generated in outer scope.
 * <CodeMap.tail>
 */
class CodeMap {
  constructor(public body: LinesBuilder, public head?: string, public tail?: string) {}
}

export default class GoTABuilder {
  private options: BuildOptions;
  private imports = new go.ImportList();
  private dialect: Dialect;

  constructor(public taIO: TAIO, public opts: BuildOptions, public context: GoBuilderContext) {
    throwIfFalsy(taIO, 'taIO');
    this.dialect = taIO.opt.dialect;
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
    for (const actionIO of this.taIO.actionIOs) {
      code += '\n';
      code += this.buildActionIO(actionIO, undefined);
    }
    return code;
  }

  // `fallbackActionName` used by TRANSACT members as they don't have a `__name`.
  private buildActionIO(
    io: ActionIO,
    fallbackActionName: string | undefined,
    pri?: boolean,
  ): string {
    logger.debug(`Building action "${io.action.__name}"`);
    const actionName = io.action.__name || fallbackActionName;
    if (!actionName) {
      throw new Error(`Unexpected empty action name, action "${io.action.__name}"`);
    }
    const ioFuncName = utils.actionPascalName(actionName);

    // Prepare variables.
    const funcName = pri ? utils.lowercaseFirstChar(ioFuncName) : ioFuncName;
    // Used for generating interface member if needed.
    let funcSigString = '';
    // Use funcArgs.distinctList cuz duplicate vars are not allowed.
    const funcArgs = io.funcArgs.distinctList;
    const returnValues = io.returnValues.list;
    const { className: tableClassName } = this.taIO;
    const builder = new LinesBuilder();

    // Build func head.
    if (!pri) {
      builder.push(`// ${funcName} ...`);
    }
    funcSigString += `func (da *${tableClassName}) ${funcName}`;

    // Build func params
    // allFuncArgs = original func args + arg stubs.
    const allFuncArgs = [...funcArgs, ...io.funcStubs];
    this.imports.addVars(allFuncArgs);
    const funcParamsCode = allFuncArgs.map((p) => `${p.name} ${p.type.typeString}`).join(', ');
    // Wrap all params with parentheses.
    funcSigString += `(${funcParamsCode})`;

    // Build return values.
    this.imports.addVars(returnValues);
    const returnValuesWithError = this.appendErrorType(returnValues);
    let returnCode = returnValuesWithError.map((v) => v.type.typeString).join(', ');
    if (returnValuesWithError.length > 1) {
      returnCode = `(${returnCode})`;
    }
    if (returnCode) {
      returnCode = ' ' + returnCode;
    }
    funcSigString += returnCode;

    const actionAttr = io.action.__attrs;
    if (actionAttr[mm.ActionAttributes.groupTypeName]) {
      // Remove the type name from signature:
      // example: func (a) name() ret -> name() ret.
      const idx = funcSigString.indexOf(')');
      const funcSig = new go.FuncSignature(
        funcName,
        funcSigString.substr(idx + 2),
        allFuncArgs,
        returnValuesWithError,
      );

      this.context.handleInterfaceMember(
        actionAttr[mm.ActionAttributes.groupTypeName] as string,
        funcSig,
      );
    }

    // Func start.
    builder.push(`${funcSigString} {`);

    // Check input arrays.
    const inputArrayChecks = new LinesBuilder();
    const arrayParams = funcArgs.filter(
      (p) => p.type instanceof CompoundTypeInfo && p.type.isArray,
    );
    if (arrayParams.length) {
      // Array params need `fmt.Errorf` to return errors.
      this.imports.add(defs.fmtImport);
      for (const arrayParam of arrayParams) {
        const returnValueStrings = returnValues.map((v) => v.type.defaultValueString);
        returnValueStrings.push(
          `fmt.Errorf("The array argument \`${arrayParam.name}\` cannot be empty")`,
        );
        inputArrayChecks.push(`if len(${arrayParam.valueOrName}) == 0 {`);
        inputArrayChecks.increaseIndent();
        inputArrayChecks.push(`return ${returnValueStrings.join(', ')}`);
        inputArrayChecks.decreaseIndent();
        inputArrayChecks.push('}');
      }
    }
    const variadicQueryParams = !!arrayParams.length;

    let bodyMap: CodeMap;
    switch (io.action.actionType) {
      case mm.ActionType.select: {
        bodyMap = this.select(io as SelectIO, variadicQueryParams);
        break;
      }

      case mm.ActionType.update: {
        bodyMap = this.update(io as UpdateIO, variadicQueryParams);
        break;
      }

      case mm.ActionType.insert: {
        bodyMap = this.insert(io as InsertIO, variadicQueryParams);
        break;
      }

      case mm.ActionType.delete: {
        bodyMap = this.delete(io as DeleteIO, variadicQueryParams);
        break;
      }

      case mm.ActionType.wrap: {
        bodyMap = this.wrap(io as WrapIO, variadicQueryParams);
        break;
      }

      case mm.ActionType.transact: {
        bodyMap = this.transact(io as TransactIO, variadicQueryParams);
        break;
      }

      default: {
        throw new Error(
          `Not supported action type "${io.action.actionType}" in \`goBuilder.processActionIO\``,
        );
      }
    }

    // Increase indent on all body lines.
    builder.increaseIndent();
    builder.pushBuilder(inputArrayChecks);
    builder.pushBuilder(bodyMap.body);

    // Close func.
    builder.decreaseIndent();
    builder.push('}');

    let code = builder.toString();
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

  private select(io: SelectIO, variadicQueryParams: boolean): CodeMap {
    const { options } = this;
    const { selectAction: action } = io;
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

    // We only need the type name here, module name (or import path) is already
    // handled in `processActionIO`.
    const firstReturnParam = io.returnValues.getByIndex(0);
    const resultTypeString = firstReturnParam.type.typeString;

    // `atomicResultType` is used to generate additional type definition,
    // e.g. if `resultType` is `[]*Person`, `atomicResultType` is `Person`.
    const atomicResultType =
      getAtomicTypeInfo(firstReturnParam.type).typeString || resultTypeString;
    // Additional type definitions for result type or ORDER BY inputs.
    let headerCode = '';

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
      succReturnCode = `${defs.resultVarName}, itemCounter > len(${defs.resultVarName}), nil`;
    } else if (pagination) {
      succReturnCode = `${defs.resultVarName}, itemCounter, nil`;
    } else {
      succReturnCode = `${defs.resultVarName}, nil`;
    }
    succReturnCode = 'return ' + succReturnCode;

    const builder = new LinesBuilder();

    // Prepare extra definitions for ORDER BY inputs.
    if (io.orderByInputIOs.size) {
      for (const [paramVarName, inputIO] of io.orderByInputIOs.entries()) {
        // Add ORDER BY enum type definition to header.
        const enumDefsBuilder = new LinesBuilder();
        go.buildEnum(enumDefsBuilder, inputIO.enumTypeName, inputIO.enumNames);
        headerCode = go.appendWithSeparator(headerCode, enumDefsBuilder.toString());

        // Add switch-case code.
        // Example:
        // `paramVarName` = `orderBy1`.
        // `resultVarName` = `orderBy1SQL`.
        const resultVarName = inputIO.sqlVarName;

        builder.push(`var ${resultVarName} string`);
        // Switch-case code.
        const cases: Record<string, string> = {};
        inputIO.enumNames.forEach((enumName, i) => {
          cases[enumName] = `${resultVarName} = ${go.makeStringFromSegments(
            inputIO.enumValues[i],
          )}`;
        });

        // Add `fmt` import as we are using `fmt.Errorf`.
        this.imports.add(defs.fmtImport);
        go.buildSwitch(builder, paramVarName, cases, [
          `err := fmt.Errorf("Unsupported value %v", ${paramVarName})`,
          errReturnCode,
        ]);

        // Build code for DESC.
        builder.push(`if ${paramVarName}Desc {`);
        builder.increaseIndent();
        builder.push(`${resultVarName} += " DESC"`);
        builder.decreaseIndent();
        builder.push('}');
        builder.push();
      }
    }

    // Selected columns.
    const selectedFields: VarInfo[] = [];
    const jsonIgnoreFields = new Set<VarInfo>();
    const omitEmptyFields = new Set<VarInfo>();
    const omitAllEmptyFields = options.jsonEncoding?.excludeEmptyValues || false;

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
        if (omitAllEmptyFields || attrs[mm.ColumnAttributes.excludeEmptyValue] === true) {
          omitEmptyFields.add(varInfo);
        }
      }

      // Checking inherited attributes.
      if (omitAllEmptyFields) {
        omitEmptyFields.add(varInfo);
      }
    }

    // Generate result type definition.
    const resultMemberJSONStyle = options.jsonEncoding?.encodingStyle || JSONEncodingStyle.none;
    if (selMode !== mm.SelectActionMode.field && selMode !== mm.SelectActionMode.exists) {
      if (action.__attrs[mm.ActionAttributes.resultTypeName]) {
        this.context.handleResultType(
          atomicResultType,
          new go.StructInfo(
            atomicResultType,
            selectedFields,
            resultMemberJSONStyle,
            jsonIgnoreFields,
            omitEmptyFields,
          ),
        );
      } else {
        headerCode = go.appendWithSeparator(
          headerCode,
          go.struct(
            atomicResultType,
            selectedFields,
            resultMemberJSONStyle,
            jsonIgnoreFields,
            omitEmptyFields,
          ),
        );

        this.imports.addVars(selectedFields);
      }
    }

    const sqlSource = [...(io.sql || [])];

    // LIMIT and OFFSET.
    if (pagination) {
      sqlSource.push(' LIMIT ? OFFSET ?');
    } else if (limitValue !== undefined) {
      sqlSource.push(' LIMIT ');
      sqlSource.push(isLimitInput ? '?' : limitValue.toString());

      if (offsetValue !== undefined) {
        sqlSource.push(' OFFSET ');
        sqlSource.push(isOffsetInput ? '?' : offsetValue.toString());
      }
    }

    const sqlLiteral = go.makeStringFromSegments(sqlSource);
    if (selMode === mm.SelectActionMode.list || isPageMode) {
      const scanParams = joinParams(selectedFields.map((p) => `&item.${p.name}`));
      if (isPageMode) {
        // Add `fmt` import as we are using `fmt.Errorf`.
        this.imports.add(defs.fmtImport);
        builder.pushLines(
          'if page <= 0 {',
          '\terr := fmt.Errorf("Invalid page %v", page)',
          `\t${errReturnCode}`,
          '}',
          'if pageSize <= 0 {',
          '\terr := fmt.Errorf("Invalid page size %v", pageSize)',
          `\t${errReturnCode}`,
          '}',
          'limit := pageSize + 1',
          'offset := (page - 1) * pageSize',
          'max := pageSize',
        );
      }
      // Call the `Query` method.
      this.injectQueryPreparationCode(builder, io.execArgs.list, variadicQueryParams);
      builder.push(
        `rows, err := ${defs.queryableParam}.Query(${this.getQueryParamsCode(
          sqlLiteral,
          io.execArgs.list,
          variadicQueryParams,
        )})`,
      );
      builder.push('if err != nil {');
      builder.increaseIndent();
      builder.push(errReturnCode);
      builder.decreaseIndent();
      builder.push('}');
      builder.pushLines(
        go.makeArray(
          defs.resultVarName,
          `*${atomicResultType}`,
          0,
          pagination ? defs.limitVarName : 0,
        ),
        pagination ? 'itemCounter := 0' : null,
        'defer rows.Close()',
        'for rows.Next() {',
      );
      builder.increaseIndent();
      // Wrap the object scan code inside a "if itemCounter <= max" block if hasLimit
      if (pagination) {
        builder.pushLines('itemCounter++', 'if itemCounter <= max {');
        builder.increaseIndent();
      }
      builder.pushLines(
        go.pointerVar('item', atomicResultType),
        `err = rows.Scan(${scanParams})`,
        'if err != nil {',
      );
      builder.increaseIndent();
      builder.push(errReturnCode);
      builder.decreaseIndent();
      builder.push('}');
      builder.push(`${defs.resultVarName} = append(${defs.resultVarName}, item)`);
      if (pagination) {
        builder.decreaseIndent();
        builder.push('}');
      }
      builder.decreaseIndent();
      builder.push('}');
      builder.push('err = rows.Err()');
      builder.push('if err != nil {');
      builder.increaseIndent();
      builder.push(errReturnCode);
      builder.decreaseIndent();
      builder.push('}');
    } else {
      // For `select/selectField`.
      let scanParams: string;
      // Declare the result variable.
      if (selMode === mm.SelectActionMode.field || selMode === mm.SelectActionMode.exists) {
        scanParams = `&${defs.resultVarName}`;
        builder.push(`var ${defs.resultVarName} ${resultTypeString}`);
      } else {
        scanParams = joinParams(selectedFields.map((p) => `&${defs.resultVarName}.${p.name}`));
        builder.push(`${go.pointerVar(defs.resultVarName, atomicResultType)}`);
      }
      // For `selectField` and `selectExists`, we return the default value,
      // for `select`, return nil.
      const resultVarOnError =
        selMode === mm.SelectActionMode.field || selMode === mm.SelectActionMode.exists
          ? defs.resultVarName
          : 'nil';

      // Call the `Query` func.
      this.injectQueryPreparationCode(builder, io.execArgs.list, variadicQueryParams);
      builder.push(
        `err := ${defs.queryableParam}.QueryRow(${this.getQueryParamsCode(
          sqlLiteral,
          io.execArgs.list,
          variadicQueryParams,
        )}).Scan(${scanParams})`,
      );
      builder.push('if err != nil {');
      builder.increaseIndent();
      builder.push(`return ${resultVarOnError}, err`);
      builder.decreaseIndent();
      builder.push('}');
    }
    // Return the result.
    builder.push(succReturnCode);

    return new CodeMap(builder, headerCode);
  }

  private update(io: UpdateIO, variadicParams: boolean): CodeMap {
    const { updateAction: action } = io;
    const builder = new LinesBuilder();
    const queryArgs = io.execArgs.list;

    const sqlLiteral = io.getSQLCode();
    this.injectQueryPreparationCode(builder, queryArgs, variadicParams);
    builder.push(
      `${defs.resultVarName}, err := ${defs.queryableParam}.Exec(${this.getQueryParamsCode(
        sqlLiteral,
        queryArgs,
        variadicParams,
      )})`,
    );

    // Return the result
    if (action.ensureOneRowAffected) {
      builder.push(`return mingru.CheckOneRowAffectedWithError(${defs.resultVarName}, err)`);
    } else {
      builder.push(`return mingru.GetRowsAffectedIntWithError(${defs.resultVarName}, err)`);
    }
    return new CodeMap(builder);
  }

  private insert(io: InsertIO, variadicParams: boolean): CodeMap {
    const { fetchInsertedID } = io;
    const builder = new LinesBuilder();
    const queryArgs = io.execArgs.list;

    const sqlLiteral = io.getSQLCode();
    this.injectQueryPreparationCode(builder, queryArgs, variadicParams);
    builder.push(
      `${fetchInsertedID ? defs.resultVarName : '_'}, err := ${
        defs.queryableParam
      }.Exec(${this.getQueryParamsCode(sqlLiteral, queryArgs, variadicParams)})`,
    );

    // Return the result
    if (fetchInsertedID) {
      builder.push(`return mingru.GetLastInsertIDUint64WithError(${defs.resultVarName}, err)`);
    } else {
      builder.push('return err');
    }
    return new CodeMap(builder);
  }

  private delete(io: DeleteIO, variadicParams: boolean): CodeMap {
    const { deleteAction: action } = io;
    const builder = new LinesBuilder();
    const queryArgs = io.execArgs.list;

    const sqlLiteral = io.getSQLCode();
    this.injectQueryPreparationCode(builder, queryArgs, variadicParams);
    builder.push(
      `${defs.resultVarName}, err := ${defs.queryableParam}.Exec(${this.getQueryParamsCode(
        sqlLiteral,
        queryArgs,
        variadicParams,
      )})`,
    );

    // Return the result
    if (action.ensureOneRowAffected) {
      builder.push(`return mingru.CheckOneRowAffectedWithError(${defs.resultVarName}, err)`);
    } else {
      builder.push(`return mingru.GetRowsAffectedIntWithError(${defs.resultVarName}, err)`);
    }
    return new CodeMap(builder);
  }

  private wrap(io: WrapIO, variadicParams: boolean): CodeMap {
    const builder = new LinesBuilder();
    const queryArgs = io.execArgs.list;

    this.injectQueryPreparationCode(builder, queryArgs, variadicParams);
    builder.push(
      `return ${io.funcPath}(${this.getQueryParamsCode(null, queryArgs, variadicParams)})`,
    );
    return new CodeMap(builder);
  }

  private transact(io: TransactIO, _variadicQueryParams: boolean): CodeMap {
    let headCode = '';

    // Lines builder for code inside DB transaction closure.
    const innerBuilder = new LinesBuilder();
    const { memberIOs, returnValues } = io;

    // We don't use queryable in transaction arguments but we still need to
    // import the dbx namespace as we're calling mingru.transact.
    this.imports.addVars([defs.dbxQueryableVar]);

    // Declare err variable.
    innerBuilder.push('var err error');

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
      let returnValuesCode = '';
      for (const ret of mActionIO.returnValues.list) {
        // Check if this value has been exported (declared).
        const varName = declaredReturnValueNames[ret.name];
        if (varName) {
          hasDeclaredVars = true;
        }
        returnValuesCode += `${varName || '_'}, `;
      }
      returnValuesCode += `err ${hasDeclaredVars ? ':' : ''}= `;
      returnValuesCode += memberIO.callPath;
      // Generating the calling code of this member
      const queryParamsCode = mActionIO.funcArgs.list
        .slice(1) // Strip the first queryable param
        .map((p) => p.valueOrName)
        .join(', ');

      // If this is a temp member (created inside transaction),
      // then we also need to generate the member func body code.
      if (memberIO.isInline) {
        const methodCode = this.buildActionIO(memberIO.actionIO, memberIO.assignedName, true);
        // Put func code into head.
        headCode += methodCode;
        if (memberIdx !== memberCount - 1) {
          headCode += '\n';
        }
      }

      returnValuesCode += '(tx';
      if (queryParamsCode) {
        returnValuesCode += `, ${queryParamsCode}`;
      }
      returnValuesCode += ')';
      innerBuilder.push(returnValuesCode);
      innerBuilder.push('if err != nil {');
      innerBuilder.increaseIndent();
      innerBuilder.push('return err');
      innerBuilder.decreaseIndent();
      innerBuilder.push('}');
    }

    // Assign inner variables to outer return values if needed.
    if (returnValues.length) {
      for (const v of returnValues.list) {
        innerBuilder.push(`${this.txExportedVar(v.name)} = ${v.name}`);
      }
    }

    innerBuilder.push('return nil');

    const builder = new LinesBuilder();
    // Declare return variables if needed.
    if (returnValues.length) {
      this.imports.addVars(returnValues.list);
      for (const v of returnValues.list) {
        builder.push(`var ${this.txExportedVar(v.name)} ${v.type.typeString}`);
      }
    }
    builder.push('txErr := mingru.Transact(db, func(tx *sql.Tx) error {');
    builder.increaseIndent();
    builder.pushBuilder(innerBuilder);
    builder.decreaseIndent();
    builder.push('})');

    let returnCode = 'return ';
    if (returnValues.length) {
      for (const v of returnValues.list) {
        returnCode += `${this.txExportedVar(v.name)}, `;
      }
    }
    returnCode += 'txErr';
    builder.push(returnCode);
    return new CodeMap(builder, headCode);
  }

  // A varList usually ends without an error type, call this to append
  // an Go error type to the varList.
  private appendErrorType(vars: VarInfo[]): VarInfo[] {
    return [...vars, new VarInfo('error', defs.errorType)];
  }

  private txExportedVar(name: string): string {
    return `${name}Exported`;
  }

  private injectQueryPreparationCode(
    builder: LinesBuilder,
    args: VarInfo[],
    variadicParams: boolean,
  ) {
    if (variadicParams) {
      builder.push(`var ${defs.queryParamsVarName} []interface{}`);
      for (const param of args) {
        const { valueOrName } = param;
        if (param.type instanceof CompoundTypeInfo && param.type.isArray) {
          builder.push(`for _, item := range ${valueOrName} {`);
          builder.increaseIndent();
          builder.push(`${defs.queryParamsVarName} = append(${defs.queryParamsVarName}, item)`);
          builder.decreaseIndent();
          builder.push('}');
        } else {
          builder.push(
            `${defs.queryParamsVarName} = append(${defs.queryParamsVarName}, ${param.valueOrName})`,
          );
        }
      }
    }
  }

  private getQueryParamsCode(
    firstParam: string | null,
    args: VarInfo[],
    variadicParams: boolean,
  ): string {
    let tailParams = '';
    if (variadicParams) {
      tailParams = `${defs.queryParamsVarName}...`;
    } else {
      tailParams = args
        .map(
          (p) =>
            `${
              p.type instanceof CompoundTypeInfo && p.type.isArray
                ? `...${p.valueOrName}`
                : p.valueOrName
            }`,
        )
        .join(', ');
    }
    if (firstParam && tailParams) {
      return `${firstParam}, ${tailParams}`;
    }
    return (firstParam || '') + tailParams;
  }
}
