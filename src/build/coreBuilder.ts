/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import { Dialect } from '../dialect.js';
import { SelectIO } from '../io/selectIO.js';
import { UpdateIO } from '../io/updateIO.js';
import { InsertIO } from '../io/insertIO.js';
import { DeleteIO } from '../io/deleteIO.js';
import {
  VarInfo,
  CompoundTypeInfo,
  getAtomicTypeInfo,
  typeInfoWithoutArray,
  typeInfoToPointer,
} from '../lib/varInfo.js';
import * as go from './goCodeUtil.js';
import * as defs from '../def/defs.js';
import logger from '../logger.js';
import { TAIO } from '../io/taIO.js';
import { ActionIO } from '../io/actionIO.js';
import { WrapIO } from '../io/wrapIO.js';
import { TransactIO } from '../io/transactIO.js';
import LinesBuilder from './linesBuilder.js';
import * as stringUtils from '../lib/stringUtils.js';
import { BuildOptions } from './buildOptions.js';
import CoreBuilderContext from './coreBuilderContext.js';

function joinParams(arr: string[]): string {
  return arr.join(', ');
}

// TypeScript type code. Only applicable to SELECT actions.
export interface TSTypeCode {
  name: string;
  code: string;
}

export class TSTypeCollector {
  types = new Map<string, TSTypeCode>();

  get count(): number {
    return this.types.size;
  }

  add(type: TSTypeCode) {
    this.types.set(type.name, type);
  }

  values(): TSTypeCode[] {
    return [...this.types.values()];
  }
}

// Some actions (like SELECT), use `CodeMap` to return multiple code blocks.
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

// Generates code (Go and TypeScript interfaces if configured)
// from a table action IO object(`TAIO`).
export default class CoreBuilder {
  // Set when `Option.tsOut` is present.
  tsTypeCollector?: TSTypeCollector;

  private options: BuildOptions;
  private imports = new go.ImportList();
  private dialect: Dialect;

  constructor(public taIO: TAIO, public opts: BuildOptions, public context: CoreBuilderContext) {
    this.dialect = taIO.opt.dialect;
    this.options = opts;
    if (opts.tsOutDir) {
      this.tsTypeCollector = new TSTypeCollector();
    }
  }

  build(): string {
    const { options, taIO } = this;
    const action = taIO.ta;
    this.context.addAction(action);
    this.context.addTable(action.__getData().table);

    let code = options.goFileHeader ?? defs.fileHeader;
    code += `package ${options.packageName || defs.defaultPackageName}\n\n`;

    // `this.buildActions` will set `this.systemImports` and `this.userImports`.
    let body = '';
    body += this.buildTableObject();
    body += go.sep('Actions');
    body += this.buildActions();

    // Add imports.
    code = code + this.imports.code() + body;
    return code;
  }

  private buildActions(): string {
    let code = '';
    logger.debug(`🏁 Building actions [${this.taIO.tableDBName}]`);
    for (const actionIO of this.taIO.actionIOs) {
      code += `\n${this.buildActionIO(actionIO, undefined)}`;
    }
    return code;
  }

  // `fallbackActionName` is used by TRANSACT members as they don't have a `__name`.
  private buildActionIO(
    io: ActionIO,
    fallbackActionName: string | undefined,
    pri?: boolean,
  ): string {
    const { action } = io;
    const actionData = action.__getData();
    const actionName = actionData.name || fallbackActionName;
    if (!actionName) {
      throw new Error(`Unexpected empty action name, action "${action}"`);
    }
    const ioFuncName = defs.actionPascalName(actionName);

    // Prepare variables.
    const funcName = pri ? stringUtils.lowercaseFirstChar(ioFuncName) : ioFuncName;
    // Used for generating interface member if needed.
    let funcSigString = '';
    // Use `funcArgs.distinctList` cuz duplicate vars are not allowed.
    const funcArgs = io.funcArgs.distinctList;
    const returnValues = io.returnValues.list;
    const builder = new LinesBuilder();

    // Build func head.
    funcSigString += `${this.getFuncSigHead()}${funcName}`;

    // Build func params.
    // allFuncArgs = original func args + arg stubs.
    const allFuncArgs = [
      io.firstParamDB ? defs.sqlDBVar : defs.dbxQueryableVar,
      ...funcArgs,
      ...io.funcStubs,
    ];
    this.imports.addVars(allFuncArgs);
    const funcParamsCode = allFuncArgs
      .map((p) => `${p.camelCaseName()} ${p.type.fullTypeName}`)
      .join(', ');
    // Wrap all params with parentheses.
    funcSigString += `(${funcParamsCode})`;

    // Build return values.
    this.imports.addVars(returnValues);
    const returnValuesWithError = this.appendErrorType(returnValues);
    let returnCode = returnValuesWithError.map((v) => v.type.fullTypeName).join(', ');
    if (returnValuesWithError.length > 1) {
      returnCode = `(${returnCode})`;
    }
    if (returnCode) {
      returnCode = ' ' + returnCode;
    }
    funcSigString += returnCode;

    const actionAttr = actionData.attrs;
    if (actionAttr?.get(mm.ActionAttribute.groupTypeName) !== undefined) {
      // Remove the type name from signature:
      // example: func (a) name() ret -> name() ret.
      const idx = funcSigString.indexOf(')');
      const funcSig = new go.FuncSignature(
        funcName,
        funcSigString.substr(idx + 2),
        allFuncArgs,
        returnValuesWithError,
      );

      this.context.addSharedInterface(
        // Convert group type name to string.
        `${actionAttr.get(mm.ActionAttribute.groupTypeName)}`,
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
        inputArrayChecks.push(
          `if len(${go.transformVarInfo(arrayParam, go.VarInfoNameCase.camelCase)}) == 0 {`,
        );
        inputArrayChecks.increaseIndent();
        inputArrayChecks.push(`return ${returnValueStrings.join(', ')}`);
        inputArrayChecks.decreaseIndent();
        inputArrayChecks.push('}');
      }
    }
    const variadicQueryParams = !!arrayParams.length;

    let bodyMap: CodeMap;
    switch (actionData.actionType) {
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
          `Not supported action type "${actionData.actionType}" in \`goBuilder.processActionIO\``,
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
    const { className, instanceName, tableDBName } = this.taIO;
    let code = go.struct(
      new go.GoStructData(
        className,
        [], // Members
        null, // JSONKeyStyle
        null, // ignoredMembers
        null, // omitEmptyMembers
      ),
    );

    // Generate table instance.
    code += `\nvar ${instanceName} = &${className}{}\n`;

    // Generate mingru member functions.
    code += `\n// ${defs.tableMemSQLName} returns the name of this table.\n`;
    code += `${this.getFuncSigHead()}${defs.tableMemSQLName}() string {\n`;
    code += `\treturn ${JSON.stringify(tableDBName)}\n`;
    code += '}\n\n';
    return code;
  }

  // Gets the member function signature head.
  private getFuncSigHead() {
    const { className } = this.taIO;
    return `func (${defs.tableObjSelf} *${className}) `;
  }

  private select(io: SelectIO, variadicQueryParams: boolean): CodeMap {
    const { options } = this;
    const { selectAction: action } = io;
    const actionData = action.__getData();
    const selMode = actionData.mode;
    const pgMode = actionData.paginationMode;
    const pgModePaginationOrPageMode =
      pgMode === mm.SelectActionPaginationMode.pagination ||
      pgMode === mm.SelectActionPaginationMode.pageMode;

    // We only need the type name here, module name (or import path) is already
    // handled in `processActionIO`.
    const firstReturnParam = io.returnValues.getByIndex(0);
    if (!firstReturnParam) {
      throw new Error(`No return types defined in action "${action}"`);
    }
    const resultTypeString = firstReturnParam.type.fullTypeName;

    // `atomicResultType` is used to generate additional type definition,
    // e.g. if `resultType` is `[]Person`, `atomicResultType` is `Person`.
    const atomicResultType =
      getAtomicTypeInfo(firstReturnParam.type).fullTypeName || resultTypeString;
    // Additional type definitions for result type or ORDER BY inputs.
    let headerCode = '';

    let errReturnCode = '';
    if (pgMode === mm.SelectActionPaginationMode.pageMode) {
      errReturnCode = 'nil, false, err';
    } else if (pgMode === mm.SelectActionPaginationMode.pagination) {
      errReturnCode = 'nil, 0, err';
    } else if (
      selMode === mm.SelectActionMode.rowList ||
      selMode === mm.SelectActionMode.fieldList
    ) {
      errReturnCode = 'nil, err';
    } else {
      errReturnCode = 'result, err';
    }
    errReturnCode = 'return ' + errReturnCode;

    let successReturnCode = '';
    if (pgMode === mm.SelectActionPaginationMode.pageMode) {
      successReturnCode = `${defs.resultVarName}, itemCounter > len(${defs.resultVarName}), nil`;
    } else if (pgMode === mm.SelectActionPaginationMode.pagination) {
      successReturnCode = `${defs.resultVarName}, itemCounter, nil`;
    } else {
      successReturnCode = `${defs.resultVarName}, nil`;
    }
    successReturnCode = 'return ' + successReturnCode;

    const builder = new LinesBuilder();

    // Prepare extra definitions for ORDER BY inputs.
    if (io.orderByInputIOs.size) {
      for (const [paramVarName, inputIO] of io.orderByInputIOs.entries()) {
        // Add ORDER BY enum type definition to header.
        const enumDefsBuilder = new LinesBuilder();
        go.buildEnum(enumDefsBuilder, inputIO.enumNames);
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
          const enumValue = inputIO.enumValues[i];
          if (!enumValue) {
            throw new Error('Unexpected undefined enum value');
          }
          cases[enumName] = `${resultVarName} = ${go.makeStringFromSegments(enumValue)}`;
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
    const selectedFields = new Map<string, VarInfo>();
    const jsonIgnoreFields = new Set<string>();
    const omitEmptyFields = new Set<string>();
    const omitAllEmptyFields = options.jsonTags?.excludeEmptyValues || false;

    for (const col of io.cols) {
      // Column property name to model property name.
      // Check if model name has been explicitly set.
      const userModelName = col.column?.__getData().modelName;
      const fieldName = userModelName ?? stringUtils.toPascalCase(col.modelName);
      const originalTypeInfo = this.dialect.colTypeToGoType(col.getResultType());
      const typeInfo = col.nullable ? typeInfoToPointer(originalTypeInfo) : originalTypeInfo;
      const varInfo = new VarInfo(fieldName, typeInfo);

      selectedFields.set(varInfo.name, varInfo);

      // Checking explicitly set attributes.
      const ignorePrivateColumns =
        actionData.attrs?.get(mm.ActionAttribute.ignorePrivateColumns) === true;
      if (col.selectedColumn instanceof mm.SelectedColumn) {
        const { attrs } = col.selectedColumn.__getData();
        if (!ignorePrivateColumns && attrs?.get(mm.SelectedColumnAttribute.isPrivate) === true) {
          jsonIgnoreFields.add(varInfo.name);
        }
        if (
          omitAllEmptyFields ||
          attrs?.get(mm.SelectedColumnAttribute.excludeEmptyValue) === true
        ) {
          omitEmptyFields.add(varInfo.name);
        }
      }

      // Checking inherited attributes.
      if (omitAllEmptyFields) {
        omitEmptyFields.add(varInfo.name);
      }
    }

    const resultMemberJSONStyle = options.jsonTags?.keyStyle ?? null;
    let tsInterfaceName: string | undefined;
    let tsInterfaceCode: string | undefined;
    if (
      selMode !== mm.SelectActionMode.field &&
      selMode !== mm.SelectActionMode.exists &&
      selMode !== mm.SelectActionMode.fieldList
    ) {
      const selectedFieldArray = [...selectedFields.values()];
      const structData = new go.GoStructData(
        atomicResultType,
        selectedFieldArray,
        resultMemberJSONStyle,
        jsonIgnoreFields,
        omitEmptyFields,
      );

      // Generate result type.
      const actionAttrs = action.__getData().attrs;
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (actionAttrs?.get(mm.ActionAttribute.resultTypeName)) {
        // A custom result type name can be reused. Thus we add it to the context.
        this.context.addSharedResultType(
          atomicResultType,
          structData,
          actionAttrs.get(mm.ActionAttribute.enableTSResultType) === true,
        );
      } else {
        // The result type is not shared.
        headerCode = go.appendWithSeparator(headerCode, go.struct(structData));

        this.imports.addVars(selectedFieldArray);
      }
    }

    const sqlLiteral = go.makeStringFromSegments(io.sql || []);
    if (selMode === mm.SelectActionMode.rowList || selMode === mm.SelectActionMode.fieldList) {
      const itemVarType = typeInfoWithoutArray(firstReturnParam.type).fullTypeName;
      const scanParams =
        selMode === mm.SelectActionMode.fieldList
          ? `&${defs.itemVarName}`
          : joinParams([...selectedFields.values()].map((p) => `&item.${p.pascalName}`));
      if (pgMode === mm.SelectActionPaginationMode.pageMode) {
        // Add `fmt` import as we are using `fmt.Errorf`.
        this.imports.add(defs.fmtImport);
        builder.pushLines(
          `if ${defs.pageVarName} <= 0 {`,
          `\terr := fmt.Errorf("Invalid page %v", ${defs.pageVarName})`,
          `\t${errReturnCode}`,
          '}',
          `if ${defs.pageSizeVarName} <= 0 {`,
          `\terr := fmt.Errorf("Invalid page size %v", ${defs.pageSizeVarName})`,
          `\t${errReturnCode}`,
          '}',
          `limit := ${defs.pageSizeVarName} + 1`,
          `offset := (${defs.pageVarName} - 1) * ${defs.pageSizeVarName}`,
          `max := ${defs.pageSizeVarName}`,
        );
      }
      // Call the `Query` method.
      this.injectQueryPreparationCode(builder, io.execArgs.list, variadicQueryParams);
      builder.push(
        `rows, err := ${defs.mrQueryableParam}.Query(${this.getQueryParamsCode(
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
          selMode === mm.SelectActionMode.fieldList ? itemVarType : atomicResultType,
          0,
          pgModePaginationOrPageMode ? defs.limitVarName : 0,
        ),
        pgModePaginationOrPageMode ? 'itemCounter := 0' : null,
        'defer rows.Close()',
        'for rows.Next() {',
      );
      builder.increaseIndent();
      // Wrap the object scan code inside a "if itemCounter <= max" block if hasLimit
      if (pgModePaginationOrPageMode) {
        builder.pushLines('itemCounter++', 'if itemCounter <= max {');
        builder.increaseIndent();
      }
      builder.pushLines(
        selMode === mm.SelectActionMode.fieldList
          ? `var ${defs.itemVarName} ${itemVarType}`
          : `var ${defs.itemVarName} ${atomicResultType}`,
        `err = rows.Scan(${scanParams})`,
        'if err != nil {',
      );
      builder.increaseIndent();
      builder.push(errReturnCode);
      builder.decreaseIndent();
      builder.push('}');
      builder.push(`${defs.resultVarName} = append(${defs.resultVarName}, ${defs.itemVarName})`);
      if (pgModePaginationOrPageMode) {
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
      // `selMode` == `selectRow / selectField / selectExists`.
      let scanParams: string;
      // Declare the result variable.
      if (selMode === mm.SelectActionMode.field || selMode === mm.SelectActionMode.exists) {
        scanParams = `&${defs.resultVarName}`;
        builder.push(`var ${defs.resultVarName} ${resultTypeString}`);
      } else {
        scanParams = joinParams(
          [...selectedFields.values()].map((p) => `&${defs.resultVarName}.${p.pascalName}`),
        );
        builder.push(`var ${defs.resultVarName} ${atomicResultType}`);
      }

      // Call the `Query` func.
      this.injectQueryPreparationCode(builder, io.execArgs.list, variadicQueryParams);
      builder.push(
        `err := ${defs.mrQueryableParam}.QueryRow(${this.getQueryParamsCode(
          sqlLiteral,
          io.execArgs.list,
          variadicQueryParams,
        )}).Scan(${scanParams})`,
      );
      builder.push('if err != nil {');
      builder.increaseIndent();
      builder.push(errReturnCode);
      builder.decreaseIndent();
      builder.push('}');
    }
    // Return the result.
    builder.push(successReturnCode);

    const codeMap = new CodeMap(builder, headerCode);
    if (tsInterfaceName && tsInterfaceCode) {
      const type = {
        name: tsInterfaceName,
        code: tsInterfaceCode,
      };
      this.tsTypeCollector?.add(type);
    }
    return codeMap;
  }

  private update(io: UpdateIO, variadicParams: boolean): CodeMap {
    const { updateAction: action } = io;
    const builder = new LinesBuilder();
    const queryArgs = io.execArgs.list;

    const sqlLiteral = io.getSQLCode();
    this.injectQueryPreparationCode(builder, queryArgs, variadicParams);
    builder.push(
      `${defs.resultVarName}, err := ${defs.mrQueryableParam}.Exec(${this.getQueryParamsCode(
        sqlLiteral,
        queryArgs,
        variadicParams,
      )})`,
    );

    // Return the result
    if (action.__getData().ensureOneRowAffected) {
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
        defs.mrQueryableParam
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
      `${defs.resultVarName}, err := ${defs.mrQueryableParam}.Exec(${this.getQueryParamsCode(
        sqlLiteral,
        queryArgs,
        variadicParams,
      )})`,
    );

    // Return the result
    if (action.__getData().ensureOneRowAffected) {
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
    const { memberIOs, returnValues, funcArgs } = io;

    // We don't use mrQueryable in transaction arguments but we still need to
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
        .slice(1) // Strip the first mrQueryable param
        .map((p) => go.transformVarInfo(p, go.VarInfoNameCase.camelCase))
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

    // Declare params that have a value.
    const funcArgsWithValues = funcArgs.list.filter((v) => v.value);
    if (funcArgsWithValues.length) {
      this.imports.addVars(funcArgsWithValues);
      for (const v of funcArgsWithValues) {
        builder.push(`${v.name} := ${go.transformVarInfo(v, go.VarInfoNameCase.camelCase)}`);
      }
    }

    // Declare return variables if needed.
    if (returnValues.length) {
      this.imports.addVars(returnValues.list);
      for (const v of returnValues.list) {
        builder.push(`var ${this.txExportedVar(v.name)} ${v.type.fullTypeName}`);
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
        if (param.type instanceof CompoundTypeInfo && param.type.isArray) {
          builder.push(
            `for _, item := range ${go.transformVarInfo(param, go.VarInfoNameCase.camelCase)} {`,
          );
          builder.increaseIndent();
          builder.push(`${defs.queryParamsVarName} = append(${defs.queryParamsVarName}, item)`);
          builder.decreaseIndent();
          builder.push('}');
        } else {
          builder.push(
            `${defs.queryParamsVarName} = append(${defs.queryParamsVarName}, ${go.transformVarInfo(
              param,
              go.VarInfoNameCase.camelCase,
            )})`,
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
              p.type instanceof CompoundTypeInfo && p.type.isArray ? '...' : ''
            }${go.transformVarInfo(p, go.VarInfoNameCase.camelCase)}`,
        )
        .join(', ');
    }
    if (firstParam && tailParams) {
      return `${firstParam}, ${tailParams}`;
    }
    return (firstParam || '') + tailParams;
  }
}
