import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as cm from './common';

export class UpdateIO {
  constructor(
    public sql: string,
    public table: cm.TableIO,
    public setters: cm.SetterIO[],
    public where: cm.SQLIO,
  ) { }
}

export class UpdateProcessor {
  constructor(
    public action: dd.UpdateAction,
    public dialect: Dialect,
  ) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): UpdateIO {
    let sql = 'UPDATE ';
    const { action, dialect } = this;
    const table = action.table as dd.Table;

    // table
    const fromIO = this.handleFrom(table);
    sql += fromIO.sql;

    // setters
    const setters: cm.SetterIO[] = [];
    for (const setter of action.setters) {
      const io = cm.SetterIO.fromSetter(setter);
      setters.push(io);

      sql += ` SET ${dialect.escapeColumn(io.col)} = ${io.rawSQL.toSQL(dialect)}`;
    }

    // where
    const whereIO = new cm.SQLIO(action.whereSQL as dd.SQL);

    return new UpdateIO(sql, fromIO, setters, whereIO);
  }

  private handleFrom(table: dd.Table): cm.TableIO {
    const e = this.dialect.escape;
    const sql = `${e(table.__name)}`;
    return new cm.TableIO(table, sql);
  }
}

export default function update(
  action: dd.UpdateAction,
  dialect: Dialect,
): UpdateIO {
  const pro = new UpdateProcessor(action, dialect);
  return pro.convert();
}
