import * as dd from '../../dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from './dialect';
import { View } from './view';
export { default as MySQL } from './dialects/mysql';

const MainAlias = '_main';

export class JoinIO {
  static fromColumn(localName: string, localCol: dd.ColumnBase, remoteName: string, remoteCol: dd.ColumnBase): JoinIO {
    return new JoinIO(
      localName,
      localCol,
      remoteName,
      remoteCol.tableName,
      remoteCol,
    );
  }

  constructor(
    public localAlias: string,
    public localColumn: dd.ColumnBase,
    public remoteAlias: string,
    public remoteColumn: dd.ColumnBase,
    public remoteTable: string,
  ) { }

  toSQL(dialect: Dialect): string {
    const e = dialect.escape;
    return `INNER JOIN ${e(this.remoteTable)} AS ${e(this.remoteAlias)} ON ${e(this.remoteAlias)}.${e(this.remoteColumn.__name)} = ${e(this.localAlias)}.${e(this.localColumn.__name)}`;
  }
}

export class SelectedColumnIO {
  constructor(
    public col: dd.ColumnBase,
    public sql: string,
  ) { }
}

export class SelectIO {
  constructor(
    public sql: string,
    public cols: SelectedColumnIO[],
    public fromSQL: string,
  ) { }
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
      const io = this.handleSelect(col, hasJoin);
      colIOs.push(io);
    }
    sql += colIOs.map(c => c.sql).join(', ');

    // from
    const fromSQL = this.handleFrom(from, hasJoin);
    sql += ' ' + fromSQL;

    // joins
    if (hasJoin) {
      for (const join of this.joins) {
        const joinSQL = join.toSQL(this.dialect);
        sql += ' ' + joinSQL;
      }
    }

    return new SelectIO(sql, colIOs, fromSQL);
  }

  private handleFrom(table: dd.Table, hasJoin: boolean): string {
    let sql = `FROM ${this.dialect.escape(table.__name)}`;
    if (hasJoin) {
      sql += ' AS ' + MainAlias;
    }
    return sql;
  }

  private handleSelect(col: dd.ColumnBase, hasJoin: boolean): SelectedColumnIO {
    if (col instanceof dd.JoinedColumn) {
      return this.handleJoinedColumn(col as dd.JoinedColumn);
    }
    return this.handleStandardColumn(col, hasJoin);
  }

  private handleJoin(local: dd.ColumnBase, remote: dd.ColumnBase): JoinIO {
    let id: string;
    if (local instanceof dd.JoinedColumn) {
      const io = this.handleJoin(local as dd.JoinedColumn, remote);
      id = `${io.localAlias}.${io.localColumn.__name}:${io.remoteAlias}.${io.remoteColumn.__name}`;
    } else {
      id = local.path + ':' + remote.path;
    }
    const result = this.jcMap.get(id);
    if (result) {
      return result;
    } else {
      const io = JoinIO.fromColumn(this.nextJoinedTableName(), local, remote);
      this.jcMap.set(id, io);
      this.joins.push(io);
      return io;
    }
  }

  private handleJoinedColumn(jc: dd.JoinedColumn): SelectedColumnIO {
    const io = this.handleJoin(jc.localColumn, jc.remoteColumn);
    const e = this.dialect.escape;
    const sql = `${e(io.tableName)}.${e(jc.targetColumn.__name)}`;
    return new SelectedColumnIO(jc, sql);
  }

  private nextJoinedTableName(): string {
    this.joinedTableCounter++;
    return `_join_${this.joinedTableCounter}`;
  }

  private handleStandardColumn(col: dd.ColumnBase, hasJoin: boolean): SelectedColumnIO {
    let sql = '';
    if (hasJoin) {
      sql = `${MainAlias}.`;
    }
    sql += this.dialect.escape(col.__name);
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

  convert(dialect: Dialect): SelectIO {
    const processor = new SelectProcessor(this, dialect);
    return processor.convert();
  }
}

export default Select;
