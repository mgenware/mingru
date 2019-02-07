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

export class SelectProcessor<T extends dd.Table> {
  // Tracks all processed joins, when processing a new join, we can reuse the JoinIO if it already exists (K: join path, V: JoinIO)
  jcMap = new Map<string, io.JoinIO>();
  // All processed joins
  joins: io.JoinIO[] = [];
  // Make sure all join table alias names are unique
  joinedTableCounter = 0;
  // Make sure all selected column names are unique
  selectedNameContext = new NameContext();

  constructor(public action: dd.SelectAction<T>, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): io.SelectIO<T> {
    let sql = 'SELECT ';
    const { action } = this;
    const { columns, table: from } = action;
    const hasJoin = columns.some(sCol => {
      const [col] = this.fetchColumns(sCol);
      if (col && col.isJoinedColumn()) {
        return true;
      }
      return false;
    });

    // Process columns
    const colIOs: io.SelectedColumnIO[] = [];
    for (const col of columns) {
      const selIO = this.handleSelectedColumn(col, hasJoin);
      colIOs.push(selIO);
    }
    sql += colIOs.map(c => c.sql(this.dialect, hasJoin)).join(', ');

    // from
    const fromIO = this.handleFrom(from as dd.Table, hasJoin);
    sql += ' ' + fromIO.sql;

    // joins
    if (hasJoin) {
      for (const join of this.joins) {
        const joinSQL = join.toSQL(this.dialect);
        sql += ' ' + joinSQL;
      }
    }

    // where
    let whereIO: io.SQLIO | null = null;
    if (action.whereSQL) {
      whereIO = new io.SQLIO(action.whereSQL);
      sql += ' WHERE ' + whereIO.toSQL(this.dialect);
    }

    return new io.SelectIO(this.action, sql, colIOs, fromIO, whereIO);
  }

  private handleFrom(table: dd.Table, hasJoin: boolean): io.TableIO {
    const e = this.dialect.escape;
    let sql = `FROM ${e(table.__name)}`;
    if (hasJoin) {
      sql += ' AS ' + e(table.__name);
    }
    return new io.TableIO(table, sql);
  }

  // Column = sc is a column || extracted from calculated column
  // Calculated column = sc is a calculated column
  private fetchColumns(
    sCol: dd.SelectActionColumns,
  ): [dd.Column | null, dd.CalculatedColumn | null, dd.ColumnType | null] {
    // If user uses a column directly
    if (sCol instanceof dd.Column) {
      const col = sCol as dd.Column;
      return [col, null, col.type];
    }
    // If user uses a renamed column (a CalculatedColumn with core = column, and selectedName = newName)
    const cc = sCol as dd.CalculatedColumn;
    if (cc.core instanceof dd.Column) {
      const col = cc.core as dd.Column;
      return [col, cc, col.type];
    }
    // Now, CalculatedColumn.core is an SQL expression. Try to extract a column from it.
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
    hasJoin: boolean,
  ): io.SelectedColumnIO {
    const { dialect } = this;
    const [col, calcCol, resultType] = this.fetchColumns(sCol);
    if (col) {
      const colSQL = this.handleColumn(
        col,
        hasJoin,
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

      // CalculatedColumn with .core is a column (a renamed column)
      if (calcCol.core instanceof dd.Column) {
        // Use CalculatedColumn.selectedName as alias
        return new io.SelectedColumnIO(
          sCol,
          colSQL.sql,
          colSQL.inputName,
          calcCol.selectedName,
          col,
          resultType,
        );
      }

      // Here, we have a CalculatedColumn.core is an expression with a column inside
      const rawExpr = calcCol.core as dd.SQL;
      const exprIO = new io.SQLIO(rawExpr);
      // Replace the column with SQL only (no alias).
      // Imagine new CalculatedColumn(dd.sql`COUNT(${col.as('a')})`, 'b'), the embedded column would be interpreted as `'col' AS 'a'`, but it really should be `COUNT('col') AS 'b'`, so this step replace the embedded with the SQL without its attached alias.
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
    hasJoin: boolean,
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
      const sql = `${e(joinIO.tableAlias)}.${e(col.mirroredColumn.name)}`;
      return new ColumnSQL(sql, inputName, alias);
    } else {
      // Normal column
      let sql = '';
      if (hasJoin) {
        // Each column must have a prefix in a SQL with joins
        sql = `${e(col.tableName())}.`;
      }
      sql += e(col.name);
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

  private getJoinPathToNameMap(): Map<string, string> {
    const map = new Map<string, string>();
    this.jcMap.forEach((value, key) => {
      map.set(key, value.tableAlias);
    });
    return map;
  }
}

export default function selectIO<T extends dd.Table>(
  action: dd.SelectAction<T>,
  dialect: Dialect,
): io.SelectIO<T> {
  const pro = new SelectProcessor(action, dialect);
  return pro.convert();
}
