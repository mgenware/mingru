import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { settersToVarList, SetterIO } from './setterIO';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import VarInfo, { TypeInfo } from '../lib/varInfo';
import { registerHanlder } from './actionToIO';
import * as defs from '../defs';

export class InsertIO extends ActionIO {
  constructor(
    public action: dd.InsertAction,
    public sql: string,
    public setters: SetterIO[],
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
  ) {
    super(action, funcArgs, execArgs, returnValues);
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
  }
}

export class InsertIOProcessor {
  constructor(public action: dd.InsertAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): InsertIO {
    let sql = 'INSERT INTO ';
    const { action, dialect } = this;
    const { __table: table } = action;

    // table
    const tableSQL = this.handleFrom(table);
    sql += tableSQL;

    // setters
    const setters = SetterIO.fromAction(action, dialect);
    const colNames = setters.map(s => dialect.escapeColumn(s.col));
    sql += ` (${colNames.join(', ')})`;

    // values
    const colValues = setters.map(s => s.sql.toSQL(dialect));
    sql += ` VALUES (${colValues.join(', ')})`;

    // funcArgs
    const funcArgs = settersToVarList(
      `Func args of action ${action.__name}`,
      setters,
      [defs.dbxQueryableVar],
    );
    const execArgs = new VarList(`Exec args of action ${action.__name}`);
    // Skip the first items, which is queryable
    execArgs.merge(funcArgs.list.slice(1));

    // returns
    const returnValue = new VarList(`Returns of action ${action.__name}`);
    if (action.fetchInsertedID) {
      returnValue.add(new VarInfo(defs.insertedIDKey, new TypeInfo('uint64')));
    }

    return new InsertIO(action, sql, setters, funcArgs, execArgs, returnValue);
  }

  private handleFrom(table: dd.Table): string {
    const e = this.dialect.escape;
    return `${e(table.getDBName())}`;
  }
}

export function insertIO(action: dd.Action, dialect: Dialect): InsertIO {
  const pro = new InsertIOProcessor(action as dd.InsertAction, dialect);
  return pro.convert();
}

registerHanlder(dd.ActionType.insert, insertIO);
