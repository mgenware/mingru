import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect, { StringSegment } from '../dialect';
import { settersToVarList, SetterIO } from './setterIO';
import { SQLIO, sqlIO } from './sqlIO';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import VarInfo from '../lib/varInfo';
import { registerHandler } from './actionToIO';
import * as defs from '../defs';
import * as utils from '../lib/stringUtils';
import { forEachWithSlots } from '../lib/arrayUtils';
import BaseIOProcessor from './baseIOProcessor';
import { ActionToIOOptions } from './actionToIOOptions';
import { handleNonSelectSQLFrom } from '../lib/sqlHelper';

export class UpdateIO extends ActionIO {
  constructor(
    dialect: Dialect,
    public updateAction: mm.UpdateAction,
    sql: StringSegment[],
    public setters: SetterIO[],
    public where: SQLIO | null,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
    public setterArgs: VarList,
  ) {
    super(dialect, updateAction, sql, funcArgs, execArgs, returnValues);
    throwIfFalsy(updateAction, 'updateAction');
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(setters, 'setters');
  }
}

class UpdateIOProcessor extends BaseIOProcessor {
  constructor(public action: mm.UpdateAction, opt: ActionToIOOptions) {
    super(action, opt);
  }

  convert(): UpdateIO {
    const sql: StringSegment[] = ['UPDATE '];
    const { action, opt } = this;
    const { dialect } = opt;
    const sqlTable = this.mustGetAvailableSQLTable();

    if (!action.whereSQL && !action.allowEmptyWhere) {
      throw new Error(
        'You have to call `unsafeUpdateAll` to build an action without a WHERE clause',
      );
    }

    // FROM
    const fromSQL = handleNonSelectSQLFrom(this, sqlTable);
    sql.push(...fromSQL);
    sql.push(' SET ');

    // Setters
    utils.validateSetters(action.setters, sqlTable);
    const setterIOs = SetterIO.fromAction(action, dialect, true, sqlTable);

    forEachWithSlots(
      setterIOs,
      (setter) => {
        sql.push(`${dialect.encodeColumnName(setter.col)} = `);
        sql.push(...setter.sql.code);
      },
      () => sql.push(', '),
    );

    // WHERE
    const whereIO = action.whereSQLValue ? sqlIO(action.whereSQLValue, dialect, sqlTable) : null;
    if (whereIO) {
      sql.push(' WHERE ');
      sql.push(...whereIO.code);
    }

    // funcArgs
    const setterVars = settersToVarList(`SetterInputs of action "${action.__name}"`, setterIOs);
    const funcArgs = new VarList(`Func args of action "${action.__name}"`, true);
    funcArgs.add(defs.dbxQueryableVar);
    if (this.isFromTableInput()) {
      funcArgs.add(defs.tableInputVar);
    }

    const execArgs = new VarList(`Exec args of action "${action.__name}"`, true);
    // funcArgs = WHERE(distinct) + setters
    // execArgs = setters + WHERE(all)
    execArgs.merge(setterVars.list);
    if (whereIO) {
      funcArgs.merge(whereIO.distinctVars);
      execArgs.merge(whereIO.vars);
    }
    funcArgs.merge(setterVars.list);

    // Return values
    const returnValues = new VarList(`Return values of action ${action.__name}`);
    if (!action.ensureOneRowAffected) {
      returnValues.add(
        new VarInfo(mm.ReturnValues.rowsAffected, dialect.colTypeToGoType(mm.int().__type)),
      );
    }

    return new UpdateIO(
      dialect,
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
}

export function updateIO(action: mm.Action, opt: ActionToIOOptions): UpdateIO {
  const pro = new UpdateIOProcessor(action as mm.UpdateAction, opt);
  return pro.convert();
}

registerHandler(mm.ActionType.update, updateIO);
