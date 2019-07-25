import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import VarInfo from '../lib/varInfo';
import * as utils from './utils';
import actionToIO, { registerHanlder } from './actionToIO';
import * as defs from '../defs';

export class WrapIO extends ActionIO {
  constructor(
    public action: dd.WrappedAction,
    public innerIO: ActionIO,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
    public funcPath: string | null,
  ) {
    super(action, funcArgs, execArgs, returnValues);
    throwIfFalsy(action, 'action');
  }
}

class WrapIOProcessor {
  constructor(public action: dd.WrappedAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): WrapIO {
    const { action, dialect } = this;
    const innerAction = action.action;
    const innerIO = actionToIO(innerAction, dialect);

    const { args } = action;
    // Throw on non-existing argument names
    const innerFuncArgs = innerIO.funcArgs;
    for (const key of Object.keys(args)) {
      if (!innerFuncArgs.getByName(key)) {
        throw new Error(
          `The argument "${key}" doesn't exist in action "${action.__name}"`,
        );
      }
    }
    // funcArgs
    const funcArgs = new VarList(
      `Func args of action "${action.__name}"`,
      true,
    );
    funcArgs.add(defs.dbxQueryableVar);

    // Skip the first param, which is always either dbx.Queryable or db.Tx
    for (let i = 1; i < innerFuncArgs.list.length; i++) {
      const v = innerFuncArgs.list[i];
      if (!args[v.name]) {
        funcArgs.add(v);
      }
    }
    // execArgs
    const execArgs = new VarList(
      `Exec args of action "${action.__name}"`,
      true,
    );
    // Pass the queryable param
    for (const v of innerFuncArgs.distinctList) {
      if (args[v.name]) {
        // Replace the variable with a value
        execArgs.add(VarInfo.withValue(v, args[v.name] as string));
      } else {
        execArgs.add(v);
      }
    }
    const actionTable = action.__table;
    if (!actionTable) {
      throw new Error('action not initialized');
    }
    let funcPath: string | null = null;
    // funcPath only works when inner action is a named action
    if (action.__name) {
      funcPath = utils.actionCallPath(actionTable.__name, action.__name);
    }

    return new WrapIO(
      action,
      innerIO,
      funcArgs,
      execArgs,
      innerIO.returnValues,
      funcPath,
    );
  }
}

export function wrapIO(action: dd.Action, dialect: Dialect): WrapIO {
  const pro = new WrapIOProcessor(action as dd.WrappedAction, dialect);
  return pro.convert();
}

registerHanlder(dd.ActionType.wrap, wrapIO);
