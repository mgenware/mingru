import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { settersToVarList, SetterIO } from './setterIO';
import { SQLIO } from './sqlIO';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import VarInfo from '../lib/varInfo';

export const RowsAffectedKey = 'rows_affected';

export class UpdateIO extends ActionIO {
  constructor(
    public action: dd.UpdateAction,
    public sql: string,
    public setters: SetterIO[],
    public where: SQLIO | null,
    inputVarList: VarList, // inputVarList = WHERE.vars + setterVars, used as func parameters, WHERE vars take presedence
    public queryVarList: VarList, // queryVarList = setterVars + WHERE.vars, used as params when calling Exec, setter vars come first cuz SQL setters come before WHERE clause
    returnVarList: VarList,
    public setterVarList: VarList,
  ) {
    super(action, inputVarList, returnVarList);
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(setters, 'setters');
  }
}

class UpdateIOProcessor {
  constructor(public action: dd.UpdateAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): UpdateIO {
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
    const fromSQL = this.handleFrom(table);
    sql += `${fromSQL} SET `;

    const setterIOs = SetterIO.fromMap(setters);
    sql += setterIOs
      .map(s => `${dialect.escapeColumn(s.col)} = ${s.sql.toSQL(dialect)}`)
      .join(', ');

    // where
    const whereIO = action.whereSQL ? new SQLIO(action.whereSQL) : null;
    if (whereIO) {
      sql += ` WHERE ${whereIO.toSQL(dialect)}`;
    }

    // inputs
    const setterVars = settersToVarList(
      `SetterInputs of action "${action.__name}"`,
      setterIOs,
      dialect,
    );
    const inputVars = new VarList(`Inputs of action "${action.__name}"`);
    let whereVars: VarList | null = null;
    if (whereIO) {
      // If WHERE is present, inputVars = WHERE.inputs + setter inputs
      whereVars = VarList.fromSQLVars(
        `WHERE params of action "${action.__name}"`,
        whereIO.inputs,
        dialect,
      );
      inputVars.mergeWith(whereVars);
    }
    inputVars.mergeWith(setterVars);

    // returns
    const returnVars = new VarList(`Returns of action ${action.__name}`);
    returnVars.add(
      new VarInfo(RowsAffectedKey, dialect.convertColumnType(dd.int().type)),
    );

    // query vars (see UpdateIO.ctor for details)
    const queryVars = new VarList(`Query params of action "${action.__name}"`);
    queryVars.mergeWith(setterVars);
    if (whereVars) {
      queryVars.mergeWith(whereVars);
    }

    return new UpdateIO(
      action,
      sql,
      setterIOs,
      whereIO,
      inputVars,
      queryVars,
      returnVars,
      setterVars,
    );
  }

  private handleFrom(table: dd.Table): string {
    const e = this.dialect.escape;
    return `${e(table.getDBName())}`;
  }
}

export function updateIO(action: dd.UpdateAction, dialect: Dialect): UpdateIO {
  const pro = new UpdateIOProcessor(action, dialect);
  return pro.convert();
}
