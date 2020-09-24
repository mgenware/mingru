import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect, { StringSegment } from '../dialect';
import { ActionIO } from './actionIO';
import { SQLIO, sqlIO } from './sqlIO';
import VarList from '../lib/varList';
import VarInfo from '../lib/varInfo';
import { registerHandler } from './actionToIO';
import * as defs from '../defs';

export class DeleteIO extends ActionIO {
  constructor(
    dialect: Dialect,
    public action: mm.DeleteAction,
    public sql: StringSegment[],
    public where: SQLIO | null,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
  ) {
    super(dialect, action, funcArgs, execArgs, returnValues);
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
  }
}

class DeleteIOProcessor {
  constructor(public action: mm.DeleteAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): DeleteIO {
    let sql: StringSegment[] = ['DELETE FROM '];
    const { action, dialect } = this;
    const [table] = action.ensureInitialized();

    if (!action.whereSQL && !action.allowNoWhere) {
      throw new Error(
        `You have to call unsafeDeleteAll to build an action without a WHERE clause, action name: "${action.__name}"`,
      );
    }

    // table
    const fromSQL = this.handleFrom(table);
    sql.push(fromSQL);

    // where
    const whereIO = action.whereSQLValue ? sqlIO(action.whereSQLValue, dialect, table) : null;
    if (whereIO) {
      sql.push(' WHERE ');
      sql.push(...whereIO.code);
    }

    // inputs
    const funcArgs = new VarList(`Func args of action "${action.__name}"`, true);
    funcArgs.add(defs.dbxQueryableVar);
    const execArgs = new VarList(`Exec args of action "${action.__name}"`, true);
    if (whereIO) {
      funcArgs.merge(whereIO.distinctVars);
      execArgs.merge(whereIO.vars);
    }

    // returns
    const returnValues = new VarList(`Returns of action ${action.__name}`, false);
    if (!action.ensureOneRowAffected) {
      returnValues.add(
        new VarInfo(mm.ReturnValues.rowsAffected, dialect.colTypeToGoType(mm.int().__type)),
      );
    }

    return new DeleteIO(dialect, action, sql, whereIO, funcArgs, execArgs, returnValues);
  }

  private handleFrom(table: mm.Table): string {
    const e = this.dialect.encodeName;
    return e(table.getDBName());
  }
}

export function deleteIO(action: mm.Action, dialect: Dialect): DeleteIO {
  const pro = new DeleteIOProcessor(action as mm.DeleteAction, dialect);
  return pro.convert();
}

registerHandler(mm.ActionType.delete, deleteIO);
