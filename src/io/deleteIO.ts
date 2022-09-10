import * as mm from 'mingru-models';
import { StringSegment } from '../dialect.js';
import { ActionIO } from './actionIO.js';
import { SQLIO, sqlIO } from './sqlIO.js';
import { ParamList, ValueList } from '../lib/varList.js';
import { registerHandler } from './actionToIO.js';
import * as defs from '../def/defs.js';
import BaseIOProcessor from './baseIOProcessor.js';
import { ActionToIOOptions } from './actionToIOOptions.js';
import { handleNonSelectSQLFrom } from '../lib/sqlHelper.js';
import ctx from '../ctx.js';

export class DeleteIO extends ActionIO {
  constructor(
    public deleteAction: mm.DeleteAction,
    sql: StringSegment[],
    public where: SQLIO | null,
    funcArgs: ParamList,
    execArgs: ValueList,
    returnValues: ParamList,
  ) {
    super(deleteAction, sql, funcArgs, execArgs, returnValues, false);
  }
}

class DeleteIOProcessor extends BaseIOProcessor<mm.DeleteAction> {
  convert(): DeleteIO {
    const sql: StringSegment[] = ['DELETE FROM '];
    const { action } = this;
    const sqlTable = this.mustGetAvailableSQLTable();
    const actionData = action.__getData();

    if (!actionData.whereSQLValue && !actionData.unsafeMode) {
      throw new Error(
        `You have to call \`unsafeDeleteAll\` to build an action without a WHERE clause, action "${action}"`,
      );
    }

    // FROM
    const fromSQL = handleNonSelectSQLFrom(this, sqlTable);
    sql.push(...fromSQL);

    // WHERE
    const whereIO = actionData.whereSQLValue
      ? sqlIO(actionData.whereSQLValue, sqlTable, `[Building WHERE of ${action}]`)
      : null;
    if (whereIO) {
      sql.push(' WHERE ');
      sql.push(...whereIO.code);
    }

    // Inputs
    const funcArgs = new ParamList(`Func args of action "${action}"`);
    if (this.configurableTableName) {
      funcArgs.add(defs.cfTableVarDef(this.configurableTableName));
    }
    const execArgs = new ValueList(`Exec args of action "${action}"`);
    if (whereIO) {
      funcArgs.merge(whereIO.vars.list);
      execArgs.mergeVarDefs(whereIO.vars.list);
    }

    // Return values.
    const returnValues = new ParamList(`Return values of action ${action}`);
    if (!actionData.ensureOneRowAffected) {
      returnValues.add({
        name: mm.ReturnValueSrc.rowsAffected,
        type: ctx.dialect.colTypeToGoType(mm.int().__type()),
      });
    }

    return new DeleteIO(
      action,
      sql,
      whereIO,
      this.hoiseTableParams(funcArgs),
      execArgs,
      returnValues,
    );
  }
}

export function deleteIO(action: mm.Action, opt: ActionToIOOptions): DeleteIO {
  const pro = new DeleteIOProcessor(action as mm.DeleteAction, opt);
  return pro.convert();
}

registerHandler(mm.ActionType.delete, deleteIO);
