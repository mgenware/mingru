import * as dd from 'dd-models';
import Dialect from '../dialect';

export const MainAlias = '_main';

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

export class ColumnIO {
  constructor(
    public col: dd.ColumnBase,
    public sql: string,
  ) { }
}

export class RawSQLIO {
  constructor(
    public rawSQL: dd.RawSQL,
  ) { }
}

export class SetterIO {
  constructor(
    public col: dd.ColumnBase,
    public rawSQL: RawSQLIO,
  ) { }
}
