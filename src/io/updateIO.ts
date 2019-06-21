import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { settersToVarList, SetterIO } from './setterIO';
import { SQLIO } from './sqlIO';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import VarInfo from '../lib/varInfo';
import { registerHanlder } from './actionToIO';
import * as defs from '../defs';

export const RowsAffectedKey = 'rows_affected';

export class UpdateIO extends ActionIO {
  constructor(
    public action: dd.UpdateAction,
    public sql: string,
    public setters: SetterIO[],
    public where: SQLIO | null,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
    public setterArgs: VarList,
  ) {
    super(action, funcArgs, execArgs, returnValues);
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

    // Table
    const fromSQL = this.handleFrom(table);
    sql += `${fromSQL} SET `;

    // Setters
    const setterIOs = SetterIO.fromAction(action, dialect);
    sql += setterIOs
      .map(s => `${dialect.escapeColumn(s.col)} = ${s.sql.toSQL(dialect)}`)
      .join(', ');

    // WHERE
    const whereIO = action.whereSQL
      ? SQLIO.fromSQL(action.whereSQL, dialect)
      : null;
    if (whereIO) {
      sql += ` WHERE ${whereIO.toSQL(dialect)}`;
    }

    // funcArgs
    const setterVars = settersToVarList(
      `SetterInputs of action "${action.__name}"`,
      setterIOs,
    );
    const funcArgs = new VarList(
      `Func args of action "${action.__name}"`,
      true,
    );
    funcArgs.add(defs.dbxQueryableVar);
    const execArgs = new VarList(
      `Exec args of action "${action.__name}"`,
      true,
    );
    // funcArgs = WHERE(distinct) + setters
    // execArgs = setters + WHERE(all)
    execArgs.merge(setterVars.list);
    if (whereIO) {
      funcArgs.merge(whereIO.distinctVars);
      execArgs.merge(whereIO.vars);
    }
    funcArgs.merge(setterVars.list);

    // returns
    const returnValues = new VarList(`Returns of action ${action.__name}`);
    if (!action.checkOnlyOneAffected) {
      returnValues.add(
        new VarInfo(RowsAffectedKey, dialect.convertColumnType(dd.int().type)),
      );
    }

    return new UpdateIO(
      action,
      sql,
      setterIOs,
      whereIO,
      funcArgs,
      execArgs,
      returnValues,
      setterVars,
    );
  }

  private handleFrom(table: dd.Table): string {
    const e = this.dialect.escape;
    return `${e(table.getDBName())}`;
  }
}

export function updateIO(action: dd.Action, dialect: Dialect): UpdateIO {
  const pro = new UpdateIOProcessor(action as dd.UpdateAction, dialect);
  return pro.convert();
}

registerHanlder(dd.ActionType.update, updateIO);
