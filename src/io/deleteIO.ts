import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { ActionIO } from './actionIO';
import { SQLIO } from './sqlIO';
import VarList from '../lib/varList';
import { RowsAffectedKey } from 'dd-models';
import VarInfo from '../lib/varInfo';

export class DeleteIO extends ActionIO {
  constructor(
    public action: dd.DeleteAction,
    public sql: string,
    public where: SQLIO | null,
    inputVarList: VarList,
    returnVarList: VarList,
  ) {
    super(action, inputVarList, returnVarList);
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
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
    const whereIO = action.whereSQL
      ? SQLIO.fromSQL(action.whereSQL, dialect)
      : null;
    if (whereIO) {
      sql += ` WHERE ${whereIO.toSQL(dialect)}`;
    }

    // inputs
    const inputVarList = new VarList(`Inputs of action "${action.__name}"`);
    if (whereIO) {
      inputVarList.mergeWith(whereIO.varList);
    }

    // returns
    const returnVarList = new VarList(`Returns of action ${action.__name}`);
    if (!action.checkOnlyOneAffected) {
      returnVarList.add(
        new VarInfo(RowsAffectedKey, dialect.convertColumnType(dd.int().type)),
      );
    }

    return new DeleteIO(action, sql, whereIO, inputVarList, returnVarList);
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
