import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from './dialect';
import { View } from './view';
import { JoinedColumn } from 'dd-models';
export { default as MySQL } from './dialects/mysql';

const MainAlias = '_main';

export class JoinIO {
  constructor(
    public path: string,
    public tableAlias: string,
    // Note that localTable can also be an alias of another join
    public localTable: string,
    public localColumn: dd.ColumnBase,
    public remoteTable: string,
    public remoteColumn: dd.ColumnBase,
  ) { }

  toSQL(dialect: Dialect): string {
    const e = dialect.escape;
    // Note that localTable is not used here, we use MainAlias as local table alias
    return `INNER JOIN ${e(this.remoteTable)} AS ${e(this.tableAlias)} ON ${e(this.tableAlias)}.${e(this.remoteColumn.__name)} = ${e(MainAlias)}.${e(this.localColumn.__name)}`;
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

  private handleJoin(jc: JoinedColumn): JoinIO {
    const result = this.jcMap.get(jc.path);
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

    const io = new JoinIO(
      jc.path,
      this.nextJoinedTableName(),
      localTableName,
      localColumn,
      remoteColumn.tableName,
      remoteColumn,
    );
    this.jcMap.set(jc.path, io);
    this.joins.push(io);
    return io;
  }

  private handleJoinedColumn(jc: dd.JoinedColumn): SelectedColumnIO {
    const io = this.handleJoin(jc);
    const e = this.dialect.escape;
    const sql = `${e(io.tableAlias)}.${e(jc.selectedColumn.__name)}`;
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
