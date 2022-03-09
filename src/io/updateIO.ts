import * as mm from 'mingru-models';
import { Dialect, StringSegment } from '../dialect.js';
import { settersToVarList, SetterIO } from './setterIO.js';
import { SQLIO, sqlIO } from './sqlIO.js';
import { ActionIO } from './actionIO.js';
import VarList from '../lib/varList.js';
import { VarInfo } from '../lib/varInfo.js';
import { registerHandler } from './actionToIO.js';
import * as defs from '../def/defs.js';
import * as utils from '../lib/stringUtils.js';
import { forEachWithSlots, throwOnEmptyArray } from '../lib/arrayUtils.js';
import BaseIOProcessor from './baseIOProcessor.js';
import { ActionToIOOptions } from './actionToIOOptions.js';
import { handleNonSelectSQLFrom } from '../lib/sqlHelper.js';

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
    super(dialect, updateAction, sql, funcArgs, execArgs, returnValues, false);
    throwOnEmptyArray(setters, 'setters');
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
    const actionData = action.__getData();
    const sqlTable = this.mustGetAvailableSQLTable();

    if (!actionData.whereSQLValue && !actionData.unsafeMode) {
      throw new Error(
        'You have to call `unsafeUpdateAll` to build an action without a WHERE clause',
      );
    }

    // FROM
    const fromSQL = handleNonSelectSQLFrom(this, sqlTable);
    sql.push(...fromSQL);
    sql.push(' SET ');

    // Setters
    if (actionData.setters) {
      utils.validateSetters(actionData.setters, sqlTable);
    }
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
    const whereIO = actionData.whereSQLValue
      ? sqlIO(actionData.whereSQLValue, dialect, sqlTable)
      : null;
    if (whereIO) {
      sql.push(' WHERE ');
      sql.push(...whereIO.code);
    }

    // funcArgs
    const setterVars = settersToVarList(`SetterInputs of action "${action}"`, setterIOs);
    const funcArgs = new VarList(`Func args of action "${action}"`, true);
    if (this.configurableTableName) {
      funcArgs.add(defs.cfTableVarInfo(this.configurableTableName));
    }

    const execArgs = new VarList(`Exec args of action "${action}"`, true);
    // funcArgs = WHERE(distinct) + setters
    // execArgs = setters + WHERE(all)
    execArgs.merge(setterVars.list);
    if (whereIO) {
      funcArgs.merge(whereIO.distinctVars);
      execArgs.merge(whereIO.vars);
    }
    funcArgs.merge(setterVars.list);

    // Return values
    const returnValues = new VarList(`Return values of action "${action}"`);
    if (!actionData.ensureOneRowAffected) {
      returnValues.add(
        new VarInfo(mm.ReturnValues.rowsAffected, dialect.colTypeToGoType(mm.int().__type())),
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
