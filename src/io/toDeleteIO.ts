import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as io from './io';

export class DeleteProcessor {
  constructor(public action: dd.DeleteAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): io.DeleteIO {
    let sql = 'DELETE FROM ';
    const { action, dialect } = this;
    const table = action.table as dd.Table;

    if (!action.whereSQL && !action.deleteAll) {
      throw new Error(
        `You have to call deleteAll to build an action without a WHERE clause, action name: "${
          action.name
        }"`,
      );
    }

    // table
    const fromIO = this.handleFrom(table);
    sql += fromIO.sql;

    // where
    const whereIO = action.whereSQL ? new io.SQLIO(action.whereSQL) : null;
    if (whereIO) {
      sql += ` WHERE ${whereIO.toSQL(dialect)}`;
    }
    return new io.DeleteIO(action, sql, fromIO, whereIO);
  }

  private handleFrom(table: dd.Table): io.TableIO {
    const e = this.dialect.escape;
    const sql = `${e(table.__name)}`;
    return new io.TableIO(table, sql);
  }
}

export default function deleteIO(
  action: dd.DeleteAction,
  dialect: Dialect,
): io.DeleteIO {
  const pro = new DeleteProcessor(action, dialect);
  return pro.convert();
}
