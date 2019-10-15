import * as dd from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import toTypeString from 'to-type-string';
import { SQLIO, sqlIO } from './sqlIO';
import { ActionIO } from './actionIO';
import * as utils from './utils';
import VarInfo, { TypeInfo } from '../lib/varInfo';
import VarList from '../lib/varList';
import { registerHanlder } from './actionToIO';
import * as defs from '../defs';

export class JoinIO {
  constructor(
    public path: string,
    public tableAlias: string,
    // Note that localTable can also be an alias of another join
    public localTable: string,
    public localColumn: dd.Column,
    public remoteTable: string,
    public remoteColumn: dd.Column,
  ) {}

  toSQL(dialect: Dialect): string {
    const e = dialect.encodeName;
    const localTableDBName = this.localColumn.tableName(true);
    return `INNER JOIN ${e(this.remoteTable)} AS ${e(this.tableAlias)} ON ${e(
      this.tableAlias,
    )}.${e(this.remoteColumn.getDBName())} = ${e(localTableDBName)}.${e(
      this.localColumn.getDBName(),
    )}`;
  }
}

export class SelectedColumnIO {
  constructor(
    public selectedColumn: dd.SelectActionColumns,
    public valueSQL: string,
    public varName: string, // is alias if it's present, otherwise auto generated from column name
    public alias: string | null,
    public column: dd.Column | null,
    public resultType: dd.ColumnType | null, // Available when we can guess the evaluated type, e.g. an expression containing only one column or SQLCall
  ) {
    throwIfFalsy(selectedColumn, 'selectedColumn');
    throwIfFalsy(valueSQL, 'valueSQL');
  }

  sql(dialect: Dialect, hasJoin: boolean): string {
    if (hasJoin || this.alias) {
      return dialect.as(this.valueSQL, this.alias || this.varName);
    }
    return this.valueSQL;
  }

  getResultType(): dd.ColumnType {
    if (this.resultType) {
      return this.resultType;
    }
    if (!this.selectedColumn.type) {
      throw new Error(
        `No column type found on column "${toTypeString(
          this.selectedColumn,
        )}", SQL: "${this.valueSQL.toString()}"`,
      );
    }
    return this.selectedColumn.type;
  }
}

export const SelectedResultKey = 'result';

export class SelectIO extends ActionIO {
  constructor(
    dialect: Dialect,
    public action: dd.SelectAction,
    public sql: string,
    public cols: SelectedColumnIO[],
    public where: SQLIO | null,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
  ) {
    super(dialect, action, funcArgs, execArgs, returnValues);
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(cols, 'cols');
  }
}

// Used internally in SelectProcessor to save an SQL of a selected column associated with an alias.
class ColumnSQL {
  constructor(
    public sql: string,
    public inputName: string,
    public alias: string | null,
  ) {}
}

export class SelectIOProcessor {
  hasJoin = false;
  // Tracks all processed joins, when processing a new join, we can reuse the JoinIO if it already exists (K: join path, V: JoinIO)
  jcMap = new Map<string, JoinIO>();
  // All processed joins
  joins: JoinIO[] = [];
  // Make sure all join table alias names are unique
  joinedTableCounter = 0;
  // Tracks all selected column names, and throw on duplicates
  selectedNames = new Set<string>();

  constructor(public action: dd.SelectAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): SelectIO {
    let sql = 'SELECT ';
    const { action, dialect } = this;
    const [fromTable] = action.ensureInitialized();
    const columns = action.columns.length
      ? action.columns
      : fromTable.__columns;
    // hasJoin
    let hasJoin = columns.some(sCol => {
      const [col] = this.analyzeSelectedColumn(sCol);
      return col && col.__table instanceof dd.JoinedTable;
    });
    if (!hasJoin && action.whereSQL) {
      hasJoin = action.whereSQL.enumerateColumns(
        col => col.__table instanceof dd.JoinedTable,
      );
    }
    this.hasJoin = hasJoin;

    const selMode = action.mode;

    // Process columns
    const colIOs: SelectedColumnIO[] = [];
    for (const col of columns) {
      const selIO = this.handleSelectedColumn(col);
      if (this.selectedNames.has(selIO.varName)) {
        throw new Error(
          `The selected column name "${selIO.varName}" already exists in action "${action.__name}"`,
        );
      }
      this.selectedNames.add(selIO.varName);
      colIOs.push(selIO);
    }
    sql += colIOs.map(c => c.sql(dialect, this.hasJoin)).join(', ');

    // FROM
    const fromSQL = this.handleFrom(fromTable);
    sql += ' ' + fromSQL;

    // WHERE
    // Note: WHERE SQL is created here, but only appended to `sql` var after joins are handled below.
    let whereIO: SQLIO | null = null;
    let whereSQL = '';
    if (action.whereSQL) {
      whereIO = sqlIO(action.whereSQL, dialect);
      whereSQL =
        ' WHERE ' +
        whereIO.toSQL(fromTable, ele => {
          if (ele.type === dd.SQLElementType.column) {
            const col = ele.toColumn();
            const [colTable] = col.ensureInitialized();
            if (colTable instanceof dd.JoinedTable) {
              this.handleJoinRecursively(col);
            }
            return this.getColumnSQL(col);
          }
          return null;
        });
    }

    // Joins
    if (this.hasJoin) {
      for (const join of this.joins) {
        const joinSQL = join.toSQL(dialect);
        sql += ' ' + joinSQL;
      }
    }

    // Append WHERE SQL after joins
    sql += whereSQL;

    // ORDER BY
    if (action.orderByColumns.length) {
      const orderBySQL =
        ' ORDER BY ' +
        action.orderByColumns
          .map(oCol => {
            let s = this.getOrderByColumnSQL(oCol);
            if (oCol.desc) {
              s += ' DESC';
            }
            return s;
          })
          .join(', ');
      sql += orderBySQL;
    }

    // GROUP BY
    if (action.groupByColumns.length) {
      const groupBySQL =
        ' GROUP BY ' +
        action.groupByColumns.map(s => dialect.encodeName(s)).join(', ');
      sql += groupBySQL;
    }

    // HAVING
    let havingIO: SQLIO | null = null;
    if (action.havingSQL) {
      havingIO = sqlIO(action.havingSQL, dialect);
      sql +=
        ' HAVING ' +
        havingIO.toSQL(fromTable, ele => {
          if (ele.type === dd.SQLElementType.column) {
            const col = ele.toColumn();
            if (col.__table instanceof dd.JoinedTable) {
              throw new Error(
                `Joins are not allowed in HAVING clause, offending column "${col.__name}".`,
              );
            }
            return dialect.encodeColumnName(col);
          }
          return null;
        });
    }

    // Func args
    const limitTypeInfo = new VarInfo('limit', defs.intTypeInfo);
    const offsetTypeInfo = new VarInfo('offset', defs.intTypeInfo);
    const funcArgs = new VarList(
      `Func args of action "${action.__name}"`,
      true,
    );
    funcArgs.add(defs.dbxQueryableVar);
    const execArgs = new VarList(
      `Exec args of action "${action.__name}"`,
      true,
    );
    this.flushInputs(funcArgs, execArgs, whereIO);
    this.flushInputs(funcArgs, execArgs, havingIO);

    if (action.hasLimit) {
      funcArgs.add(limitTypeInfo);
      funcArgs.add(offsetTypeInfo);
      funcArgs.add(new VarInfo('max', defs.intTypeInfo));
      execArgs.add(limitTypeInfo);
      execArgs.add(offsetTypeInfo);
    } else if (selMode === dd.SelectActionMode.page) {
      funcArgs.add(new VarInfo('page', defs.intTypeInfo));
      funcArgs.add(new VarInfo('pageSize', defs.intTypeInfo));
      execArgs.add(limitTypeInfo);
      execArgs.add(offsetTypeInfo);
    }

    // Set return types
    const returnValues = new VarList(
      `Returns of action "${action.__name}"`,
      true,
    );

    if (selMode === dd.SelectActionMode.field) {
      const col = colIOs[0];
      const typeInfo = dialect.colTypeToGoType(col.getResultType());
      returnValues.add(new VarInfo(SelectedResultKey, typeInfo));
    } else {
      // selMode now equals .list or .row
      const tableNameSrc = fromTable.__name;
      const actionNameSrc = action.__name;
      const tableName = utils.tablePascalName(tableNameSrc);
      if (!actionNameSrc) {
        throw new Error('Action not initialized');
      }
      const funcName = utils.actionPascalName(actionNameSrc);
      const originalResultType = `${tableName}Table${funcName}Result`;
      let resultType = `*${originalResultType}`;
      if (
        selMode === dd.SelectActionMode.list ||
        selMode === dd.SelectActionMode.page
      ) {
        resultType = '[]' + resultType;
      }
      returnValues.add(
        new VarInfo(
          SelectedResultKey,
          new TypeInfo(resultType),
          originalResultType,
        ),
      );
      if (action.hasLimit) {
        returnValues.add(new VarInfo('max', defs.intTypeInfo));
      } else if (action.mode === dd.SelectActionMode.page) {
        returnValues.add(new VarInfo('hasNext', defs.boolTypeInfo));
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
    );
  }

  private flushInputs(funcArgs: VarList, execArgs: VarList, io: SQLIO | null) {
    if (!io) {
      return;
    }
    // WHERE or HAVING may contain duplicate vars, we only need distinct vars in func args
    funcArgs.merge(io.distinctVars);
    // We need to pass all variables to Exec
    execArgs.merge(io.vars);
  }

  private getOrderByColumnSQL(nCol: dd.OrderByColumn): string {
    const { dialect } = this;
    const col = nCol.column;
    if (typeof col === 'string') {
      return dialect.encodeName(col);
    }
    if (col instanceof dd.Column) {
      return this.getColumnSQL(col);
    }
    if (col instanceof dd.RawColumn) {
      return dialect.encodeName(col.selectedName);
    }
    throw new Error(`Unsupported orderBy column "${toTypeString(col)}"`);
  }

  private getColumnSQL(col: dd.Column): string {
    const { dialect } = this;
    let value = dialect.encodeColumnName(col);
    if (this.hasJoin) {
      if (col.__table instanceof dd.JoinedTable) {
        const jt = col.__table as dd.JoinedTable;
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
        value = `${dialect.encodeName(col.tableName(true))}.${value}`;
      }
    }
    return value;
  }

  private handleFrom(table: dd.Table): string {
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
    Column,     // Can be a column from params, or extracted from a renamed raw column, or extracted from the expression of a raw column
    RawColumn,
    ColumnType,
  ]
  */
  private analyzeSelectedColumn(
    sCol: dd.SelectActionColumns,
  ): [dd.Column | null, dd.RawColumn | null, dd.ColumnType | null] {
    if (!sCol) {
      throw new Error(`Unexpected null column at fetchColumns`);
    }
    // If user uses a column directly
    if (sCol instanceof dd.Column) {
      return [sCol, null, sCol.type];
    }
    if (sCol instanceof dd.RawColumn === false) {
      throw new Error(`Expected an "RawColumn", got ${toTypeString(sCol)}`);
    }
    // If user uses a renamed column (a RawColumn with core = column, and selectedName = newName)
    const rawCol = sCol;
    if (rawCol.core instanceof dd.Column) {
      const col = rawCol.core;
      return [col, rawCol, col.type];
    }
    if (rawCol.core instanceof dd.SQL === false) {
      throw new Error(
        `Expected an "SQL" object, got ${toTypeString(rawCol.core)}`,
      );
    }
    // Now, RawColumn.core is an SQL expression. Try to extract a column from it.
    const sql = rawCol.core;
    const column = sql.findFirstColumn();
    // In this case, we can guess the result type in case user specified type is not present
    const resultType = this.guessColumnType(sql);
    return [column, rawCol, resultType];
  }

  private guessColumnType(sql: dd.SQL): dd.ColumnType | null {
    if (sql.elements.length === 1) {
      const first = sql.elements[0];
      if (first.type === dd.SQLElementType.column) {
        return first.toColumn().type;
      }
      if (first.type === dd.SQLElementType.call) {
        return first.toCall().returnType;
      }
    }
    return null;
  }

  private handleSelectedColumn(sCol: dd.SelectActionColumns): SelectedColumnIO {
    const { dialect } = this;
    const [table] = this.action.ensureInitialized();
    const [embeddedCol, rawCol, resultType] = this.analyzeSelectedColumn(sCol);
    if (embeddedCol) {
      const colSQL = this.handleColumn(
        embeddedCol,
        rawCol ? rawCol.selectedName : null,
      );
      if (!rawCol) {
        // Pure column-based selected column
        return new SelectedColumnIO(
          sCol,
          colSQL.sql,
          colSQL.inputName,
          colSQL.alias,
          embeddedCol,
          resultType,
        );
      }

      const rawColCore = rawCol.core;
      // RawColumn with .core is a column (a renamed column)
      if (rawColCore instanceof dd.Column) {
        // Use RawColumn.selectedName as alias
        return new SelectedColumnIO(
          sCol,
          colSQL.sql,
          colSQL.inputName,
          rawCol.selectedName,
          embeddedCol,
          resultType,
        );
      }

      // Here, we have a RawColumn.core is an expression with a column inside
      const exprIO = sqlIO(rawColCore, dialect);
      // Replace the column with SQL only (no alias).
      // Imagine new RawColumn(dd.sql`COUNT(${col.as('a')})`, 'b'), the embedded column would be interpreted as `'col' AS 'a'`, but it really should be `COUNT('col') AS 'b'`, so this step replace the embedded with the SQL without its attached alias.
      const sql = exprIO.toSQL(table, element => {
        if (element.value === embeddedCol) {
          return colSQL.sql;
        }
        return null;
      });
      // SelectedColumn.alias takes precedence over colSQL.alias
      return new SelectedColumnIO(
        sCol,
        sql,
        colSQL.inputName,
        rawCol.selectedName || colSQL.alias,
        embeddedCol,
        resultType,
      );
    } else {
      // Expression with no columns inside
      if (!rawCol) {
        throw new Error(
          `Unexpected null raw column from selected column "${sCol}"`,
        );
      }
      if (rawCol.core instanceof dd.Column) {
        throw new Error(`Unexpected column object in raw column "${rawCol}"`);
      }
      const rawExpr = rawCol.core;
      const exprIO = sqlIO(rawExpr, dialect);
      const sql = exprIO.toSQL(table);
      // If we cannot guess the result type (`resultType` is null), and neither does a user specified type (`type` is null) exists, we throw cuz we cannot determine the result type
      if (!resultType && !sCol.type) {
        throw new Error(
          `Column type is required for a "${toTypeString(
            sCol,
          )}" without any embedded columns`,
        );
      }
      return new SelectedColumnIO(
        sCol,
        sql,
        rawCol.selectedName, // inputName
        rawCol.selectedName, // alias
        null,
        resultType,
      );
    }
  }

  private handleJoinRecursively(jc: dd.Column): JoinIO {
    const table = jc.__table as dd.JoinedTable;
    const result = this.jcMap.get(table.keyPath);
    if (result) {
      return result;
    }

    let localTableName: string;
    const { srcColumn, destColumn, destTable } = table;
    const [srcTable] = srcColumn.ensureInitialized();
    if (srcTable instanceof dd.JoinedTable) {
      const srcIO = this.handleJoinRecursively(srcColumn);
      localTableName = srcIO.tableAlias;
    } else {
      localTableName = srcColumn.tableName(true);
    }

    const joinIO = new JoinIO(
      table.keyPath,
      this.nextJoinedTableName(),
      localTableName,
      srcColumn,
      destTable.getDBName(),
      destColumn,
    );
    this.jcMap.set(table.keyPath, joinIO);
    this.joins.push(joinIO);
    return joinIO;
  }

  private handleColumn(
    col: dd.Column,
    alias: string | null, // if an user alias is present, we don't need to guess the input name just use it as alias
  ): ColumnSQL {
    const { dialect, action } = this;
    const e = dialect.encodeName;
    const inputName = alias || col.inputName();
    // Make sure column is initialized
    const [colTable] = col.ensureInitialized();
    // Make sure column is from current table
    const [sourceTable] = action.ensureInitialized();
    col.checkSourceTable(sourceTable);

    if (colTable instanceof dd.JoinedTable) {
      const joinIO = this.handleJoinRecursively(col);
      if (!col.mirroredColumn) {
        throw new Error(
          `Internal error: unexpected empty mirroredColumn in joined column "${toTypeString(
            col,
          )}"`,
        );
      }
      const sql = `${e(joinIO.tableAlias)}.${e(
        col.mirroredColumn.getDBName(),
      )}`;
      return new ColumnSQL(sql, inputName, alias);
    } else {
      // Normal column
      let sql = '';
      if (this.hasJoin) {
        // Each column must have a prefix in a SQL with joins
        // NOTE: use table DBName as alias
        sql = `${e(col.tableName(true))}.`;
      }
      sql += e(col.getDBName());
      return new ColumnSQL(sql, inputName, alias);
    }
  }

  private nextJoinedTableName(): string {
    this.joinedTableCounter++;
    return `join_${this.joinedTableCounter}`;
  }
}

export function selectIO(action: dd.Action, dialect: Dialect): SelectIO {
  const converter = new SelectIOProcessor(action as dd.SelectAction, dialect);
  return converter.convert();
}

registerHanlder(dd.ActionType.select, selectIO);
