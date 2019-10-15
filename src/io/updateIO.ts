import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { settersToVarList, SetterIO } from './setterIO';
import { SQLIO, sqlIO } from './sqlIO';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import VarInfo from '../lib/varInfo';
import { registerHanlder } from './actionToIO';
import * as defs from '../defs';

export class UpdateIO extends ActionIO {
  constructor(
    dialect: Dialect,
    public action: mm.UpdateAction,
    public sql: string,
    public setters: SetterIO[],
    public where: SQLIO | null,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
    public setterArgs: VarList,
  ) {
    super(dialect, action, funcArgs, execArgs, returnValues);
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(setters, 'setters');
  }
}

class UpdateIOProcessor {
  constructor(public action: mm.UpdateAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): UpdateIO {
    let sql = 'UPDATE ';
    const { action, dialect } = this;
    const [table] = action.ensureInitialized();

    if (!action.whereSQL && !action.allowNoWhere) {
      throw new Error(
        `You have to call unsafeUpdateAll to build an action without a WHERE clause, action name: "${action.__name}"`,
      );
    }

    // Table
    const fromSQL = this.handleFrom(table);
    sql += `${fromSQL} SET `;

    // Setters
    const setterIOs = SetterIO.fromAction(action, dialect);
    sql += setterIOs
      .map(s => `${dialect.encodeColumnName(s.col)} = ${s.sql.toSQL(table)}`)
      .join(', ');

    // WHERE
    const whereIO = action.whereSQL ? sqlIO(action.whereSQL, dialect) : null;
    if (whereIO) {
      sql += ` WHERE ${whereIO.toSQL(table)}`;
    }

    // funcArgs
    const setterVars = settersToVarList(
      `SetterInputs of action "${action.__name}"`,
      setterIOs,
    );
    const funcArgs = new VarList(
      `Func args of action "${action.__name}"`,
      true,
    );
    funcArgs.add(defs.dbxQueryableVar);
    const execArgs = new VarList(
      `Exec args of action "${action.__name}"`,
      true,
    );
    // funcArgs = WHERE(distinct) + setters
    // execArgs = setters + WHERE(all)
    execArgs.merge(setterVars.list);
    if (whereIO) {
      funcArgs.merge(whereIO.distinctVars);
      execArgs.merge(whereIO.vars);
    }
    funcArgs.merge(setterVars.list);

    // returns
    const returnValues = new VarList(`Returns of action ${action.__name}`);
    if (!action.ensureOneRowAffected) {
      returnValues.add(
        new VarInfo(
          defs.rowsAffectedKey,
          dialect.colTypeToGoType(mm.int().type),
        ),
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

  private handleFrom(table: mm.Table): string {
    const e = this.dialect.encodeName;
    return `${e(table.getDBName())}`;
  }
}

export function updateIO(action: mm.Action, dialect: Dialect): UpdateIO {
  const pro = new UpdateIOProcessor(action as mm.UpdateAction, dialect);
  return pro.convert();
}

registerHanlder(mm.ActionType.update, updateIO);
