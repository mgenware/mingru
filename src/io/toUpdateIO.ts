import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as io from './io';

export class UpdateProcessor {
  constructor(public action: dd.UpdateAction, public dialect: Dialect) {
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
    sql += ' SET ';

    const { columnValueMap } = action;
    if (!columnValueMap.size) {
      throw new Error(
        `The update action "${action}" does not have any setters`,
      );
    }
    const setterIOs = io.SetterIO.fromMap(columnValueMap);
    sql += setterIOs
      .map(s => `${dialect.escapeColumn(s.col)} = ${s.sql.toSQL(dialect)}`)
      .join(', ');

    // where
    const whereIO = action.whereSQL ? new io.SQLIO(action.whereSQL) : null;
    if (whereIO) {
      sql += ` WHERE ${whereIO.toSQL(dialect)}`;
    }
    return new io.UpdateIO(action, sql, fromIO, setterIOs, whereIO);
  }

  private handleFrom(table: dd.Table): io.TableIO {
    const e = this.dialect.escape;
    const sql = `${e(table.__name)}`;
    return new io.TableIO(table, sql);
  }
}

export default function updateIO(
  action: dd.UpdateAction,
  dialect: Dialect,
): io.UpdateIO {
  const pro = new UpdateProcessor(action, dialect);
  return pro.convert();
}
