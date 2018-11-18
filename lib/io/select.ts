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
    public where: cm.SQLIO|null,
  ) { }
}

export class SelectProcessor {
  jcMap = new Map<string, cm.JoinIO>();
  joins: cm.JoinIO[] = [];
  joinedTableCounter = 0;

  constructor(
    public action: dd.SelectAction,
    public dialect: Dialect,
  ) {
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

    // joins
    if (hasJoin) {
      for (const join of this.joins) {
        const joinSQL = join.toSQL(this.dialect);
        sql += ' ' + joinSQL;
      }
    }

    // where
    const whereIO = action.whereSQL ? new cm.SQLIO(action.whereSQL) : null;
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
    if (col instanceof dd.JoinedColumn) {
      return this.handleJoinedColumn(col as dd.JoinedColumn);
    }
    return this.handleStandardColumn(col, hasJoin);
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

  private handleJoinedColumn(jc: dd.JoinedColumn): cm.ColumnIO {
    const io = this.handleJoin(jc);
    const e = this.dialect.escape;
    const sql = `${e(io.tableAlias)}.${e(jc.selectedColumn.__name)}`;
    // TODO: alias support
    return new cm.ColumnIO(jc, jc.__name, sql);
  }

  private nextJoinedTableName(): string {
    this.joinedTableCounter++;
    return `_join_${this.joinedTableCounter}`;
  }

  private handleStandardColumn(col: dd.ColumnBase, hasJoin: boolean): cm.ColumnIO {
    const e = this.dialect.escape;
    let sql = '';
    if (hasJoin) {
      sql = `${e(cm.MainAlias)}.`;
    }
    sql += e(col.__name);
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
