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
    dialect: Dialect,
    public action: dd.WrappedAction,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
    public funcPath: string | null,
  ) {
    super(dialect, action, funcArgs, execArgs, returnValues);
    throwIfFalsy(action, 'action');
  }
}

class WrapIOProcessor {
  constructor(public action: dd.WrappedAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): ActionIO {
    const { action, dialect } = this;
    const innerAction = action.action;
    if (!action.__table || !action.__name) {
      throw new Error('Action not initialized');
    }
    const innerIO = actionToIO(
      innerAction,
      dialect,
      `WrappedAction "${action.__name}"`,
    );
    const innerActionTable = innerAction.__table;
    if (!innerActionTable) {
      throw new Error('innerAction not initialized');
    }

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

    // For temp actions, inner and outer actions are merged into one
    //   dd.update().wrap(args) -> dd.update(args)
    // For non-temp actions:
    //   this.t.wrap(args) -> inner: this.t, outer: this.t(args)
    const funcPath = utils.actionCallPath(
      innerActionTable === action.__table ? null : innerActionTable.__name,
      innerAction.__name || action.__name,
    );
    let execArgs: VarList;
    if (action.isTemp) {
      // We can change innerIO in-place as no other place is using it
      innerIO.funcArgs = funcArgs;
      for (const v of innerFuncArgs.distinctList) {
        if (args[v.name]) {
          // Replace the variable with a value
          v.value = args[v.name] as string;
        }
      }
      return innerIO;
    } else {
      execArgs = new VarList(`Exec args of action "${action.__name}"`, true);
      // Pass the queryable param
      for (const v of innerFuncArgs.distinctList) {
        if (args[v.name]) {
          // Replace the variable with a value
          execArgs.add(VarInfo.withValue(v, args[v.name] as string));
        } else {
          execArgs.add(v);
        }
      }
      return new WrapIO(
        dialect,
        action,
        funcArgs,
        execArgs,
        innerIO.returnValues,
        funcPath,
      );
    }
  }
}

export function wrapIO(action: dd.Action, dialect: Dialect): ActionIO {
  const pro = new WrapIOProcessor(action as dd.WrappedAction, dialect);
  return pro.convert();
}

registerHanlder(dd.ActionType.wrap, wrapIO);
