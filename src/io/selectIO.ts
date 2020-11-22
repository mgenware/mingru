/* eslint-disable no-param-reassign */
import * as mm from 'mingru-models';
import toTypeString from 'to-type-string';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect, { StringSegment } from '../dialect';
import { SQLIO, sqlIO, SQLIOBuilderOption } from './sqlIO';
import { ActionIO } from './actionIO';
import * as utils from '../lib/stringUtils';
import VarInfo, { AtomicTypeInfo, CompoundTypeInfo } from '../lib/varInfo';
import VarList from '../lib/varList';
import { registerHandler } from './actionToIO';
import * as defs from '../defs';
import { VarInfoBuilder } from '../lib/varInfoHelper';
import { forEachWithSlots } from '../lib/arrayUtils';
import { ActionToIOOptions } from './actionToIOOptions';
import BaseIOProcessor from './baseIOProcessor';
import * as sqlHelper from '../lib/sqlHelper';

const orderByInputParamName = 'orderBy';

export class JoinIO {
  constructor(
    public path: string,
    public tableAlias: string,
    // Note that `localTable` can also be an alias of another join.
    public localTable: string,
    public localColumn: mm.Column,
    public remoteTable: string,
    public remoteColumn: mm.Column,
    public extraColumns: [mm.Column, mm.Column][],
  ) {}

  toSQL(dialect: Dialect): string {
    const e = dialect.encodeName;
    const alias1 = e(this.tableAlias);
    const alias2 = e(this.localTable);
    let sql = `INNER JOIN ${e(this.remoteTable)} AS ${e(this.tableAlias)} ON ${alias1}.${e(
      this.remoteColumn.getDBName(),
    )} = ${alias2}.${e(this.localColumn.getDBName())}`;

    // Handle multiple columns in a join.
    if (this.extraColumns.length) {
      for (const [col1, col2] of this.extraColumns) {
        sql += ` AND ${alias1}.${e(col1.getDBName())} = ${alias2}.${e(col2.getDBName())}`;
      }
    }
    return sql;
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
    public selectedColumn: mm.SelectActionColumns,
    public valueSQL: StringSegment[],
    // `varName` is alias if present. Otherwise, alias is auto generated from column input name.
    public varName: string,
    public alias: string | null,
    public column: mm.Column | null,
    // Available when we can guess the evaluated type,
    // e.g. an expression containing only one column or `SQLCall`.
    public resultType: mm.ColumnType | null,
  ) {
    throwIfFalsy(selectedColumn, 'selectedColumn');
    throwIfFalsy(valueSQL, 'valueSQL');
  }

  getResultType(): mm.ColumnType {
    if (this.resultType) {
      return this.resultType;
    }
    if (!this.selectedColumn.__type) {
      throw new Error(
        `No column type found on column "${toTypeString(
          this.selectedColumn,
        )}", SQL: "${this.valueSQL.toString()}"`,
      );
    }
    return this.selectedColumn.__type;
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
  hasJoin = false;
  // Tracks all processed joins, when processing a new join,
  // we can reuse the JoinIO if it already exists (K: join path, V: `JoinIO`).
  jcMap = new Map<string, JoinIO>();
  // All processed joins
  joins: JoinIO[] = [];
  // Make sure all join table alias names are unique.
  joinedTableCounter = 0;
  // Tracks all selected column names, and throw on duplicates.
  selectedNames = new Set<string>();
  // K: column path, V: selected var name.
  // NOTE: this only contains columns (no raw columns).
  selectedNamesMap = new Map<string, string>();

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
    const sqlTable = this.mustGetAvailableSQLTable();
    const { action, opt, selectedNames } = this;
    const { dialect } = opt;
    const {
      limitValue,
      offsetValue,
      orderByColumns,
      groupByColumns,
      distinctFlag,
      unions,
    } = action;
    const selMode = action.mode;
    const hasUnions = unions.length;

    const sql: StringSegment[] = [(hasUnions ? '(' : '') + 'SELECT '];
    if (distinctFlag) {
      sql.push('DISTINCT ');
    }

    if (!opt.selectionLiteMode) {
      const actionName = this.mustGetActionName();
      if (!actionName) {
        throw new Error(`\`actionName\` is required, action "${action}"`);
      }

      // NOTE: not the table defined by FROM, it's the root table defined in table actions.
      // Those fields are used to generate result type definition.
      // This process call be skipped if we don't need a result type.
      this.tablePascalName = utils.tablePascalName(this.mustGetGroupTable().__name);
      this.actionPascalName = utils.actionPascalName(actionName);
      this.actionUniqueTypeName = `${this.tablePascalName}Table${this.actionPascalName}`;
    }

    let columns: mm.SelectActionColumns[];
    if (selMode === mm.SelectActionMode.exists) {
      if (action.columns.length) {
        throw new Error('You cannot have selected columns in `selectExists`');
      }
      columns = [];
    } else {
      columns = action.columns.length ? action.columns : Object.values(sqlTable.__columns);
    }

    // Checks if there are any joins in this query.
    let hasJoin = columns.some((sCol) => sqlHelper.hasJoinInSelectedColumn(sCol));
    if (!hasJoin && action.whereSQLValue) {
      hasJoin = sqlHelper.hasJoinInSQL(action.whereSQLValue);
    }
    this.hasJoin = hasJoin;

    // Handle columns.
    const colIOs: SelectedColumnIO[] = [];

    if (selMode === mm.SelectActionMode.exists) {
      sql.push('EXISTS(SELECT ');
    }
    if (columns.length) {
      columns.forEach((col, i) => {
        const selIO = this.handleSelectedColumn(col);
        const hasSeparator = i !== columns.length - 1 && columns.length > 1;
        if (selectedNames.has(selIO.varName)) {
          throw new Error(`The selected column name "${selIO.varName}" already exists`);
        }
        selectedNames.add(selIO.varName);
        if (selIO.column) {
          this.selectedNamesMap.set(selIO.column.getPath(), selIO.varName);
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
    let whereIO: SQLIO | null = null;
    let whereSQL: StringSegment[] = [];
    if (action.whereSQLValue) {
      whereIO = sqlIO(action.whereSQLValue, dialect, sqlTable, this.getSQLBuilderOpt(''));
      whereSQL = [' WHERE ', ...whereIO.code];
    }

    // Joins
    if (this.hasJoin) {
      for (const join of this.joins) {
        const joinSQL = join.toSQL(dialect);
        sql.push(' ' + joinSQL);
      }
    }

    // Append WHERE SQL after joins
    if (whereSQL.length) {
      sql.push(...whereSQL);
    }

    // Func args
    const limitTypeInfo = new VarInfo('limit', defs.intTypeInfo);
    const offsetTypeInfo = new VarInfo('offset', defs.intTypeInfo);
    const funcArgs = new VarList(`Func args of action "${action.__name}"`, true);
    funcArgs.add(defs.dbxQueryableVar);
    if (this.isFromTableInput()) {
      funcArgs.add(defs.tableInputVar);
    }
    const execArgs = new VarList(`Exec args of action "${action.__name}"`, true);

    // Handle UNIONs before ORDER BY.
    // See `ActionToIOOptions.notFirstUnionMember` for details.
    let unionIdx = 0;
    for (const unionTuple of unions) {
      const unionAction = unionTuple.action;
      const isUnionAll = unionTuple.unionAll;
      try {
        sql.push(') UNION');
        if (isUnionAll) {
          sql.push(' ALL');
        }
        sql.push(' (');
        const nextProcessor = new SelectIOProcessor(unionAction, {
          ...opt,
          selectionLiteMode: true,
          notFirstUnionMember: true,
        });
        // Merge func args and exec args.
        const nextIO = nextProcessor.convert();
        sqlHelper.mergeIOVerListsWithActionIO(funcArgs, execArgs, nextIO);

        const nextSQL = nextIO.sql;
        if (nextSQL) {
          sql.push(...nextSQL);
        }
        sql.push(')');
        unionIdx++;
      } catch (err) {
        err.message += ` [UNION index ${unionIdx}]`;
        throw err;
      }
    }

    // ORDER BY
    if (orderByColumns.length && !opt.notFirstUnionMember) {
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
    if (groupByColumns.length) {
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
    if (action.havingSQLValue) {
      havingIO = sqlIO(
        action.havingSQLValue,
        dialect,
        sqlTable,
        this.getSQLBuilderOpt('HAVING clause'),
      );
      sql.push(' HAVING ', ...havingIO.code);
    }

    // Handle ending parenthesis.
    if (selMode === mm.SelectActionMode.exists) {
      sql.push(')');
    }

    // Merge inputs.
    for (const io of this.subqueryIOs) {
      sqlHelper.mergeIOVerListsWithActionIO(funcArgs, execArgs, io);
    }
    sqlHelper.mergeIOVerListsWithSQLIO(funcArgs, execArgs, whereIO);
    sqlHelper.mergeIOVerListsWithSQLIO(funcArgs, execArgs, havingIO);

    if (action.pagination) {
      funcArgs.add(limitTypeInfo);
      funcArgs.add(offsetTypeInfo);
      funcArgs.add(new VarInfo('max', defs.intTypeInfo));
      execArgs.add(limitTypeInfo);
      execArgs.add(offsetTypeInfo);
    } else if (selMode === mm.SelectActionMode.page) {
      funcArgs.add(new VarInfo('page', defs.intTypeInfo));
      funcArgs.add(new VarInfo('pageSize', defs.intTypeInfo));
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
    const returnValues = new VarList(`Return values of action "${action.__name}"`, true);
    if (!opt.selectionLiteMode) {
      if (selMode === mm.SelectActionMode.field) {
        const col = colIOs[0];
        const typeInfo = dialect.colTypeToGoType(col.getResultType());
        returnValues.add(new VarInfo(mm.ReturnValues.result, typeInfo));
      } else if (selMode === mm.SelectActionMode.exists) {
        returnValues.add(new VarInfo(mm.ReturnValues.result, defs.boolTypeInfo));
      } else {
        // `selMode` now equals `.list` or `.row`.
        let resultType: string;
        // Check if result type is renamed.
        if (action.__attrs[mm.ActionAttributes.resultTypeName]) {
          resultType = `${action.__attrs[mm.ActionAttributes.resultTypeName]}`;
        } else {
          resultType = `${this.actionUniqueTypeName}Result`;
        }

        let isResultTypeArray = false;
        if (selMode === mm.SelectActionMode.list || selMode === mm.SelectActionMode.page) {
          isResultTypeArray = true;
        }
        const resultTypeInfo = new AtomicTypeInfo(resultType, null, null);

        returnValues.add(
          new VarInfo(
            mm.ReturnValues.result,
            new CompoundTypeInfo(resultTypeInfo, true, isResultTypeArray),
          ),
        );
        if (action.pagination) {
          returnValues.add(new VarInfo('max', defs.intTypeInfo));
        } else if (action.mode === mm.SelectActionMode.page) {
          returnValues.add(new VarInfo('hasNext', defs.boolTypeInfo));
        }
      }
    }

    return new SelectIO(
      dialect,
      action,
      sql,
      colIOs,
      whereIO,
      funcArgs,
      execArgs,
      returnValues,
      this.orderByInputIOs,
    );
  }

  private getSQLBuilderOpt(noJoinRegion: string): SQLIOBuilderOption {
    return {
      rewriteElement: (ele) => {
        if (ele.type === mm.SQLElementType.column) {
          const col = ele.toColumn();
          const colTable = col.mustGetTable();
          if (colTable instanceof mm.JoinedTable) {
            if (!noJoinRegion) {
              this.handleJoinRecursively(col);
            } else {
              throw new Error(
                `Join is not allowed in ${noJoinRegion}, offending column "${col.__name}"`,
              );
            }
          }
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
        names.push(mm.utils.toPascalCase(`${enumTypeName}${displayName}`));
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
  private getOrderByNonInputColumnSQL(col: mm.SelectActionColumnNames): [string, StringSegment[]] {
    const { dialect } = this.opt;

    if (typeof col === 'string') {
      return [col, [dialect.encodeName(col)]];
    }
    if (col instanceof mm.Column) {
      const varName = this.selectedNamesMap.get(col.getPath());
      return [
        col.mustGetName(),
        varName ? [dialect.encodeName(varName)] : this.getColumnSQLFromExistingData(col),
      ];
    }
    if (col instanceof mm.RawColumn) {
      if (col.selectedName) {
        return [col.selectedName, [dialect.encodeName(col.selectedName)]];
      }
      if (col.core instanceof mm.Column) {
        return [col.core.mustGetName(), this.getColumnSQLFromExistingData(col.core)];
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
      const colTable = col.mustGetTable();
      if (colTable instanceof mm.JoinedTable) {
        const jt = col.__table as mm.JoinedTable;
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
    const tableDBName = table.getDBName();
    const encodedTableName = e(tableDBName);
    const segList: StringSegment[] = ['FROM '];
    if (this.isFromTableInput()) {
      segList.push({ code: defs.tableInputName });
    } else {
      segList.push(encodedTableName);
    }
    if (this.hasJoin) {
      segList.push(' AS ' + encodedTableName);
    }
    return segList;
  }

  // eslint-disable-next-line class-methods-use-this
  private guessColumnType(sql: mm.SQL): mm.ColumnType | null {
    if (sql.elements.length === 1) {
      const first = sql.elements[0];
      if (first.type === mm.SQLElementType.column) {
        return first.toColumn().__type;
      }
      if (first.type === mm.SQLElementType.call) {
        const call = first.toCall();
        const { returnType } = call;
        if (typeof returnType === 'number') {
          const returnTypeArg = call.params[returnType];
          if (!returnTypeArg) {
            throw new Error(`Index of out range when probing return type, index: ${returnType}`);
          }
          if (returnTypeArg instanceof mm.Column) {
            return returnTypeArg.__type;
          }
          throw new Error(
            `Index-based return type data is not a \`Column\`, got ${toTypeString(returnTypeArg)}`,
          );
        }
        return returnType;
      }
    }
    return null;
  }

  // Converts column SQL expr to SQL code segments.
  // It also returns the variable name of this column. Variable name is used to generate result property type.
  private getSelectedColumnSQLCode(
    colSQL: mm.SQL,
    col: mm.Column,
    alias: string | null,
    opt?: SQLIOBuilderOption,
  ): [string, StringSegment[]] {
    const sqlTable = this.mustGetAvailableSQLTable();
    // Alias is required when `hasJoin` is true.
    const inputName = col.getInputName();
    if (this.hasJoin) {
      alias = alias || inputName;
    }
    const sql = alias ? this.opt.dialect.as(colSQL, alias) : colSQL;
    const variableName = alias || inputName;
    return [variableName, sqlIO(sql, this.opt.dialect, sqlTable, opt).code];
  }

  // Returns SQL expr of the selected column.
  /**
   * Reasons for returning `StringSegment[]` instead of `mm.SQL`:
   * We need to replace selected columns to columns with aliases (AS blablabla),
   * `mm.SQL` is not meant to be expressive, we have raw columns for columns with
   * an alias, we should use raw SQL aliases in `mm.SQL`.
   */
  private handleSelectedColumn(sCol: mm.SelectActionColumns): SelectedColumnIO {
    const sqlTable = this.mustGetAvailableSQLTable();
    const { dialect } = this.opt;
    // Plain columns like `post.id`.
    if (sCol instanceof mm.Column) {
      const colSQL = this.handlePlainSelectedColumn(sCol);
      const [varName, colSQLCode] = this.getSelectedColumnSQLCode(colSQL, sCol, null);

      return new SelectedColumnIO(sCol, colSQLCode, varName, null, sCol, sCol.__type);
    }

    const { core, selectedName } = sCol;
    // Renamed columns like `post.id.as('foo')`.
    if (core instanceof mm.Column) {
      const colSQL = this.handlePlainSelectedColumn(core);
      const [varName, colSQLCode] = this.getSelectedColumnSQLCode(colSQL, core, selectedName);

      return new SelectedColumnIO(sCol, colSQLCode, varName, selectedName, core, core.__type);
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
    if (!resultType && !sCol.__type) {
      throw new Error(
        `Column type is required for a "${toTypeString(sCol)}" without any embedded columns`,
      );
    }

    // Add alias.
    const rawExpr = dialect.as(core, selectedName);
    const info = sqlIO(rawExpr, dialect, sqlTable, this.getSQLBuilderOpt(''));
    return new SelectedColumnIO(
      sCol,
      info.code,
      selectedName, // inputName
      selectedName, // alias is always present in this case.
      null,
      resultType,
    );
  }

  private handleJoinRecursively(jc: mm.Column): JoinIO {
    const table = jc.__table as mm.JoinedTable;
    const result = this.jcMap.get(table.keyPath);
    if (result) {
      return result;
    }

    let localTableName: string;
    const { srcColumn, destColumn, destTable } = table;
    const srcTable = srcColumn.mustGetTable();
    if (srcTable instanceof mm.JoinedTable) {
      const srcIO = this.handleJoinRecursively(srcColumn);
      localTableName = srcIO.tableAlias;
    } else {
      localTableName = this.localTableAlias(srcTable);
    }

    const joinIO = new JoinIO(
      table.keyPath,
      this.nextJoinedTableName(),
      localTableName,
      srcColumn,
      destTable.getDBName(),
      destColumn,
      table.extraColumns,
    );
    this.jcMap.set(table.keyPath, joinIO);
    this.joins.push(joinIO);
    return joinIO;
  }

  // Called by `handleSelectedColumn`.
  // Returns SQL expr of the selected plain column object.
  private handlePlainSelectedColumn(col: mm.Column): mm.SQL {
    const sqlTable = this.mustGetAvailableSQLTable();
    const { dialect } = this.opt;
    const e = dialect.encodeName;
    // Make sure column is initialized.
    const colTable = col.mustGetTable();
    // Make sure column is from current table.
    col.checkSourceTable(sqlTable);

    let colSQL: mm.SQL;
    if (colTable instanceof mm.JoinedTable) {
      const joinIO = this.handleJoinRecursively(col);
      if (!col.__mirroredColumn) {
        throw new Error(
          `Internal error: unexpected empty \`mirroredColumn\` in joined column "${toTypeString(
            col,
          )}"`,
        );
      }
      colSQL = mm.sql`${e(joinIO.tableAlias)}.${e(col.__mirroredColumn.getDBName())}`;
    } else {
      // Column without a join.
      colSQL = mm.sql`${e(col.getDBName())}`;
      if (this.hasJoin) {
        // Each column must have a prefix in a SQL with joins.
        // NOTE: use table `DBName` as alias.
        colSQL = mm.sql`${e(this.localTableAlias(colTable))}.${colSQL}`;
      }
    }
    return colSQL;
  }

  private nextJoinedTableName(): string {
    this.joinedTableCounter++;
    return `join_${this.joinedTableCounter}`;
  }

  // eslint-disable-next-line class-methods-use-this
  private localTableAlias(table: mm.Table): string {
    return table.getDBName();
  }
}

export function selectIO(action: mm.Action, opt: ActionToIOOptions): SelectIO {
  const converter = new SelectIOProcessor(action as mm.SelectAction, opt);
  return converter.convert();
}

registerHandler(mm.ActionType.select, selectIO);
