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
import { makeStringFromSegments } from '../build/goCode';
import { forEachWithSlots } from '../lib/arrayUtils';

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

export class SelectedColumnIO {
  // See constructor for params details.
  static create(
    selectedColumn: mm.SelectActionColumns,
    varName: string,
    alias: string | null,
    column: mm.Column | null,
    resultType: mm.ColumnType | null,
    rawSQL: mm.SQL,
    dialect: Dialect,
    sourceTable: mm.Table | null,
    hasJoin: boolean,
    opt?: SQLIOBuilderOption,
  ): SelectedColumnIO {
    rawSQL = hasJoin || alias ? dialect.as(rawSQL, alias || varName) : rawSQL;
    const sql = sqlIO(rawSQL, dialect, sourceTable, opt);
    return new SelectedColumnIO(selectedColumn, sql, varName, alias, column, resultType);
  }

  private constructor(
    public selectedColumn: mm.SelectActionColumns,
    public valueSQL: SQLIO,
    // `varName` is alias if present. Otherwise, alias is auto generated from column name.
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
    public action: mm.SelectAction,
    public sql: StringSegment[],
    // `cols` can be empty, it indicates `SELECT *`, which is used in `selectExists`.
    public cols: SelectedColumnIO[],
    public where: SQLIO | null,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
  ) {
    super(dialect, action, funcArgs, execArgs, returnValues);
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
  }

  getSQLCode(): string {
    return makeStringFromSegments(this.sql);
  }
}

// Used internally in `SelectProcessor` to save an SQL of a selected column associated
// with an alias.
class ColumnSQL {
  constructor(public sql: mm.SQL, public inputName: string, public alias: string | null) {}
}

export class SelectIOProcessor {
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

  constructor(public action: mm.SelectAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): SelectIO {
    const sql: StringSegment[] = ['SELECT '];
    const { action, dialect, selectedNames } = this;
    const [fromTable] = action.ensureInitialized();
    const { limitValue, offsetValue, orderByColumns, groupByColumns } = action;
    const selMode = action.mode;

    let columns: mm.SelectActionColumns[];
    if (selMode === mm.SelectActionMode.exists) {
      if (action.columns.length) {
        throw new Error('You cannot have selected columns in `selectExists`');
      }
      columns = [];
    } else {
      columns = action.columns.length ? action.columns : Object.values(fromTable.__columns);
    }

    // hasJoin
    let hasJoin = columns.some((sCol) => {
      const [col] = this.analyzeSelectedColumn(sCol);
      return col && col.__table instanceof mm.JoinedTable;
    });
    if (!hasJoin && action.whereSQLValue) {
      hasJoin = action.whereSQLValue.enumerateColumns(
        (col) => col.__table instanceof mm.JoinedTable,
      );
    }
    this.hasJoin = hasJoin;

    // Handle columns.
    const colIOs: SelectedColumnIO[] = [];

    if (selMode === mm.SelectActionMode.exists) {
      sql.push('EXISTS(SELECT ');
    }
    if (columns.length) {
      for (const col of columns) {
        const selIO = this.handleSelectedColumn(col);
        if (selectedNames.has(selIO.varName)) {
          throw new Error(`The selected column name "${selIO.varName}" already exists`);
        }
        selectedNames.add(selIO.varName);
        colIOs.push(selIO);
      }
      forEachWithSlots(
        colIOs,
        (col) => {
          sql.push(...col.valueSQL.code);
        },
        () => sql.push(', '),
      );
    } else {
      sql.push('*');
    }

    // FROM
    const fromSQL = this.handleFrom(fromTable);
    sql.push(' ' + fromSQL);

    // WHERE
    // Note: WHERE SQL is created here, but only appended to the `sql` variable
    // after joins are handled below.
    let whereIO: SQLIO | null = null;
    let whereSQL: StringSegment[] = [];
    if (action.whereSQLValue) {
      whereIO = sqlIO(action.whereSQLValue, dialect, fromTable, {
        elementHandler: (ele) => {
          if (ele.type === mm.SQLElementType.column) {
            const col = ele.toColumn();
            const [colTable] = col.ensureInitialized();
            if (colTable instanceof mm.JoinedTable) {
              this.handleJoinRecursively(col);
            }
            return this.getColumnSQL(col);
          }
          return null;
        },
        actionHandler: this.sqlIOActionHandler,
      });
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

    // ORDER BY
    if (orderByColumns.length) {
      sql.push(' ORDER BY ');

      forEachWithSlots(
        orderByColumns,
        (col) => {
          sql.push(...this.getOrderByColumnSQL(col));
          if (col.desc) {
            sql.push(' DESC');
          }
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
      havingIO = sqlIO(action.havingSQLValue, dialect, fromTable, {
        elementHandler: (ele) => {
          if (ele.type === mm.SQLElementType.column) {
            const col = ele.toColumn();
            if (col.__table instanceof mm.JoinedTable) {
              throw new Error(
                `Joins are not allowed in HAVING clause, offending column "${col.__name}".`,
              );
            }
            return [dialect.encodeColumnName(col)];
          }
          return null;
        },
        actionHandler: this.sqlIOActionHandler,
      });

      sql.push(' HAVING ', ...havingIO.code);
    }

    // Handle ending parenthesis.
    if (selMode === mm.SelectActionMode.exists) {
      sql.push(')');
    }

    // Func args
    const limitTypeInfo = new VarInfo('limit', defs.intTypeInfo);
    const offsetTypeInfo = new VarInfo('offset', defs.intTypeInfo);
    const funcArgs = new VarList(`Func args of action "${action.__name}"`, true);
    funcArgs.add(defs.dbxQueryableVar);
    const execArgs = new VarList(`Exec args of action "${action.__name}"`, true);
    this.flushInputs(funcArgs, execArgs, whereIO);
    this.flushInputs(funcArgs, execArgs, havingIO);

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

    // Set return types
    const returnValues = new VarList(`Returns of action "${action.__name}"`, true);

    if (selMode === mm.SelectActionMode.field) {
      const col = colIOs[0];
      const typeInfo = dialect.colTypeToGoType(col.getResultType());
      returnValues.add(new VarInfo(mm.ReturnValues.result, typeInfo));
    } else if (selMode === mm.SelectActionMode.exists) {
      returnValues.add(new VarInfo(mm.ReturnValues.result, defs.boolTypeInfo));
    } else {
      // `selMode` now equals `.list` or `.row`.
      const tableNameSrc = fromTable.__name;
      const actionNameSrc = action.__name;
      const tableName = utils.tablePascalName(tableNameSrc);
      if (!actionNameSrc) {
        throw new Error('Action not initialized');
      }
      const funcName = utils.actionPascalName(actionNameSrc);
      let resultType: string;
      // Check if result type is renamed.
      if (action.__attrs[mm.ActionAttributes.resultTypeName]) {
        resultType = `${action.__attrs[mm.ActionAttributes.resultTypeName]}`;
      } else {
        resultType = `${tableName}Table${funcName}Result`;
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

    return new SelectIO(dialect, action, sql, colIOs, whereIO, funcArgs, execArgs, returnValues);
  }

  // Declared as a property to avoid `this` issues as it's used as a callback to other classes.
  private sqlIOActionHandler = (action: mm.Action): StringSegment[] => {
    const sourceTable = this.action.__table;
    const { dialect } = this;
    if (action instanceof mm.SelectAction) {
      // Subqueries don't have a name, we'll give them a dummy name so
      // they are considered initialized.
      if (!action.__name) {
        // eslint-disable-next-line no-param-reassign
        action.__name = '__SQLCall_EMBEDDED_ACTION__';
      }
      // Subqueires may or may not have a table assigned, if not set,
      // we assign current source table to them.
      if (!action.__table) {
        // eslint-disable-next-line no-param-reassign
        action.__table = sourceTable;
      }
      const processor = new SelectIOProcessor(action, dialect);
      const io = processor.convert();
      return io.sql;
    }
    throw new Error(`Subquery can only contain SELECT clause, got "${toTypeString(action)}"`);
  };

  // eslint-disable-next-line class-methods-use-this
  private flushInputs(funcArgs: VarList, execArgs: VarList, io: SQLIO | null) {
    if (!io) {
      return;
    }
    // WHERE or HAVING may contain duplicate vars, we only need distinct vars in func args.
    funcArgs.merge(io.distinctVars);
    // We need to pass all variables to Exec.
    execArgs.merge(io.vars);
  }

  private getOrderByColumnSQL(nCol: mm.OrderByColumn): StringSegment[] {
    const { dialect } = this;
    const col = nCol.column;
    if (typeof col === 'string') {
      return [dialect.encodeName(col)];
    }
    if (col instanceof mm.Column) {
      return this.getColumnSQL(col);
    }
    if (col instanceof mm.RawColumn) {
      if (col.selectedName) {
        return [dialect.encodeName(col.selectedName)];
      }
      if (col.core instanceof mm.Column) {
        return this.getColumnSQL(col.core);
      }
      throw new Error(
        'The argument "selectedName" is required for an SQL expression without any columns inside',
      );
    }
    throw new Error(`Unsupported orderBy column "${toTypeString(col)}"`);
  }

  private getColumnSQL(col: mm.Column): StringSegment[] {
    const { dialect } = this;
    let value = dialect.encodeColumnName(col);
    if (this.hasJoin) {
      const [colTable] = col.ensureInitialized();
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

  private handleFrom(table: mm.Table): string {
    const e = this.dialect.encodeName;
    const tableDBName = table.getDBName();
    const encodedTableName = e(tableDBName);
    let sql = `FROM ${encodedTableName}`;
    if (this.hasJoin) {
      sql += ' AS ' + encodedTableName;
    }
    return sql;
  }

  /*
  * Returns:
  [
    // Can be a column from params, or extracted from a renamed raw column,
    // or extracted from the expression of a raw column
    Column,
    RawColumn,
    ColumnType,
  ]
  */
  private analyzeSelectedColumn(
    sCol: mm.SelectActionColumns,
  ): [mm.Column | null, mm.RawColumn | null, mm.ColumnType | null] {
    if (!sCol) {
      throw new Error('Unexpected null column at fetchColumns');
    }
    // If user uses a column directly
    if (sCol instanceof mm.Column) {
      return [sCol, null, sCol.__type];
    }
    if (sCol instanceof mm.RawColumn === false) {
      throw new Error(`Expected an "RawColumn", got ${toTypeString(sCol)}`);
    }
    // If user uses a renamed column (a RawColumn with core = column, and selectedName = newName)
    const rawCol = sCol;
    if (rawCol.core instanceof mm.Column) {
      const col = rawCol.core;
      return [col, rawCol, col.__type];
    }
    if (rawCol.core instanceof mm.SQL === false) {
      throw new Error(`Expected an "SQL" object, got ${toTypeString(rawCol.core)}`);
    }
    // Now, RawColumn.core is an SQL expression. Try to extract a column from it.
    const sql = rawCol.core;
    const column = sql.findFirstColumn();
    // In this case, we can guess the result type in case user specified type is not present
    const resultType = this.guessColumnType(sql);
    return [column, rawCol, resultType];
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

  private handleSelectedColumn(sCol: mm.SelectActionColumns): SelectedColumnIO {
    const { dialect } = this;
    const [table] = this.action.ensureInitialized();
    const [embeddedCol, rawCol, resultType] = this.analyzeSelectedColumn(sCol);
    if (embeddedCol) {
      const colSQL = this.handleColumn(embeddedCol, rawCol ? rawCol.selectedName || null : null);
      if (!rawCol) {
        // Plain columns like `post.id`.
        return SelectedColumnIO.create(
          sCol,
          colSQL.inputName,
          colSQL.alias,
          embeddedCol,
          resultType,
          // `ColumnSQL.sql` is handwritten, no need validation and element post-processing.
          colSQL.sql,
          dialect,
          null,
          this.hasJoin,
        );
      }

      const rawColCore = rawCol.core;
      // RawColumn with `.core` is a column (a renamed column) such as `post.id.as('newName')`.
      if (rawColCore instanceof mm.Column) {
        // Use `RawColumn.selectedName` as the alias of this column.
        return SelectedColumnIO.create(
          sCol,
          colSQL.inputName,
          rawCol.selectedName || null,
          embeddedCol,
          resultType,
          // `ColumnSQL.sql` is handwritten, no need validation and element post-processing.
          colSQL.sql,
          dialect,
          null,
          this.hasJoin,
        );
      }

      // Here, we have a `RawColumn.core` which is an expression with a column inside.
      // Replace the column with SQL only (no alias).
      // Imagine `new RawColumn(mm.sql`COUNT(${col.as('a')})`, 'b')`, the embedded column would be
      // interpreted as `'col' AS 'a'`, but it really should be `COUNT('col') AS 'b'`, so this
      // step replaces the embedded column with SQL without its attached alias.

      // SelectedColumn.alias takes precedence over colSQL.alias.
      return SelectedColumnIO.create(
        sCol,
        colSQL.inputName,
        rawCol.selectedName || colSQL.alias,
        embeddedCol,
        resultType,
        rawColCore,
        dialect,
        table,
        this.hasJoin,
        {
          elementHandler: (element) => {
            if (element.value === embeddedCol) {
              // `ColumnSQL.sql` is handwritten, no need validation and element post-processing.
              return sqlIO(colSQL.sql, dialect, null).code;
            }
            return null;
          },
          actionHandler: this.sqlIOActionHandler,
        },
      );
    }

    // Expression with no columns inside
    if (!rawCol) {
      throw new Error(`Unexpected null raw column from selected column "${sCol}"`);
    }
    if (rawCol.core instanceof mm.Column) {
      throw new Error(`Unexpected column object in raw column "${rawCol}"`);
    }
    const rawExpr = rawCol.core;
    // If we cannot guess the result type (`resultType` is null), and neither does a user specified
    // type (`type` is null) exists, we throw cuz we cannot determine the result type.
    if (!resultType && !sCol.__type) {
      throw new Error(
        `Column type is required for a "${toTypeString(sCol)}" without any embedded columns`,
      );
    }
    if (!rawCol.selectedName) {
      throw new Error(
        'The argument "selectedName" is required for an SQL expression without any columns inside',
      );
    }
    return SelectedColumnIO.create(
      sCol,
      rawCol.selectedName, // inputName
      rawCol.selectedName, // alias
      null,
      resultType,
      rawExpr,
      dialect,
      table,
      this.hasJoin,
      { actionHandler: this.sqlIOActionHandler },
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
    const [srcTable] = srcColumn.ensureInitialized();
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

  private handleColumn(
    col: mm.Column,
    // if an user alias is present, we don't need to guess the input name just use it as alias.
    alias: string | null,
  ): ColumnSQL {
    const { dialect, action } = this;
    const e = dialect.encodeName;
    const inputName = alias || col.inputName();
    // Make sure column is initialized.
    const [colTable] = col.ensureInitialized();
    // Make sure column is from current table.
    const [sourceTable] = action.ensureInitialized();
    col.checkSourceTable(sourceTable);

    if (colTable instanceof mm.JoinedTable) {
      const joinIO = this.handleJoinRecursively(col);
      if (!col.__mirroredColumn) {
        throw new Error(
          `Internal error: unexpected empty \`mirroredColumn\` in joined column "${toTypeString(
            col,
          )}"`,
        );
      }
      const sql = mm.sql`${e(joinIO.tableAlias)}.${e(col.__mirroredColumn.getDBName())}`;
      return new ColumnSQL(sql, inputName, alias);
    }

    // Column without a join.
    let sql = mm.sql`${e(col.getDBName())}`;
    if (this.hasJoin) {
      // Each column must have a prefix in a SQL with joins.
      // NOTE: use table `DBName` as alias.
      sql = mm.sql`${e(this.localTableAlias(colTable))}.${sql}`;
    }
    return new ColumnSQL(sql, inputName, alias);
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

export function selectIO(action: mm.Action, dialect: Dialect): SelectIO {
  const converter = new SelectIOProcessor(action as mm.SelectAction, dialect);
  return converter.convert();
}

registerHandler(mm.ActionType.select, selectIO);
