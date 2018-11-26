import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as cm from './common';

export class SelectIO {
  constructor(
    public action: dd.SelectAction,
    public sql: string,
    public cols: cm.ColumnIO[],
    public from: cm.TableIO,
    public where: cm.SQLIO | null,
  ) {}
}

export class SelectProcessor {
  jcMap = new Map<string, cm.JoinIO>();
  joins: cm.JoinIO[] = [];
  // This makes sure all join table alias names are unique
  joinedTableCounter = 0;
  // This makes sure all selected column names are unique
  joinedColumnNameMap: { [k: string]: number } = {};

  constructor(public action: dd.SelectAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): SelectIO {
    let sql = 'SELECT ';
    const { action } = this;
    const { columns, table: from } = action;
    const hasJoin = columns.some(c => c instanceof dd.JoinedColumn);

    // Process columns
    const colIOs: cm.ColumnIO[] = [];
    for (const col of columns) {
      const io = this.handleSelect(col, hasJoin);
      colIOs.push(io);
    }
    sql += colIOs.map(c => c.sql).join(', ');

    // from
    const fromIO = this.handleFrom(from as dd.Table, hasJoin);
    sql += ' ' + fromIO.sql;

    // where
    let whereIO: cm.SQLIO | null = null;
    if (action.whereSQL) {
      whereIO = new cm.SQLIO(action.whereSQL);
      sql += ' WHERE ' + whereIO.toSQL(this.dialect);
    }

    // joins
    if (hasJoin) {
      for (const join of this.joins) {
        const joinSQL = join.toSQL(this.dialect);
        sql += ' ' + joinSQL;
      }
    }
    return new SelectIO(this.action, sql, colIOs, fromIO, whereIO);
  }

  private handleFrom(table: dd.Table, hasJoin: boolean): cm.TableIO {
    const e = this.dialect.escape;
    let sql = `FROM ${e(table.__name)}`;
    if (hasJoin) {
      sql += ' AS ' + e(cm.MainAlias);
    }
    return new cm.TableIO(table, sql);
  }

  private handleSelect(col: dd.ColumnBase, hasJoin: boolean): cm.ColumnIO {
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

  private handleJoin(jc: dd.JoinedColumn): cm.JoinIO {
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

    const io = new cm.JoinIO(
      jc.joinPath,
      this.nextJoinedTableName(),
      localTableName,
      localColumn,
      remoteColumn.tableName,
      remoteColumn,
    );
    this.jcMap.set(jc.joinPath, io);
    this.joins.push(io);
    return io;
  }

  private handleJoinedColumn(
    jc: dd.JoinedColumn,
    presetAlias: string | null,
  ): cm.ColumnIO {
    const io = this.handleJoin(jc);
    const { dialect } = this;
    const e = dialect.escape;
    const sql = `${e(io.tableAlias)}.${e(jc.selectedColumn.__name)}`;
    const alias = presetAlias
      ? presetAlias
      : this.nextSelectedName(jc.__getInputName());
    return new cm.ColumnIO(jc, jc.__name, dialect.as(sql, alias));
  }

  private nextJoinedTableName(): string {
    this.joinedTableCounter++;
    return `_join_${this.joinedTableCounter}`;
  }

  private nextSelectedName(name: string): string {
    const { joinedColumnNameMap } = this;
    if (!joinedColumnNameMap[name]) {
      joinedColumnNameMap[name] = 1;
    } else {
      name += joinedColumnNameMap[name];
      joinedColumnNameMap[name]++;
    }
    return name;
  }

  private handleStandardColumn(
    col: dd.ColumnBase,
    hasJoin: boolean,
    presetAlias: string | null,
  ): cm.ColumnIO {
    const { dialect } = this;
    const e = dialect.escape;
    let sql = '';
    if (hasJoin) {
      sql = `${e(cm.MainAlias)}.`;
    }
    sql += e(col.__name);
    if (presetAlias || hasJoin) {
      const alias = presetAlias
        ? presetAlias
        : col.__getInputName();
      sql = dialect.as(sql, this.nextSelectedName(alias));
    }
    return new cm.ColumnIO(col, col.__name, sql);
  }
}

export default function select(
  action: dd.SelectAction,
  dialect: Dialect,
): SelectIO {
  const pro = new SelectProcessor(action, dialect);
  return pro.convert();
}
