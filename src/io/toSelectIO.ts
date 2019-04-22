import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as io from './io';
import NameContext from '../lib/nameContext';
import toTypeString from 'to-type-string';

// Used internally in SelectProcessor to save an SQL of a selected column associated with an alias.
class ColumnSQL {
  constructor(
    public sql: string,
    public inputName: string,
    public alias: string | null,
  ) {}
}

export class SelectProcessor {
  hasJoin = false;
  // Tracks all processed joins, when processing a new join, we can reuse the JoinIO if it already exists (K: join path, V: JoinIO)
  jcMap = new Map<string, io.JoinIO>();
  // All processed joins
  joins: io.JoinIO[] = [];
  // Make sure all join table alias names are unique
  joinedTableCounter = 0;
  // Make sure all selected column names are unique
  selectedNameContext = new NameContext();

  constructor(public action: dd.SelectAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): io.SelectIO {
    let sql = 'SELECT ';
    const { action } = this;
    const { columns, __table: from } = action;
    this.hasJoin = columns.some(sCol => {
      const [col] = this.fetchColumns(sCol);
      if (col && col.isJoinedColumn()) {
        return true;
      }
      return false;
    });

    // Process columns
    const colIOs: io.SelectedColumnIO[] = [];
    for (const col of columns) {
      const selIO = this.handleSelectedColumn(col);
      colIOs.push(selIO);
    }
    sql += colIOs.map(c => c.sql(this.dialect, this.hasJoin)).join(', ');

    // from
    const fromIO = this.handleFrom(from as dd.Table);
    sql += ' ' + fromIO.sql;

    // joins
    if (this.hasJoin) {
      for (const join of this.joins) {
        const joinSQL = join.toSQL(this.dialect);
        sql += ' ' + joinSQL;
      }
    }

    // where
    let whereIO: io.SQLIO | null = null;
    if (action.whereSQL) {
      whereIO = new io.SQLIO(action.whereSQL);
      sql +=
        ' WHERE ' +
        whereIO.toSQL(this.dialect, ele => {
          if (ele.type === dd.SQLElementType.column) {
            return this.getColumnSQL(ele.toColumn());
          }
          return null;
        });
    }

    // order by
    let orderBySQL = '';
    if (action.orderByColumns.length) {
      orderBySQL = action.orderByColumns
        .map(oCol => {
          let s = this.getOrderByColumnSQL(oCol);
          if (oCol.desc) {
            s += ' DESC';
          }
          return s;
        })
        .join(', ');
    }
    sql += orderBySQL;

    return new io.SelectIO(this.action, sql, colIOs, fromIO, whereIO);
  }

  private getOrderByColumnSQL(nCol: dd.ColumnName): string {
    const { dialect } = this;
    const col = nCol.column;
    if (typeof col === 'string') {
      return dialect.escape(col as string);
    }
    if (col instanceof dd.Column) {
      return this.getColumnSQL(col as dd.Column);
    }
    if (col instanceof dd.RawColumn) {
      return dialect.escape((col as dd.RawColumn).selectedName);
    }
    throw new Error(`Unsupported orderBy column "${toTypeString(col)}"`);
  }

  private getColumnSQL(col: dd.Column): string {
    const { dialect } = this;
    let value = dialect.escapeColumn(col);
    if (this.hasJoin) {
      if (col.isJoinedColumn()) {
        const jt = col.__table as dd.JoinedTable;
        const joinPath = jt.keyPath;
        const join = this.jcMap.get(joinPath);
        if (!join) {
          throw new Error(
            `Column path ”${joinPath}“ does not have a associated value in column alias map`,
          );
        }
        value = `${dialect.escape(join.tableAlias)}.${value}`;
      } else {
        // Use table name as alias
        value = `${dialect.escape(col.tableName())}.${value}`;
      }
    }
    return value;
  }

  private handleFrom(table: dd.Table): io.TableIO {
    const e = this.dialect.escape;
    let sql = `FROM ${e(table.__name)}`;
    if (this.hasJoin) {
      sql += ' AS ' + e(table.__name);
    }
    return new io.TableIO(table, sql);
  }

  // Column = sc is a column || extracted from calculated column
  // Calculated column = sc is a calculated column
  private fetchColumns(
    sCol: dd.SelectActionColumns,
  ): [dd.Column | null, dd.RawColumn | null, dd.ColumnType | null] {
    if (!sCol) {
      throw new Error(`Unexpected null column at fetchColumns`);
    }
    // If user uses a column directly
    if (sCol instanceof dd.Column) {
      const col = sCol as dd.Column;
      return [col, null, col.type];
    }
    if (sCol instanceof dd.RawColumn === false) {
      throw new Error(`Expected an "RawColumn", got ${toTypeString(sCol)}`);
    }
    // If user uses a renamed column (a RawColumn with core = column, and selectedName = newName)
    const cc = sCol as dd.RawColumn;
    if (cc.core instanceof dd.Column) {
      const col = cc.core as dd.Column;
      return [col, cc, col.type];
    }
    if (cc.core instanceof dd.SQL === false) {
      throw new Error(`Expected an "SQL" object, got ${toTypeString(cc.core)}`);
    }
    // Now, RawColumn.core is an SQL expression. Try to extract a column from it.
    const sql = cc.core as dd.SQL;
    const column = sql.findColumn();
    // In this case, we can guess the result type in case user specified type is not present
    const resultType = this.guessColumnType(sql);
    return [column, cc, resultType];
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

  private handleSelectedColumn(
    sCol: dd.SelectActionColumns,
  ): io.SelectedColumnIO {
    const { dialect } = this;
    const [col, calcCol, resultType] = this.fetchColumns(sCol);
    if (col) {
      const colSQL = this.handleColumn(
        col,
        calcCol ? calcCol.selectedName : null,
      );
      if (!calcCol) {
        // Pure column-based selected column
        return new io.SelectedColumnIO(
          sCol,
          colSQL.sql,
          colSQL.inputName,
          colSQL.alias,
          col,
          resultType,
        );
      }

      // RawColumn with .core is a column (a renamed column)
      if (calcCol.core instanceof dd.Column) {
        // Use RawColumn.selectedName as alias
        return new io.SelectedColumnIO(
          sCol,
          colSQL.sql,
          colSQL.inputName,
          calcCol.selectedName,
          col,
          resultType,
        );
      }

      // Here, we have a RawColumn.core is an expression with a column inside
      const rawExpr = calcCol.core as dd.SQL;
      const exprIO = new io.SQLIO(rawExpr);
      // Replace the column with SQL only (no alias).
      // Imagine new RawColumn(dd.sql`COUNT(${col.as('a')})`, 'b'), the embedded column would be interpreted as `'col' AS 'a'`, but it really should be `COUNT('col') AS 'b'`, so this step replace the embedded with the SQL without its attached alias.
      const sql = exprIO.toSQL(dialect, element => {
        if (element.value === col) {
          return colSQL.sql;
        }
        return null;
      });
      // SelectedColumn.alias takes precedence over colSQL.alias
      return new io.SelectedColumnIO(
        sCol,
        sql,
        colSQL.inputName,
        calcCol.selectedName || colSQL.alias,
        col,
        resultType,
      );
    } else {
      if (!calcCol) {
        throw new Error(
          `Unexpected null calculated column from selected column "${sCol}"`,
        );
      }
      // Expression with no columns inside
      const rawExpr = calcCol.core as dd.SQL;
      const exprIO = new io.SQLIO(rawExpr);
      const sql = exprIO.toSQL(dialect);
      // If we cannot guess the result type (`resultType` is null), and neither does a user specified type (`type` is null) exists, we throw cuz we cannot determine the result type
      if (!resultType && !sCol.type) {
        throw new Error(
          `Column type is required for a "${toTypeString(
            sCol,
          )}" without any embedded columns`,
        );
      }
      return new io.SelectedColumnIO(
        sCol,
        sql,
        calcCol.selectedName, // inputName
        calcCol.selectedName, // alias
        null,
        resultType,
      );
    }
  }

  private handleJoinRecursively(jc: dd.Column): io.JoinIO {
    const table = jc.castToJoinedTable();
    const result = this.jcMap.get(table.keyPath);
    if (result) {
      return result;
    }

    let localTableName: string;
    const { srcColumn, destColumn } = table;
    if (srcColumn.isJoinedColumn()) {
      const srcIO = this.handleJoinRecursively(srcColumn);
      localTableName = srcIO.tableAlias;
    } else {
      localTableName = srcColumn.tableName();
    }

    const joinIO = new io.JoinIO(
      table.keyPath,
      this.nextJoinedTableName(),
      localTableName,
      srcColumn,
      destColumn.tableName(),
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
    const { dialect } = this;
    const e = dialect.escape;
    const inputName = alias || this.nextSelectedName(col.inputName());
    // Check for joined column
    if (col.isJoinedColumn()) {
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
        sql = `${e(col.tableName())}.`;
      }
      sql += e(col.getDBName());
      return new ColumnSQL(sql, inputName, alias);
    }
  }

  private nextJoinedTableName(): string {
    this.joinedTableCounter++;
    return `join_${this.joinedTableCounter}`;
  }

  private nextSelectedName(name: string): string {
    return this.selectedNameContext.get(name);
  }
}

export default function selectIO(
  action: dd.SelectAction,
  dialect: Dialect,
): io.SelectIO {
  const pro = new SelectProcessor(action, dialect);
  return pro.convert();
}
