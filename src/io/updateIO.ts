import * as mm from 'mingru-models';
import { StringSegment } from '../dialect.js';
import { settersToParamList, SetterIO } from './setterIO.js';
import { SQLIO, sqlIO } from './sqlIO.js';
import { ActionIO } from './actionIO.js';
import { ParamList, ValueList } from '../lib/varList.js';
import { registerHandler } from './actionToIO.js';
import * as defs from '../def/defs.js';
import * as utils from '../lib/stringUtils.js';
import { forEachWithSlots, throwOnEmptyArray } from '../lib/arrayUtils.js';
import BaseIOProcessor from './baseIOProcessor.js';
import { ActionToIOOptions } from './actionToIOOptions.js';
import { handleNonSelectSQLFrom } from '../lib/sqlHelper.js';
import ctx from '../ctx.js';

export class UpdateIO extends ActionIO {
  constructor(
    public updateAction: mm.UpdateAction,
    sql: StringSegment[],
    public setters: SetterIO[],
    public where: SQLIO | null,
    funcArgs: ParamList,
    execArgs: ValueList,
    returnValues: ParamList,
    public setterArgs: ParamList,
  ) {
    super(updateAction, sql, funcArgs, execArgs, returnValues, false);
    throwOnEmptyArray(setters, 'setters');
  }
}

class UpdateIOProcessor extends BaseIOProcessor<mm.UpdateAction> {
  convert(): UpdateIO {
    const sql: StringSegment[] = ['UPDATE '];
    const { action } = this;
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
      utils.validateSetters(actionData.setters, sqlTable, `[Validating setters of ${action}]`);
    }
    const setterIOs = SetterIO.fromAction(
      action,
      true,
      sqlTable,
      `[Building setters of ${action}]`,
    );

    forEachWithSlots(
      setterIOs,
      (setter) => {
        sql.push(`${ctx.dialect.encodeColumnName(setter.col)} = `);
        sql.push(...setter.sql.code);
      },
      () => sql.push(', '),
    );

    // WHERE
    const whereIO = actionData.whereSQLValue
      ? sqlIO(actionData.whereSQLValue, sqlTable, `[Building WHERE of ${action}]`)
      : null;
    if (whereIO) {
      sql.push(' WHERE ');
      sql.push(...whereIO.code);
    }

    // funcArgs
    const setterVars = settersToParamList(`SetterInputs of action "${action}"`, setterIOs);
    const funcArgs = new ParamList(`Func args of action "${action}"`);
    if (this.configurableTableName) {
      funcArgs.add(defs.cfTableVarDef(this.configurableTableName));
    }

    const execArgs = new ValueList(`Exec args of action "${action}"`);
    // For func args, WHERE is scanned first, so that ID columns (usually contained in WHERE)
    // come first.
    if (whereIO) {
      funcArgs.merge(whereIO.vars.list);
    }
    execArgs.mergeVarDefs(setterVars.list);
    funcArgs.merge(setterVars.list);
    if (whereIO) {
      execArgs.mergeVarDefs(whereIO.vars.list);
    }

    // Return values
    const returnValues = new ParamList(`Return values of action "${action}"`);
    if (!actionData.ensureOneRowAffected) {
      returnValues.add({
        name: mm.ReturnValues.rowsAffected,
        type: ctx.dialect.colTypeToGoType(mm.int().__type()),
      });
    }

    return new UpdateIO(
      action,
      sql,
      setterIOs,
      whereIO,
      this.hoiseTableParams(funcArgs),
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
