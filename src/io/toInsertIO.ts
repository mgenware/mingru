import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as io from './io';

export class InsertProcessor {
  constructor(
    public action: dd.InsertAction,
    public dialect: Dialect,
  ) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): io.InsertIO {
    let sql = 'INSERT INTO ';
    const { action, dialect } = this;
    const table = action.table as dd.Table;

    // table
    const tableIO = this.handleFrom(table);
    sql += tableIO.sql;

    // columns
    const colNames = action.columns.map(c => dialect.escape(c.__name));
    sql += ` (${colNames.join(', ')})`;

    // values
    const colValues = action.columns.map(_ => dialect.inputPlaceholder(null));
    sql += ` VALUES (${colValues.join(', ')})`;

    return new io.InsertIO(action, sql, tableIO);
  }

  private handleFrom(table: dd.Table): io.TableIO {
    const e = this.dialect.escape;
    const sql = `${e(table.__name)}`;
    return new io.TableIO(table, sql);
  }
}

export default function insertIO(
  action: dd.InsertAction,
  dialect: Dialect,
): io.InsertIO {
  const pro = new InsertProcessor(action, dialect);
  return pro.convert();
}
