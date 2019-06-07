import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { ActionIO } from './actionIO';
import { SQLIO } from './sqlIO';
import SQLVariableList from './sqlInputList';
import { rowsAffectedVarList } from './updateIO';

export class DeleteIO extends ActionIO {
  constructor(
    public action: dd.DeleteAction,
    public sql: string,
    public where: SQLIO | null,
  ) {
    super(action);
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
  }

  getInputs(): SQLVariableList {
    if (this.where) {
      return this.where.inputs;
    }
    return SQLVariableList.empty;
  }

  getReturns(): SQLVariableList {
    return rowsAffectedVarList;
  }
}

class DeleteIOProcessor {
  constructor(public action: dd.DeleteAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): DeleteIO {
    let sql = 'DELETE FROM ';
    const { action, dialect } = this;
    const table = action.__table as dd.Table;

    if (!action.whereSQL && !action.allowNoWhere) {
      throw new Error(
        `You have to call unsafeDeleteAll to build an action without a WHERE clause, action name: "${
          action.__name
        }"`,
      );
    }

    // table
    const fromSQL = this.handleFrom(table);
    sql += fromSQL;

    // where
    const whereIO = action.whereSQL ? new SQLIO(action.whereSQL) : null;
    if (whereIO) {
      sql += ` WHERE ${whereIO.toSQL(dialect)}`;
    }
    return new DeleteIO(action, sql, whereIO);
  }

  private handleFrom(table: dd.Table): string {
    const e = this.dialect.escape;
    return e(table.getDBName());
  }
}

export function deleteIO(action: dd.DeleteAction, dialect: Dialect): DeleteIO {
  const pro = new DeleteIOProcessor(action, dialect);
  return pro.convert();
}
