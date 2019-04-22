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
    const table = action.__table as dd.Table;

    if (!action.whereSQL && !action.allowNoWhere) {
      throw new Error(
        `You have to call unsafeUpdateAll to build an action without a WHERE clause, action name: "${
          action.__name
        }"`,
      );
    }

    // setters
    const { setters } = action;
    if (!setters.size) {
      throw new Error(
        `The update action "${action}" does not have any setters`,
      );
    }

    // table
    const fromIO = this.handleFrom(table);
    sql += `${fromIO.sql} SET `;

    const setterIOs = io.SetterIO.fromMap(setters);
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
