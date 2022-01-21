import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Dialect, StringSegment } from '../dialect.js';
import { ActionIO } from './actionIO.js';
import { SQLIO, sqlIO } from './sqlIO.js';
import VarList from '../lib/varList.js';
import { VarInfo } from '../lib/varInfo.js';
import { registerHandler } from './actionToIO.js';
import * as defs from '../def/defs.js';
import BaseIOProcessor from './baseIOProcessor.js';
import { ActionToIOOptions } from './actionToIOOptions.js';
import { handleNonSelectSQLFrom } from '../lib/sqlHelper.js';

export class DeleteIO extends ActionIO {
  constructor(
    dialect: Dialect,
    public deleteAction: mm.DeleteAction,
    sql: StringSegment[],
    public where: SQLIO | null,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
  ) {
    super(dialect, deleteAction, sql, funcArgs, execArgs, returnValues);
    throwIfFalsy(deleteAction, 'deleteAction');
    throwIfFalsy(sql, 'sql');
  }
}

class DeleteIOProcessor extends BaseIOProcessor {
  constructor(public action: mm.DeleteAction, opt: ActionToIOOptions) {
    super(action, opt);
  }

  convert(): DeleteIO {
    const sql: StringSegment[] = ['DELETE FROM '];
    const { action, opt } = this;
    const { dialect } = opt;
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
      ? sqlIO(actionData.whereSQLValue, dialect, sqlTable)
      : null;
    if (whereIO) {
      sql.push(' WHERE ');
      sql.push(...whereIO.code);
    }

    // Inputs
    const funcArgs = new VarList(`Func args of action "${action}"`, true);
    funcArgs.add(defs.dbxQueryableVar);
    if (this.configurableTable()) {
      funcArgs.add(defs.fromTableVarInfo);
    }
    const execArgs = new VarList(`Exec args of action "${action}"`, true);
    if (whereIO) {
      funcArgs.merge(whereIO.distinctVars);
      execArgs.merge(whereIO.vars);
    }

    // Return values.
    const returnValues = new VarList(`Return values of action ${action}`, false);
    if (!actionData.ensureOneRowAffected) {
      returnValues.add(
        new VarInfo(mm.ReturnValues.rowsAffected, dialect.colTypeToGoType(mm.int().__type())),
      );
    }

    return new DeleteIO(dialect, action, sql, whereIO, funcArgs, execArgs, returnValues);
  }
}

export function deleteIO(action: mm.Action, opt: ActionToIOOptions): DeleteIO {
  const pro = new DeleteIOProcessor(action as mm.DeleteAction, opt);
  return pro.convert();
}

registerHandler(mm.ActionType.delete, deleteIO);
