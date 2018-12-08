import * as dd from 'dd-models';
import Dialect from '../dialect';
import { throwIfFalsy } from 'throw-if-arg-empty';

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
  ) {}

  toSQL(dialect: Dialect): string {
    const e = dialect.escape;
    // Note that localTable is not used here, we use MainAlias as local table alias
    return `INNER JOIN ${e(this.remoteTable)} AS ${e(this.tableAlias)} ON ${e(
      this.tableAlias,
    )}.${e(this.remoteColumn.__name)} = ${e(MainAlias)}.${e(
      this.localColumn.__name,
    )}`;
  }
}

export class TableIO {
  constructor(public table: dd.Table, public sql: string) {
    throwIfFalsy(table, 'table');
    throwIfFalsy(sql, 'sql');
  }
}

export class ColumnIO {
  constructor(
    public col: dd.ColumnBase,
    public sql: string,
    public varName: string,
  ) {
    throwIfFalsy(col, 'col');
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(varName, 'varName');
  }
}

export class SQLIO {
  constructor(public sql: dd.SQL) {
    throwIfFalsy(sql, 'sql');
  }

  toSQL(dialect: Dialect): string {
    const { sql } = this;
    let res = '';
    for (const element of sql.elements) {
      if (typeof element === 'string') {
        res += element as string;
      } else {
        res += this.handleParam(element as dd.SQLParam, dialect);
      }
    }
    return res;
  }

  private handleParam(param: dd.SQLParam, dialect: Dialect): string {
    if (param instanceof dd.ColumnBase) {
      return dialect.escapeColumn(param as dd.ColumnBase);
    }
    if (param instanceof dd.InputParam) {
      return dialect.inputPlaceholder(param as dd.InputParam);
    }
    throw new Error(`Unsupported type of dd.SQLParam: ${param}`);
  }
}

export class SetterIO {
  static fromMap(map: Map<dd.ColumnBase, dd.SQL>): SetterIO[] {
    return Array.from(
      map,
      ([key, value]) => new SetterIO(key, new SQLIO(value)),
    );
  }

  constructor(public col: dd.ColumnBase, public sql: SQLIO) {
    throwIfFalsy(col, 'col');
    throwIfFalsy(sql, 'sql');
  }
}

export class SelectIO {
  constructor(
    public action: dd.SelectAction,
    public sql: string,
    public cols: ColumnIO[],
    public from: TableIO,
    public where: SQLIO | null,
  ) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(cols, 'cols');
    throwIfFalsy(from, 'from');
  }
}

export class UpdateIO {
  constructor(
    public action: dd.UpdateAction,
    public sql: string,
    public table: TableIO,
    public setters: SetterIO[],
    public where: SQLIO | null,
  ) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(table, 'table');
    throwIfFalsy(setters, 'setters');
  }
}

export class InsertIO {
  constructor(
    public action: dd.InsertAction,
    public sql: string,
    public table: TableIO,
    public setters: SetterIO[],
  ) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(table, 'table');
  }
}

export class DeleteIO {
  constructor(
    public action: dd.DeleteAction,
    public sql: string,
    public table: TableIO,
    public where: SQLIO | null,
  ) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(table, 'table');
  }
}
