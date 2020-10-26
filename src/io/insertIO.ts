import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect, { StringSegment } from '../dialect';
import { settersToVarList, SetterIO } from './setterIO';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import { registerHandler } from './actionToIO';
import * as defs from '../defs';
import * as utils from '../lib/stringUtils';
import { forEachWithSlots } from '../lib/arrayUtils';
import { ActionToIOOptions } from './actionToIOOptions';
import BaseIOProcessor from './baseIOProcessor';
import { handleNonSelectSQLFrom } from '../lib/sqlHelper';

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
    super(dialect, insertAction, sql, funcArgs, execArgs, returnValues);
    throwIfFalsy(insertAction, 'insertAction');
    throwIfFalsy(sql, 'sql');
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
    const sqlTable = this.mustGetAvailableSQLTable();
    const fetchInsertedID = action.ensureOneRowAffected && !!sqlTable.__aiPKs.length;

    // Table
    const tableSQL = handleNonSelectSQLFrom(this, sqlTable);
    sql.push(...tableSQL);

    // Setters
    utils.validateSetters(action.setters, sqlTable);
    const setterIOs = SetterIO.fromAction(action, dialect, action.allowUnsetColumns, sqlTable);
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
    const precedingElements = [defs.dbxQueryableVar];
    if (this.isFromTableInput()) {
      precedingElements.push(defs.tableInputVar);
    }
    const funcArgs = settersToVarList(
      `Func args of action ${action.__name}`,
      setterIOs,
      precedingElements,
    );

    const execArgs = new VarList(`Exec args of action ${action.__name}`);
    // Skip the first param, which is queryable.
    execArgs.merge(funcArgs.list.slice(1));

    // Return values.
    const returnValue = new VarList(`Return values of action ${action.__name}`);
    if (fetchInsertedID) {
      returnValue.add(defs.insertedIDVar);
    }

    return new InsertIO(
      dialect,
      action,
      sql,
      setterIOs,
      fetchInsertedID,
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
