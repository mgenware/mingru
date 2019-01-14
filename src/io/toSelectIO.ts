import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as io from './io';
import NameContext from '../lib/nameContext';
import toTypeString from 'to-type-string';
import { Column } from 'dd-models';

// Used internally in SelectProcessor to save an SQL of a selected column associated with an alias.
class ColumnSQL {
  constructor(public sql: string, public alias: string) {}
}

export class SelectProcessor {
  // Tracks all processed joins, when processing a new join, we can reuse the JoinIO if it already exists
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
    const { columns, table: from } = action;
    const hasJoin = columns.some(selectedCol => {
      let col: dd.Column | null = null;
      if (selectedCol instanceof dd.Column) {
        col = selectedCol as dd.Column;
      } else if (selectedCol instanceof dd.SelectedColumn) {
        col = this.getColumnFromSelectedColumn(
          selectedCol as dd.SelectedColumn,
        );
      }
      if (col) {
        return col.props.isJoinedColumn();
      }
      return false;
    });

    // Process columns
    const colIOs: io.SelectedColumnIO[] = [];
    for (const col of columns) {
      const selIO = this.handleSelectedColumn(col, hasJoin);
      colIOs.push(selIO);
    }
    sql += colIOs.map(c => c.sql).join(', ');

    // from
    const fromIO = this.handleFrom(from as dd.Table, hasJoin);
    sql += ' ' + fromIO.sql;

    // where
    let whereIO: io.SQLIO | null = null;
    if (action.whereSQL) {
      whereIO = new io.SQLIO(action.whereSQL);
      sql += ' WHERE ' + whereIO.toSQL(this.dialect);
    }

    // joins
    if (hasJoin) {
      for (const join of this.joins) {
        const joinSQL = join.toSQL(this.dialect);
        sql += ' ' + joinSQL;
      }
    }
    return new io.SelectIO(this.action, sql, colIOs, fromIO, whereIO);
  }

  private handleFrom(table: dd.Table, hasJoin: boolean): io.TableIO {
    const e = this.dialect.escape;
    let sql = `FROM ${e(table.__name)}`;
    if (hasJoin) {
      sql += ' AS ' + e(io.MainAlias);
    }
    return new io.TableIO(table, sql);
  }

  private getColumnFromSelectedColumn(sc: dd.SelectedColumn): dd.Column | null {
    if (sc.core instanceof dd.Column) {
      return sc.core as dd.Column;
    }
    // return the first column in the SQL expression
    for (const element of (sc.core as dd.SQL).elements) {
      if (element.type === dd.SQLElementType.column) {
        return element.toColumn();
      }
    }
    return null;
  }

  private handleSelectedColumn(
    sc: dd.SelectedColumn,
    hasJoin: boolean,
  ): io.SelectedColumnIO {
    const { dialect } = this;
    const col = this.getColumnFromSelectedColumn(sc);
    if (col) {
      const colSQL = this.handleColumn(col, hasJoin);
      if (sc.core instanceof dd.Column) {
        // Pure column-based selected column
        return new io.SelectedColumnIO(sc, colSQL.sql, colSQL.alias);
      }

      const rawExpr = sc.core as dd.SQL;
      const exprIO = new io.SQLIO(rawExpr);
      // Expression with embedded column
      const sql = exprIO.toSQL(dialect, element => {
        if (element.value === col) {
          return colSQL.sql;
        }
        return null;
      });
      // SelectedColumn.alias takes precedence over colSQL.alias
      return new io.SelectedColumnIO(sc, sql, sc.selectedName || colSQL.alias);
    } else {
      // Expression with no columns inside
      const rawExpr = sc.core as dd.SQL;
      const exprIO = new io.SQLIO(rawExpr);
      const sql = exprIO.toSQL(dialect);
      return new io.SelectedColumnIO(sc, sql, sc.selectedName);
    }
  }

  private handleJoinRecursively(jc: dd.Column): io.JoinIO {
    const table = jc.props.castToJoinedTable();
    const result = this.jcMap.get(table.keyPath);
    if (result) {
      return result;
    }

    let localTableName: string;
    const { srcColumn, destColumn } = table;
    if (srcColumn.props.isJoinedColumn()) {
      const srcIO = this.handleJoinRecursively(srcColumn);
      localTableName = srcIO.tableAlias;
    } else {
      localTableName = srcColumn.props.tableName();
    }

    const joinIO = new io.JoinIO(
      table.keyPath,
      this.nextJoinedTableName(),
      localTableName,
      srcColumn,
      destColumn.props.tableName(),
      destColumn,
    );
    this.jcMap.set(table.keyPath, joinIO);
    this.joins.push(joinIO);
    return joinIO;
  }

  private handleColumn(col: dd.Column, hasJoin: boolean): ColumnSQL {
    const { dialect } = this;
    const e = dialect.escape;
    // Check for joined column
    if (col.props.isJoinedColumn()) {
      const joinIO = this.handleJoinRecursively(col);
      if (!col.props.mirroredColumn) {
        throw new Error(
          `Internal error: unexpected empty mirroredColumn in joined column "${toTypeString(
            col,
          )}"`,
        );
      }
      const sql = `${e(joinIO.tableAlias)}.${e(
        col.props.mirroredColumn.props.name,
      )}`;
      const alias = this.nextSelectedName(col.props.inputName());
      return new ColumnSQL(dialect.as(sql, alias), alias);
    } else {
      // Normal column
      let sql = '';
      if (hasJoin) {
        sql = `${e(io.MainAlias)}.`;
      }
      sql += e(col.props.name);

      let alias: string;
      if (hasJoin) {
        alias = this.nextSelectedName(col.props.inputName());
        sql = dialect.as(sql, alias);
      } else {
        alias = this.nextSelectedName(col.props.inputName());
      }
      return new ColumnSQL(sql, alias);
    }
  }

  private nextJoinedTableName(): string {
    this.joinedTableCounter++;
    return `_join_${this.joinedTableCounter}`;
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
