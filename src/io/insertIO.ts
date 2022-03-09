import * as mm from 'mingru-models';
import { Dialect, StringSegment } from '../dialect.js';
import { settersToVarList, SetterIO } from './setterIO.js';
import { ActionIO } from './actionIO.js';
import VarList from '../lib/varList.js';
import { registerHandler } from './actionToIO.js';
import * as defs from '../def/defs.js';
import * as utils from '../lib/stringUtils.js';
import { VarInfo } from '../lib/varInfo.js';
import { forEachWithSlots } from '../lib/arrayUtils.js';
import { ActionToIOOptions } from './actionToIOOptions.js';
import BaseIOProcessor from './baseIOProcessor.js';
import { handleNonSelectSQLFrom } from '../lib/sqlHelper.js';

export class InsertIO extends ActionIO {
  returnMember: ActionIO | undefined;

  constructor(
    dialect: Dialect,
    public insertAction: mm.InsertAction,
    sql: StringSegment[],
    public setters: SetterIO[],
    public fetchInsertedID: boolean,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
  ) {
    super(dialect, insertAction, sql, funcArgs, execArgs, returnValues, false);
  }
}

export class InsertIOProcessor extends BaseIOProcessor {
  constructor(public action: mm.InsertAction, opt: ActionToIOOptions) {
    super(action, opt);
  }

  convert(): InsertIO {
    const sql: StringSegment[] = ['INSERT INTO '];
    const { action, opt } = this;
    const { dialect } = opt;
    const actionData = action.__getData();
    const sqlTable = this.mustGetAvailableSQLTable();
    const fetchInsertedID = actionData.ensureOneRowAffected && !!sqlTable.__getData().aiPKs.length;

    // Table
    const tableSQL = handleNonSelectSQLFrom(this, sqlTable);
    sql.push(...tableSQL);

    // Setters
    if (actionData.setters) {
      utils.validateSetters(actionData.setters, sqlTable);
    }
    const setterIOs = SetterIO.fromAction(
      action,
      dialect,
      !!actionData.allowUnsetColumns,
      sqlTable,
    );
    const colNames = setterIOs.map((s) => dialect.encodeColumnName(s.col));
    sql.push(` (${colNames.join(', ')})`);

    // Values
    sql.push(' VALUES (');

    forEachWithSlots(
      setterIOs,
      (setter) => {
        sql.push(...setter.sql.code);
      },
      () => sql.push(', '),
    );

    // Push the ending ) for VALUES.
    sql.push(')');

    // funcArgs
    const precedingElements: VarInfo[] = [];
    if (this.configurableTableName) {
      precedingElements.push(defs.cfTableVarInfo(this.configurableTableName));
    }
    const funcArgs = settersToVarList(
      `Func args of action ${action}`,
      setterIOs,
      precedingElements,
    );

    const execArgs = new VarList(`Exec args of action ${action}`);
    // Skip the first param if `configurableTable` is true.
    execArgs.merge(this.configurableTableName ? funcArgs.list.slice(1) : funcArgs.list);

    // Return values.
    const returnValue = new VarList(`Return values of action ${action}`);
    if (fetchInsertedID) {
      returnValue.add(defs.insertedIDVar);
    }

    return new InsertIO(
      dialect,
      action,
      sql,
      setterIOs,
      !!fetchInsertedID,
      funcArgs,
      execArgs,
      returnValue,
    );
  }
}

export function insertIO(action: mm.Action, opt: ActionToIOOptions): InsertIO {
  const pro = new InsertIOProcessor(action as mm.InsertAction, opt);
  return pro.convert();
}

registerHandler(mm.ActionType.insert, insertIO);
