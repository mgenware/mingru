import * as mm from 'mingru-models';
import { Dialect, StringSegment } from '../dialect.js';
import { settersToParamList, SetterIO } from './setterIO.js';
import { ActionIO } from './actionIO.js';
import { registerHandler } from './actionToIO.js';
import * as defs from '../def/defs.js';
import * as utils from '../lib/stringUtils.js';
import { ParamList, ValueList } from '../lib/varList.js';
import { VarDef } from '../lib/varInfo.js';
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
    funcArgs: ParamList,
    execArgs: ValueList,
    returnValues: ParamList,
  ) {
    super(dialect, insertAction, sql, funcArgs, execArgs, returnValues, false);
  }
}

export class InsertIOProcessor extends BaseIOProcessor<mm.InsertAction> {
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
      utils.validateSetters(actionData.setters, sqlTable, `[Validating setter of ${action}]`);
    }
    const setterIOs = SetterIO.fromAction(
      action,
      dialect,
      !!actionData.allowUnsetColumns,
      sqlTable,
      `[Building setters of ${action}]`,
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
    const precedingElements: VarDef[] = [];
    if (this.configurableTableName) {
      precedingElements.push(defs.cfTableVarDef(this.configurableTableName));
    }
    const funcArgs = settersToParamList(
      `Func args of action ${action}`,
      setterIOs,
      precedingElements,
    );

    const execArgs = new ValueList(`Exec args of action ${action}`);
    // Skip the first param if `configurableTable` is true.
    execArgs.mergeVarDefs(this.configurableTableName ? funcArgs.list.slice(1) : funcArgs.list);

    // Return values.
    const returnValue = new ParamList(`Return values of action ${action}`);
    if (fetchInsertedID) {
      returnValue.add(defs.insertedIDVar);
    }

    return new InsertIO(
      dialect,
      action,
      sql,
      setterIOs,
      !!fetchInsertedID,
      this.hoiseTableParams(funcArgs),
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
