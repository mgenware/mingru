import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as io from './io';

export class SelectProcessor {
  jcMap = new Map<string, io.JoinIO>();
  joins: io.JoinIO[] = [];
  // This makes sure all join table alias names are unique
  joinedTableCounter = 0;
  // This makes sure all selected column names are unique
  joinedColumnNameMap: { [k: string]: number } = {};

  constructor(public action: dd.SelectAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): io.SelectIO {
    let sql = 'SELECT ';
    const { action } = this;
    const { columns, table: from } = action;
    const hasJoin = columns.some(c => c instanceof dd.JoinedColumn);

    // Process columns
    const colIOs: io.ColumnIO[] = [];
    for (const col of columns) {
      const selIO = this.handleSelect(col, hasJoin);
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

  private handleSelect(col: dd.ColumnBase, hasJoin: boolean): io.ColumnIO {
    let alias: string | null = null;
    if (col instanceof dd.SelectedColumn) {
      const selectedCol = col as dd.SelectedColumn;
      alias = selectedCol.selectedName;
      // Reset the column to the underlying column of SelectedColumn.
      col = selectedCol.column;
    }
    if (col instanceof dd.JoinedColumn) {
      return this.handleJoinedColumn(col as dd.JoinedColumn, alias);
    }
    return this.handleStandardColumn(col, hasJoin, alias);
  }

  private handleJoin(jc: dd.JoinedColumn): io.JoinIO {
    const result = this.jcMap.get(jc.joinPath);
    if (result) {
      return result;
    }

    let localTableName: string;
    const { localColumn, remoteColumn } = jc;
    if (localColumn instanceof dd.JoinedColumn) {
      const srcIO = this.handleJoin(jc.localColumn as dd.JoinedColumn);
      localTableName = srcIO.tableAlias;
    } else {
      localTableName = localColumn.tableName;
    }

    const joinIO = new io.JoinIO(
      jc.joinPath,
      this.nextJoinedTableName(),
      localTableName,
      localColumn,
      remoteColumn.tableName,
      remoteColumn,
    );
    this.jcMap.set(jc.joinPath, joinIO);
    this.joins.push(joinIO);
    return joinIO;
  }

  private handleJoinedColumn(
    jc: dd.JoinedColumn,
    presetAlias: string | null,
  ): io.ColumnIO {
    const joinIO = this.handleJoin(jc);
    const { dialect } = this;
    const e = dialect.escape;
    const sql = `${e(joinIO.tableAlias)}.${e(jc.selectedColumn.__name)}`;
    const alias = this.nextSelectedName(
      presetAlias ? presetAlias : jc.__getInputName(),
    );
    return new io.ColumnIO(jc, dialect.as(sql, alias), alias);
  }

  private nextJoinedTableName(): string {
    this.joinedTableCounter++;
    return `_join_${this.joinedTableCounter}`;
  }

  private nextSelectedName(name: string): string {
    const { joinedColumnNameMap } = this;
    let result = name;
    if (!joinedColumnNameMap[name]) {
      joinedColumnNameMap[name] = 2;
    } else {
      result = name + joinedColumnNameMap[name];
      joinedColumnNameMap[name] += 1;
    }
    return result;
  }

  private handleStandardColumn(
    col: dd.ColumnBase,
    hasJoin: boolean,
    presetAlias: string | null,
  ): io.ColumnIO {
    const { dialect } = this;
    const e = dialect.escape;
    let sql = '';
    if (hasJoin) {
      sql = `${e(io.MainAlias)}.`;
    }
    sql += e(col.__name);

    let alias: string;
    if (presetAlias || hasJoin) {
      alias = this.nextSelectedName(
        presetAlias ? presetAlias : col.__getInputName(),
      );
      sql = dialect.as(sql, alias);
    } else {
      alias = this.nextSelectedName(col.__getInputName());
    }
    return new io.ColumnIO(col, sql, alias);
  }
}

export default function selectIO(
  action: dd.SelectAction,
  dialect: Dialect,
): io.SelectIO {
  const pro = new SelectProcessor(action, dialect);
  return pro.convert();
}
