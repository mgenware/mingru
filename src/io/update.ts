import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as io from './io';

export class UpdateProcessor {
  constructor(
    public action: dd.UpdateAction,
    public dialect: Dialect,
  ) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): io.UpdateIO {
    let sql = 'UPDATE ';
    const { action, dialect } = this;
    const table = action.table as dd.Table;

    // table
    const fromIO = this.handleFrom(table);
    sql += fromIO.sql;

    // setters
    const setters: io.SetterIO[] = [];
    for (const setter of action.setters) {
      const setterIO = io.SetterIO.fromSetter(setter);
      setters.push(setterIO);

      sql += ` SET ${dialect.escapeColumn(setterIO.col)} = ${setterIO.sql.toSQL(dialect)}`;
    }

    // where
    const whereIO = new io.SQLIO(action.whereSQL as dd.SQL);
    return new io.UpdateIO(action, sql, fromIO, setters, whereIO);
  }

  private handleFrom(table: dd.Table): io.TableIO {
    const e = this.dialect.escape;
    const sql = `${e(table.__name)}`;
    return new io.TableIO(table, sql);
  }
}

export default function update(
  action: dd.UpdateAction,
  dialect: Dialect,
): io.UpdateIO {
  const pro = new UpdateProcessor(action, dialect);
  return pro.convert();
}
