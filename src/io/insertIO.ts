import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { settersToVarList, SetterIO } from './setterIO';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import { registerHandler } from './actionToIO';
import * as defs from '../defs';
import * as utils from './utils';

export class InsertIO extends ActionIO {
  returnMember: ActionIO | undefined;

  constructor(
    dialect: Dialect,
    public action: mm.InsertAction,
    public sql: string,
    public setters: SetterIO[],
    public fetchInsertedID: boolean,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
  ) {
    super(dialect, action, funcArgs, execArgs, returnValues);
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
  }
}

export class InsertIOProcessor {
  constructor(public action: mm.InsertAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): InsertIO {
    let sql = 'INSERT INTO ';
    const { action, dialect } = this;
    const [table] = action.ensureInitialized();
    const fetchInsertedID =
      action.ensureOneRowAffected && !!table.__pkAIs.length;

    // table
    const tableSQL = this.handleFrom(table);
    sql += tableSQL;

    // setters
    utils.validateSetters(action.setters, table);
    const setters = SetterIO.fromAction(
      action,
      dialect,
      action.allowUnsetColumns,
    );
    const colNames = setters.map(s => dialect.encodeColumnName(s.col));
    sql += ` (${colNames.join(', ')})`;

    // values
    const colValues = setters.map(s => s.sql.toSQL(table));
    sql += ` VALUES (${colValues.join(', ')})`;

    // funcArgs
    const funcArgs = settersToVarList(
      `Func args of action ${action.__name}`,
      setters,
      [defs.dbxQueryableVar],
    );
    const execArgs = new VarList(`Exec args of action ${action.__name}`);
    // Skip the first param, which is queryable.
    execArgs.merge(funcArgs.list.slice(1));

    // Return values.
    const returnValue = new VarList(`Returns of action ${action.__name}`);
    if (fetchInsertedID) {
      returnValue.add(defs.insertedIDVar);
    }

    return new InsertIO(
      dialect,
      action,
      sql,
      setters,
      fetchInsertedID,
      funcArgs,
      execArgs,
      returnValue,
    );
  }

  private handleFrom(table: mm.Table): string {
    const e = this.dialect.encodeName;
    return `${e(table.getDBName())}`;
  }
}

export function insertIO(action: mm.Action, dialect: Dialect): InsertIO {
  const pro = new InsertIOProcessor(action as mm.InsertAction, dialect);
  return pro.convert();
}

registerHandler(mm.ActionType.insert, insertIO);
