/* eslint-disable no-param-reassign */
import * as mm from 'mingru-models';
import toTypeString from 'to-type-string';
import { throwIfFalsy } from 'throw-if-arg-empty';
import mustBeErr from 'must-be-err';
import { Dialect, StringSegment } from '../dialect.js';
import { SQLIO, sqlIO, SQLIOBuilderOption } from './sqlIO.js';
import { ActionIO } from './actionIO.js';
import * as stringUtils from '../lib/stringUtils.js';
import {
  VarInfo,
  AtomicTypeInfo,
  CompoundTypeInfo,
  typeInfoToArray,
  typeInfoToPointer,
} from '../lib/varInfo.js';
import VarList from '../lib/varList.js';
import { registerHandler } from './actionToIO.js';
import * as defs from '../def/defs.js';
import { VarInfoBuilder } from '../lib/varInfoHelper.js';
import { forEachWithSlots } from '../lib/arrayUtils.js';
import { ActionToIOOptions } from './actionToIOOptions.js';
import BaseIOProcessor from './baseIOProcessor.js';
import * as sqlHelper from '../lib/sqlHelper.js';

const orderByInputParamName = 'orderBy';

export class JoinIO {
  // `JoinTable.extraSQL` is not included in `JoinTable.keyPath` to avoid
  // circular deps, cuz a join might contain an extra SQL with itself in it.
  // This may end up with multiple joins with same key paths but different
  // `extraSQL`s. During join scanning, a non-empty `extraSQL` will always
  // override the previous one.
  extraSQL: SQLIO | undefined;

  constructor(
    public joinType: mm.JoinType,
    public path: string,
    public tableAlias: string,
    // Note that `localTable` can also be an alias of another join.
    public localTable: string,
    public localColumn: mm.Column,
    public remoteTable: string,
    public remoteColumn: mm.Column,
    public extraColumns: [mm.Column, mm.Column][],
  ) {}

  toSegments(dialect: Dialect): StringSegment[] {
    const sql: StringSegment[] = [];
    const e = dialect.encodeName;
    const alias1 = e(this.tableAlias);
    const alias2 = e(this.localTable);
    sql.push(
      `${this.getJoinTypeSQL()} JOIN ${e(this.remoteTable)} AS ${e(
        this.tableAlias,
      )} ON ${alias1}.${e(this.remoteColumn.__getDBName())} = ${alias2}.${e(
        this.localColumn.__getDBName(),
      )}`,
    );

    // Handle multiple columns in a join.
    if (this.extraColumns.length) {
      for (const [col1, col2] of this.extraColumns) {
        sql.push(` AND ${alias1}.${e(col1.__getDBName())} = ${alias2}.${e(col2.__getDBName())}`);
      }
    }

    // Handle extra SQL in a join.
    if (this.extraSQL) {
      sql.push(' ', ...this.extraSQL.code);
    }

    return sql;
  }

  private getJoinTypeSQL(): string {
    switch (this.joinType) {
      case mm.JoinType.full:
        return 'FULL';
      case mm.JoinType.left:
        return 'LEFT';
      case mm.JoinType.right:
        return 'RIGHT';
      default:
        return 'INNER';
    }
  }
}

export class OrderByInputIO {
  constructor(
    public enumTypeName: string,
    public enumNames: string[],
    public enumValues: StringSegment[][],
    // The name of the variable used in SELECT IO SQL.
    public sqlVarName: string,
  ) {}
}

export class SelectedColumnIO {
  constructor(
    public id: StringSegment,
    public selectedColumn: mm.SelectedColumnTypes,
    public valueSQL: StringSegment[],
    // `modelName` is alias if present. Otherwise, alias is auto generated from column model name.
    // Snake case.
    public modelName: string,
    public alias: string | undefined,
    public column: mm.Column | undefined,
    // Available when we can guess the evaluated type,
    // e.g. an expression containing only one column or `SQLCall`.
    public resultType: mm.ColumnType | undefined,
    // True when this column is NULLABLE as a result of a Join, like a full join.
    public nullable: boolean,
  ) {
    throwIfFalsy(selectedColumn, 'selectedColumn');
    throwIfFalsy(valueSQL, 'valueSQL');
  }

  getResultType(): mm.ColumnType {
    if (this.resultType) {
      return this.resultType;
    }
    const colType = this.selectedColumn.__getData().type;
    if (!colType) {
      throw new Error(
        `No column type found on column "${toTypeString(
          this.selectedColumn,
        )}", SQL: "${this.valueSQL.toString()}"`,
      );
    }
    return colType;
  }
}

export class SelectIO extends ActionIO {
  constructor(
    dialect: Dialect,
    public selectAction: mm.SelectAction,
    sql: StringSegment[],
    // `cols` can be empty, it indicates `SELECT *`, which is used in `selectExists`.
    public cols: SelectedColumnIO[],
    public whereIO: SQLIO | null,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
    // K: ORDER BY params name, V: IO.
    public orderByInputIOs: Map<string, OrderByInputIO>,
  ) {
    super(dialect, selectAction, sql, funcArgs, execArgs, returnValues);
    throwIfFalsy(selectAction, 'action');
    throwIfFalsy(sql, 'sql');
  }
}

export class SelectIOProcessor extends BaseIOProcessor {
  // If true, this is a full join or right join, which means home table columns
  // are all nullable.
  homeTableJoinType?: mm.JoinType;
  get hasJoin(): boolean {
    return !!this.homeTableJoinType;
  }

  // Tracks all processed joins, when processing a new join,
  // we can reuse the JoinIO if it already exists (K: join path, V: `JoinIO`).
  jcMap = new Map<string, JoinIO>();
  // Joins in insertion order.
  joins: JoinIO[] = [];
  // Make sure all join table alias names are unique.
  joinedTableCounter = 0;

  /**
   * Selected column paths and IDs.
   *
   * Each mingru-models column (not including raw columns) comes with
   * a path which you can get from `Column.__getPath`. That path can
   * uniquely identify a column including columns from a join.
   *
   * `selectedModelNames` tracks all selected column model names and throws
   * on duplicate ones. The reason for this is we can't map duplicate
   * columns into duplicate fields in a Go struct (compile errors).
   *
   * Column ID represents an ID which can be used in SQL to identity a
   * selected columns, e.g. `my_table`.`my_col`. As mentioned above,
   * we use `Column.__getPath` to identity a column internally. To get
   * a column ID, use `SelectedColumnIO.id` instead.
   */

  // Gets an IO from a column path.
  columnPathToIOMap = new Map<string, SelectedColumnIO>();
  // Tracks all selected model names.
  selectedModelNames = new Set<string>();

  // Number of ORDER BY inputs.
  orderByInputCounter = 1;
  // K: ORDER BY params name, V: IO.
  orderByInputIOs = new Map<string, OrderByInputIO>();

  // Pascal case of table name.
  tablePascalName = '';
  // Pascal case of action name.
  actionPascalName = '';
  // Used to help generate a type name for this action.
  actionUniqueTypeName = '';

  // Params needed when ORDER BY inputs are present.
  private orderByInputParams: VarInfo[] = [];
  // Tracks subqueries func args.
  private subqueryIOs: ActionIO[] = [];

  constructor(public action: mm.SelectAction, opt: ActionToIOOptions) {
    super(action, opt);
  }

  convert(): SelectIO {
    const actionData = this.action.__getData();
    const isUnionMode = !!actionData.unionMembers?.length;
    const unionItems = isUnionMode ? sqlHelper.flattenUnions(this.action) : [];

    const sqlTable = this.mustGetAvailableSQLTable();
    const { opt, selectedModelNames } = this;
    const { dialect } = opt;
    const {
      limitValue,
      offsetValue,
      orderByColumns,
      groupByColumns,
      distinctFlag,
      paginationMode: pgMode,
      mode: selMode,
      columns: actionColumns,
      whereSQLValue,
      havingSQLValue,
      attrs: actionAttrs,
    } = actionData;

    if (selMode === undefined) {
      throw new Error('Unexpected undefined selection mode');
    }

    const isLimitInput = limitValue instanceof mm.SQLVariable;
    const isOffsetInput = offsetValue instanceof mm.SQLVariable;

    // Func args
    const limitTypeInfo = new VarInfo('limit', defs.intTypeInfo);
    const offsetTypeInfo = new VarInfo('offset', defs.intTypeInfo);
    const funcArgs = new VarList(`Func args of action "${this.action}"`, true);
    funcArgs.add(defs.dbxQueryableVar);
    if (this.configurableTableName) {
      funcArgs.add(defs.cfTableVarInfo(this.configurableTableName));
    }
    const execArgs = new VarList(`Exec args of action "${this.action}"`, true);

    const sql: StringSegment[] = [isUnionMode ? '' : 'SELECT '];
    let whereIO: SQLIO | null = null;
    const colIOs: SelectedColumnIO[] = [];
    if (isUnionMode) {
      // Handle UNIONs.
      // See `ActionToIOOptions.notFirstUnionMember` for details.

      // Used in UNION mode to generate result type.
      // Selected column IOs for UNION mode action is simply the selected
      // column IOs of its first child.
      let firstSelectedColumnIOs: SelectedColumnIO[] | null = null;
      let unionIdx = 0;
      for (const unionItem of unionItems) {
        if (typeof unionItem === 'boolean') {
          // UNION ALL flag.
          sql.push(' UNION');
          if (unionItem) {
            sql.push(' ALL');
          }
          sql.push(' ');
          continue;
        }

        // `unionItem` is an action.
        const unionAction = unionItem;
        try {
          const childProcessor = new SelectIOProcessor(unionAction, {
            ...opt,
            selectionLiteMode: true,
            notFirstUnionMember: true,
          });
          // Merge func args and exec args.
          const childIO = childProcessor.convert();
          if (!firstSelectedColumnIOs) {
            firstSelectedColumnIOs = childIO.cols;
          }
          sqlHelper.mergeIOVerListsWithActionIO(funcArgs, execArgs, childIO);

          sql.push('(');
          const childSQL = childIO.sql;
          if (childSQL) {
            sql.push(...childSQL);
          }
          sql.push(')');
          unionIdx++;
        } catch (err) {
          mustBeErr(err);
          err.message += ` [UNION index ${unionIdx}]`;
          throw err;
        }
      }
      if (firstSelectedColumnIOs) {
        colIOs.push(...firstSelectedColumnIOs);
      }
    } else if (distinctFlag) {
      sql.push('DISTINCT ');
    }

    if (!opt.selectionLiteMode) {
      const actionName = this.mustGetActionName();
      if (!actionName) {
        throw new Error(`\`actionName\` is required, action "${this.action}"`);
      }

      // NOTE: not the table defined by FROM, it's the root table defined in table actions.
      // Those fields are used to generate result type definition.
      // This process call be skipped if we don't need a result type.
      this.tablePascalName = defs.tablePascalName(this.mustGetGroupTable().__getData().name);
      this.actionPascalName = defs.actionPascalName(actionName);
      this.actionUniqueTypeName = `${this.tablePascalName}Table${this.actionPascalName}`;
    }

    if (!isUnionMode) {
      let selectedColumns: mm.SelectedColumnTypes[];
      if (selMode === mm.SelectActionMode.exists) {
        if (actionColumns?.length) {
          throw new Error('You cannot have selected columns in `selectExists`');
        }
        selectedColumns = [];
      } else {
        selectedColumns = actionColumns?.length
          ? actionColumns
          : (Object.values(sqlTable.__getData().columns).filter(
              (v) => v,
            ) as mm.SelectedColumnTypes[]);
      }

      // Checks if there are any joins in this query.
      this.scanJoins(selectedColumns, whereSQLValue, havingSQLValue);

      // Handle columns.
      if (selMode === mm.SelectActionMode.exists) {
        sql.push('EXISTS(SELECT ');
      }
      if (selectedColumns.length) {
        selectedColumns.forEach((col, i) => {
          const selIO = this.handleSelectedColumn(col);

          const hasSeparator = i !== selectedColumns.length - 1 && selectedColumns.length > 1;
          if (selectedModelNames.has(selIO.modelName)) {
            throw new Error(`The selected column name "${selIO.modelName}" already exists`);
          }
          selectedModelNames.add(selIO.modelName);
          if (selIO.column) {
            this.columnPathToIOMap.set(selIO.column.__getPath(), selIO);
          }
          colIOs.push(selIO);

          sql.push(...selIO.valueSQL);
          if (hasSeparator) {
            sql.push(', ');
          }
        });
      } else {
        sql.push('*');
      }

      // FROM
      const fromSQL = this.handleFrom(sqlTable);
      sql.push(' ');
      sql.push(...fromSQL);

      // WHERE
      // Note: WHERE SQL is created here, but only appended to the `sql` variable
      // after joins are handled below.
      let whereSQL: StringSegment[] = [];
      if (whereSQLValue) {
        whereIO = sqlIO(whereSQLValue, dialect, sqlTable, this.getSQLBuilderOpt());
        whereSQL = [' WHERE ', ...whereIO.code];
      }

      // Joins
      if (this.hasJoin) {
        for (const join of this.joins) {
          const code = join.toSegments(dialect);
          sql.push(' ', ...code);
        }
      }

      // Append WHERE SQL after joins
      if (whereSQL.length) {
        sql.push(...whereSQL);
      }
    } // End of `if (!isUnionMode)`

    // ORDER BY
    if (orderByColumns?.length && !opt.notFirstUnionMember) {
      sql.push(' ORDER BY ');

      forEachWithSlots(
        orderByColumns,
        (col) => {
          sql.push(...this.getOrderByColumnSQL(col));
        },
        () => sql.push(', '),
      );
    }

    // GROUP BY
    if (groupByColumns?.length) {
      sql.push(' GROUP BY ');

      forEachWithSlots(
        groupByColumns,
        (col) => {
          sql.push(dialect.encodeName(col));
        },
        () => sql.push(', '),
      );
    }

    // HAVING
    let havingIO: SQLIO | null = null;
    if (havingSQLValue) {
      havingIO = sqlIO(havingSQLValue, dialect, sqlTable, this.getSQLBuilderOpt());
      sql.push(' HAVING ', ...havingIO.code);
    }

    // Add LIMIT and OFFSET if needed.
    // When `offsetFlag` is true, `limitFlag` must also be true.
    if (
      pgMode === mm.SelectActionPaginationMode.pagination ||
      pgMode === mm.SelectActionPaginationMode.pageMode
    ) {
      sql.push(' LIMIT ? OFFSET ?');
    } else if (limitValue !== undefined) {
      sql.push(' LIMIT ');
      sql.push(isLimitInput ? '?' : limitValue.toString());

      if (offsetValue !== undefined) {
        sql.push(' OFFSET ');
        sql.push(isOffsetInput ? '?' : offsetValue.toString());
      }
    }

    // Add closing parenthesis if needed.
    if (selMode === mm.SelectActionMode.exists) {
      sql.push(')');
    }

    // SELECT FOR UPDATE.
    if (actionData.lockMode !== undefined) {
      switch (actionData.lockMode) {
        case mm.SelectActionLockMode.forUpdate: {
          sql.push(' FOR UPDATE');
          break;
        }

        case mm.SelectActionLockMode.inShareMode: {
          sql.push(' LOCK IN SHARE MODE');
          break;
        }

        default:
          throw new Error(`Unsupported lock mode "${actionData.lockMode}"`);
      }
    }

    // ******** END OF changing the SQL code ********

    // Merge inputs.
    for (const io of this.subqueryIOs) {
      sqlHelper.mergeIOVerListsWithActionIO(funcArgs, execArgs, io);
    }
    // Handle inputs in join extra SQLs.
    for (const joinIO of this.joins) {
      if (joinIO.extraSQL) {
        sqlHelper.mergeIOVerListsWithSQLIO(funcArgs, execArgs, joinIO.extraSQL);
      }
    }
    sqlHelper.mergeIOVerListsWithSQLIO(funcArgs, execArgs, whereIO);
    sqlHelper.mergeIOVerListsWithSQLIO(funcArgs, execArgs, havingIO);

    if (pgMode === mm.SelectActionPaginationMode.pagination) {
      funcArgs.add(limitTypeInfo);
      funcArgs.add(offsetTypeInfo);
      funcArgs.add(defs.selectActionMaxVar);
      execArgs.add(limitTypeInfo);
      execArgs.add(offsetTypeInfo);
    } else if (pgMode === mm.SelectActionPaginationMode.pageMode) {
      funcArgs.add(defs.pageVar);
      funcArgs.add(defs.pageSizeVar);
      execArgs.add(limitTypeInfo);
      execArgs.add(offsetTypeInfo);
    } else if (limitValue !== undefined) {
      // User specified LIMIT and OFFSET
      // Ignore number values, they were directly written in SQL.
      if (limitValue instanceof mm.SQLVariable) {
        const userLimitVarInfo = VarInfoBuilder.fromSQLVar(limitValue, dialect);
        funcArgs.add(userLimitVarInfo);
        execArgs.add(userLimitVarInfo);
      }
      if (offsetValue instanceof mm.SQLVariable) {
        const userOffsetVarInfo = VarInfoBuilder.fromSQLVar(offsetValue, dialect);
        funcArgs.add(userOffsetVarInfo);
        execArgs.add(userOffsetVarInfo);
      }
    }

    // ORDER BY inputs.
    for (const param of this.orderByInputParams) {
      funcArgs.add(param);
    }

    // Set return values.
    const returnValues = new VarList(`Return values of action "${this.action}"`, true);
    if (!opt.selectionLiteMode) {
      if (selMode === mm.SelectActionMode.field || selMode === mm.SelectActionMode.fieldList) {
        const col = colIOs[0];
        if (!col) {
          throw new Error('Unexpected empty selected columns');
        }
        const originalTypeInfo = dialect.colTypeToGoType(col.getResultType());
        const typeInfo = col.nullable ? typeInfoToPointer(originalTypeInfo) : originalTypeInfo;
        returnValues.add(
          new VarInfo(
            mm.ReturnValues.result,
            selMode === mm.SelectActionMode.field ? typeInfo : typeInfoToArray(typeInfo),
          ),
        );

        if (pgMode === mm.SelectActionPaginationMode.pagination) {
          returnValues.add(defs.selectActionMaxVar);
        } else if (pgMode === mm.SelectActionPaginationMode.pageMode) {
          returnValues.add(defs.hasNextVar);
        }
      } else if (selMode === mm.SelectActionMode.exists) {
        returnValues.add(new VarInfo(mm.ReturnValues.result, defs.boolTypeInfo));
      } else {
        // Handle return types that can be customized by attributes.
        // `selMode` == `.rowList` or `.row` or `.union`.
        let resultType: string;
        // Check if result type was renamed.
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (actionAttrs?.get(mm.ActionAttribute.resultTypeName)) {
          resultType = `${actionAttrs.get(mm.ActionAttribute.resultTypeName)}`;
        } else {
          resultType = `${this.actionUniqueTypeName}Result`;
        }

        let isResultTypeArray = false;
        if (selMode === mm.SelectActionMode.rowList) {
          isResultTypeArray = true;
        }
        const resultTypeInfo = new AtomicTypeInfo(resultType, `${resultType}{}`, null);

        returnValues.add(
          new VarInfo(
            mm.ReturnValues.result,
            new CompoundTypeInfo(resultTypeInfo, false, isResultTypeArray),
          ),
        );
        if (pgMode === mm.SelectActionPaginationMode.pagination) {
          returnValues.add(defs.selectActionMaxVar);
        } else if (pgMode === mm.SelectActionPaginationMode.pageMode) {
          returnValues.add(defs.hasNextVar);
        }
      }
    }

    return new SelectIO(
      dialect,
      // DO NOT use `coreAction` here, it might be the first UNION member, which
      // could possibly have an empty name.
      this.action,
      sql,
      colIOs,
      whereIO,
      funcArgs,
      execArgs,
      returnValues,
      this.orderByInputIOs,
    );
  }

  private getSQLBuilderOpt(): SQLIOBuilderOption {
    return {
      rewriteElement: (ele) => {
        if (ele.type === mm.SQLElementType.column) {
          const col = ele.toColumn();
          return this.getColumnSQLFromExistingData(col);
        }
        return null;
      },
      subqueryCallback: (_action, io) => {
        this.subqueryIOs.push(io);
      },
    };
  }

  private getOrderByColumnSQL(col: mm.OrderByColumnType): StringSegment[] {
    if (col instanceof mm.OrderByColumnInput) {
      const enumTypeName = `${this.actionUniqueTypeName}OrderBy${this.orderByInputCounter}`;
      const orderByParamName = `${orderByInputParamName}${this.orderByInputCounter}`;
      const orderByResultName = `${orderByParamName}SQL`;
      const names: string[] = [];
      const values: StringSegment[][] = [];
      for (const choice of col.columns) {
        const [displayName, code] = this.getOrderByNonInputColumnSQL(choice);
        names.push(stringUtils.toPascalCase(`${enumTypeName}${displayName}`));
        values.push(code);
      }
      this.orderByInputIOs.set(
        orderByParamName,
        new OrderByInputIO(enumTypeName, names, values, orderByResultName),
      );

      // Add ORDER BY inputs params.
      // `orderBy1` for enum param, and `orderBy1Desc` for ordering.
      this.orderByInputParams.push(new VarInfo(orderByParamName, defs.intTypeInfo));
      const orderByDescVarName = `${orderByParamName}Desc`;
      this.orderByInputParams.push(new VarInfo(orderByDescVarName, defs.boolTypeInfo));

      this.orderByInputCounter++;
      return [{ code: orderByResultName }];
    }
    const [, code] = this.getOrderByNonInputColumnSQL(col.column);
    if (col.desc) {
      return [...code, ' DESC'];
    }
    return code;
  }

  // Gets ORDER BY value of the specified column. Returns an array of string segments
  // along with a column display name which is used in ORDER BY inputs.
  private getOrderByNonInputColumnSQL(
    col: mm.SelectedColumnTypesOrName,
  ): [string, StringSegment[]] {
    const { dialect } = this.opt;

    if (typeof col === 'string') {
      return [col, [dialect.encodeName(col)]];
    }
    if (col instanceof mm.Column) {
      const io = this.columnPathToIOMap.get(col.__getPath());
      return [col.__mustGetPropertyName(), io ? [io.id] : this.getColumnSQLFromExistingData(col)];
    }
    if (col instanceof mm.SelectedColumn) {
      const colData = col.__getData();
      if (colData.selectedName) {
        return [colData.selectedName, [dialect.encodeName(colData.selectedName)]];
      }
      if (colData.core instanceof mm.Column) {
        return [
          colData.core.__mustGetPropertyName(),
          this.getColumnSQLFromExistingData(colData.core),
        ];
      }
      throw new Error(
        'The argument `selectedName` is required for an SQL expression without any columns inside',
      );
    }
    throw new Error(`Unsupported orderBy column "${toTypeString(col)}"`);
  }

  // Unlike other similar funcs in handling selected columns,
  // this method only tries to get the SQL expression from existing joins.
  // It never creates a join and will error when a join does not exist.
  // It's used in ORDER BY.
  // Returns [varName, SQL segments].
  private getColumnSQLFromExistingData(col: mm.Column): StringSegment[] {
    const { dialect } = this.opt;
    let value = dialect.encodeColumnName(col);
    if (this.hasJoin) {
      const colTable = col.__mustGetTable();
      if (colTable instanceof mm.JoinTable) {
        const jt = col.__getData().table as mm.JoinTable;
        const joinPath = jt.keyPath;
        const join = this.jcMap.get(joinPath);
        if (!join) {
          throw new Error(
            `Column path ”${joinPath}“ does not have a associated value in column alias map`,
          );
        }
        value = `${dialect.encodeName(join.tableAlias)}.${value}`;
      } else {
        // Use table name as alias
        value = `${dialect.encodeName(this.localTableAlias(colTable))}.${value}`;
      }
    }
    return [value];
  }

  private handleFrom(table: mm.Table): StringSegment[] {
    const { opt } = this;
    const e = opt.dialect.encodeName;
    const tableDBName = table.__getDBName();
    const encodedTableName = e(tableDBName);
    const segList: StringSegment[] = ['FROM '];
    if (this.configurableTableName) {
      segList.push({ code: defs.cfTableUsageCode(this.configurableTableName) });
    } else {
      segList.push(encodedTableName);
    }
    if (this.hasJoin) {
      segList.push(' AS ' + encodedTableName);
    }
    return segList;
  }

  // eslint-disable-next-line class-methods-use-this
  private guessColumnType(sql: mm.SQL): mm.ColumnType | undefined {
    if (sql.elements.length === 1) {
      const first = sql.elements[0];
      if (!first) {
        throw new Error('Unexpected empty SQL expression');
      }
      if (first.type === mm.SQLElementType.column) {
        return first.toColumn().__type();
      }
      if (first.type === mm.SQLElementType.call) {
        const call = first.toCall();
        const { returnType } = call;
        if (typeof returnType === 'number') {
          const returnTypeArg = call.params[returnType];
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          if (!returnTypeArg) {
            throw new Error(`Index of out range when probing return type, index: ${returnType}`);
          }
          if (returnTypeArg instanceof mm.Column) {
            return returnTypeArg.__type();
          }
          throw new Error(
            `Index-based return type data is not a \`Column\`, got ${toTypeString(returnTypeArg)}`,
          );
        }
        return returnType;
      }
    }
    return undefined;
  }

  // Converts column SQL expr to SQL code segments.
  // Returns [column ID, model name, SQL expression].
  private getSelectedColumnSQLCode(
    colSQL: mm.SQL,
    col: mm.Column,
    alias: string | null,
    opt?: SQLIOBuilderOption,
  ): [string, StringSegment[]] {
    const sqlTable = this.mustGetAvailableSQLTable();
    // Alias is required when `hasJoin` is true.
    const modelName = col.__getModelName();
    let sql: mm.SQL;
    if (alias) {
      sql = this.opt.dialect.as(colSQL, stringUtils.toSnakeCase(alias));
    } else {
      sql = colSQL;
    }
    const variableName = alias || modelName;
    return [variableName, sqlIO(sql, this.opt.dialect, sqlTable, opt).code];
  }

  // Returns SQL expr of the selected column.
  /**
   * Reasons for returning `StringSegment[]` instead of `mm.SQL`:
   * We need to replace selected columns to columns with aliases (AS blablabla),
   * `mm.SQL` is not meant to be expressive, we have raw columns for columns with
   * an alias, we should use raw SQL aliases in `mm.SQL`.
   */
  private handleSelectedColumn(sCol: mm.SelectedColumnTypes): SelectedColumnIO {
    const sqlTable = this.mustGetAvailableSQLTable();
    const { dialect } = this.opt;
    // Plain columns like `post.id`.
    if (sCol instanceof mm.Column) {
      const colResult = this.handlePlainSelectedColumn(sCol);
      const [varName, colSQLCode] = this.getSelectedColumnSQLCode(colResult.sql, sCol, null);

      return new SelectedColumnIO(
        colResult.id,
        sCol,
        colSQLCode,
        varName,
        undefined,
        sCol,
        sCol.__type(),
        colResult.nullable,
      );
    }

    const { core, selectedName } = sCol.__getData();
    if (!core) {
      throw new Error('Unexpected undefined `RawColumn.core`');
    }
    // Renamed columns like `post.id.as('foo')`.
    if (core instanceof mm.Column) {
      const colResult = this.handlePlainSelectedColumn(core);
      const [varName, colSQLCode] = this.getSelectedColumnSQLCode(
        colResult.sql,
        core,
        selectedName ?? null,
      );

      return new SelectedColumnIO(
        colResult.id,
        sCol,
        colSQLCode,
        varName,
        selectedName,
        core,
        core.__type(),
        colResult.nullable,
      );
    }

    // Raw column with an SQL expr.
    // Selected name is required.
    if (!selectedName) {
      throw new Error(
        'The argument "selectedName" is required for an SQL expression without any columns inside',
      );
    }
    // If we cannot guess the result type (`resultType` is null), and neither does a user specified.
    // Throw an error cuz we cannot determine the result type.
    const resultType = this.guessColumnType(core);
    if (!resultType && !sCol.__getData().type) {
      throw new Error(
        `Column type is required for a "${toTypeString(sCol)}" without any embedded columns`,
      );
    }

    // Add alias.
    const rawExpr = dialect.as(core, stringUtils.toSnakeCase(selectedName));
    const info = sqlIO(rawExpr, dialect, sqlTable, this.getSQLBuilderOpt());
    return new SelectedColumnIO(
      dialect.encodeName(selectedName),
      sCol,
      info.code,
      selectedName, // inputName
      selectedName, // alias is always present in this case.
      undefined,
      resultType,
      false,
    );
  }

  private scanJoinsFromCol(jc: mm.Column): JoinIO | null {
    const { table } = jc.__getData();
    if (!(table instanceof mm.JoinTable)) {
      return null;
    }

    const sqlTable = this.mustGetAvailableSQLTable();
    const { dialect } = this.opt;
    const result = this.jcMap.get(table.keyPath);
    if (result) {
      // Update `JoinIO.extraSQL` if needed.
      // See `JoinIO.extraSQL` for details.
      if (!result.extraSQL && table.extraSQL) {
        result.extraSQL = sqlIO(table.extraSQL, dialect, sqlTable, this.getSQLBuilderOpt());
      }
      return result;
    }

    // Handle nested joins.
    let localTableName: string;
    const { srcColumn, destColumn, destTable } = table;
    const srcTable = srcColumn.__mustGetTable();
    if (srcTable instanceof mm.JoinTable) {
      const srcIO = this.scanJoinsFromCol(srcColumn);
      if (!srcIO) {
        throw new Error('Unexpected null result from `scanJoinsFromCol`');
      }
      localTableName = srcIO.tableAlias;
    } else {
      localTableName = this.localTableAlias(srcTable);
      this.homeTableJoinType = table.joinType;
    }

    const joinIO = new JoinIO(
      table.joinType,
      table.keyPath,
      this.nextJoinedTableName(),
      localTableName,
      srcColumn,
      destTable.__getDBName(),
      destColumn,
      table.extraColumns,
    );
    this.jcMap.set(table.keyPath, joinIO);
    this.joins.push(joinIO);

    // Handle extra data that might contain joins.
    // This must happen after join IO is added in `jcMap`. Otherwise, stack overflow
    // will happen if current join table is in extra SQL.
    if (table.extraSQL) {
      sqlHelper.visitColumns(table.extraSQL, (c) => {
        this.scanJoinsFromCol(c);
        return true;
      });

      const extraSQLIO = sqlIO(table.extraSQL, dialect, sqlTable, this.getSQLBuilderOpt());
      joinIO.extraSQL = extraSQLIO;
    }
    return joinIO;
  }

  // Called by `handleSelectedColumn`.
  // Returns SQL expr of the selected plain column object.
  private handlePlainSelectedColumn(col: mm.Column): {
    sql: mm.SQL;
    nullable: boolean;
    id: StringSegment;
  } {
    const sqlTable = this.mustGetAvailableSQLTable();
    const { dialect } = this.opt;
    const e = dialect.encodeName;
    // Make sure column is initialized.
    const colTable = col.__mustGetTable();
    // Make sure column is from current table.
    col.__checkSourceTable(sqlTable);

    let colIDString: string;
    let nullable: boolean;
    if (colTable instanceof mm.JoinTable) {
      const joinIO = this.jcMap.get(colTable.keyPath);
      if (!joinIO) {
        throw new Error(`Unexpected null \`JoinIO\` for table "${colTable}"`);
      }
      const mirroredCol = col.__getData().mirroredColumn;
      if (!mirroredCol) {
        throw new Error(
          `Internal error: unexpected empty \`mirroredColumn\` in joined column "${toTypeString(
            col,
          )}"`,
        );
      }

      colIDString = `${e(joinIO.tableAlias)}.${e(mirroredCol.__getDBName())}`;
      nullable = colTable.joinType === mm.JoinType.full || colTable.joinType === mm.JoinType.left;
    } else {
      const { homeTableJoinType } = this;

      colIDString = `${e(col.__getDBName())}`;
      if (this.hasJoin) {
        // Each column must have a prefix in an SQL expression with joins.
        // NOTE: use table `DBName` as alias.
        colIDString = `${e(this.localTableAlias(colTable))}.${colIDString}`;
      }
      nullable = homeTableJoinType === mm.JoinType.full || homeTableJoinType === mm.JoinType.right;
    }
    return { sql: mm.sql`${colIDString}`, nullable, id: colIDString };
  }

  private nextJoinedTableName(): string {
    this.joinedTableCounter++;
    return `join_${this.joinedTableCounter}`;
  }

  // eslint-disable-next-line class-methods-use-this
  private localTableAlias(table: mm.Table): string {
    return table.__getDBName();
  }

  // Called at the beginning of the `convert` function. It runs through all selected
  // columns, and returns the join type of the home table if there's a join.
  private scanJoins(
    selectedCols: mm.SelectedColumnTypes[],
    whereSQL: mm.SQL | undefined,
    havingSQL: mm.SQL | undefined,
  ) {
    const visitColFn = (c: mm.Column) => {
      this.scanJoinsFromCol(c);
      return true;
    };
    for (const sc of selectedCols) {
      sqlHelper.visitColumnsFromSelectedColumn(sc, visitColFn);
    }

    for (const sql of [whereSQL, havingSQL]) {
      if (!sql) {
        continue;
      }
      sqlHelper.visitColumns(sql, visitColFn);
    }
  }
}

export function selectIO(action: mm.Action, opt: ActionToIOOptions): SelectIO {
  const converter = new SelectIOProcessor(action as mm.SelectAction, opt);
  return converter.convert();
}

registerHandler(mm.ActionType.select, selectIO);
