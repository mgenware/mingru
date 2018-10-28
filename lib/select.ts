import * as dd from '../../dd-models';
import is from '@sindresorhus/is';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from './dialect';
import { View, ViewIO } from './view';

const MainAlias = '_main';

export class JoinIO {
  static fromColumn(lCol: dd.ColumnBase, rCol: dd.ColumnBase, table: string): JoinIO {
    return new JoinIO(
      lCol.tableName,
      lCol,
      rCol.tableName,
      rCol,
      table,
    );
  }

  constructor(
    public lTable: string,
    public lColumn: dd.ColumnBase,
    public rTable: string,
    public rColumn: dd.ColumnBase,
    public table: string, // table alias of this join
  ) { }
}

export class SelectedColumnIO {
  constructor(
    public col: dd.ColumnBase,
    public sql: string,
  ) { }
}

export class SelectIO extends ViewIO {
  constructor(
    sql: string,
    cols: SelectedColumnIO[],
    fromSQL: string,
  ) {
    super(sql, dialect);
  }
}

class SelectProcessor {
  jcMap = new Map<string, JoinIO>();
  joins: JoinIO[] = [];
  joinedTableCounter = 0;

  constructor(
    public select: Select,
    public dialect: Dialect,
  ) { }

  convert(): SelectIO {
    let sql = '';
    const { columns, from } = this.select;
    throwIfFalsy(columns, 'columns');
    throwIfFalsy(from, 'from');

    sql += 'SELECT ';
    const hasJoin = columns.some(c => c instanceof dd.JoinedColumn);

    // Process columns
    const colIOs: SelectedColumnIO[] = [];
    for (const col of columns) {
      const io = this.processSelect(col, hasJoin);
      colIOs.push(io);
    }
    sql += colIOs.map(c => c.sql).join(', ');

    // from
    sql += this.processFrom(from, hasJoin);

    return new SelectIO(sql);
  }

  private processFrom(table: dd.Table, hasJoin: boolean): string {
    let sql = this.dialect.escapeName(table.__name);
    if (hasJoin) {
      sql += 'AS ' + MainAlias;
    }
    return sql;
  }

  private processSelect(col: dd.ColumnBase, hasJoin: boolean): SelectedColumnIO {
    if (col instanceof dd.JoinedColumn) {
      return this.processJoinedColumn(col as dd.JoinedColumn);
    }
    return this.processStandardColumn(col, hasJoin);
  }

  private processJoinedColumnInternal(local: dd.ColumnBase, remote: dd.ColumnBase): JoinIO {
    let id: string;
    if (local.isJoinedColumn) {
      const io = this.processJoinedColumnInternal(local as dd.JoinedColumn, remote);
      id = `${io.table}.${io.rColumn.__name}:${remote.path}`;
    } else {
      id = local.path + ':' + remote.path;
    }
    const result = this.jcMap.get(id);
    if (result) {
      return result;
    } else {
      return JoinIO.fromColumn(local, remote, this.nextJoinedTableName());
    }
  }

  private processJoinedColumn(jc: dd.JoinedColumn): SelectedColumnIO {
    const io = this.processJoinedColumnInternal(jc.localCol, jc.remoteCol);
    const { dialect } = this;
    const sql = `${dialect.escapeName(io.table)}.${dialect.escapeName(io.rColumn.__name)}`;
    return new SelectedColumnIO(jc, sql);
  }

  private nextJoinedTableName(): string {
    this.joinedTableCounter++;
    return `_join_${this.joinedTableCounter}`;
  }

  private processStandardColumn(col: dd.ColumnBase, hasJoin: boolean): SelectedColumnIO {
    let sql = '';
    if (hasJoin) {
      sql = `${MainAlias}.`;
    }
    sql += this.dialect.escapeName(col.__name);
    return new SelectedColumnIO(col, sql);
  }
}

export class Select extends View {
  constructor(
    public name: string,
    public columns: dd.ColumnBase[],
    public from: dd.Table,
  ) {
    super(name);
  }
}

export default Select;
