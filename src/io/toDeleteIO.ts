import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as io from './io';

export class DeleteProcessor {
  constructor(
    public action: dd.DeleteAction,
    public dialect: Dialect,
  ) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): io.DeleteIO {
    let sql = 'DELETE ';
    const { action, dialect } = this;
    const table = action.table as dd.Table;

    // table
    const fromIO = this.handleFrom(table);
    sql += fromIO.sql;

    // where
    const whereIO = new io.SQLIO(action.whereSQL as dd.SQL);
    return new io.DeleteIO(action, sql, fromIO, whereIO);
  }

  private handleFrom(table: dd.Table): io.TableIO {
    const e = this.dialect.escape;
    const sql = `${e(table.__name)}`;
    return new io.TableIO(table, sql);
  }
}

export default function deleteIO(
  action: dd.UpdateAction,
  dialect: Dialect,
): io.DeleteIO {
  const pro = new DeleteProcessor(action, dialect);
  return pro.convert();
}
