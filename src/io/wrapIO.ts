import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import VarInfo from '../lib/varInfo';
import * as utils from '../lib/stringUtils';
import actionToIO, { registerHandler } from './actionToIO';
import * as defs from '../defs';

export class WrapIO extends ActionIO {
  constructor(
    dialect: Dialect,
    public action: mm.WrappedAction,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
    public funcPath: string | null,
    public innerIO: ActionIO,
  ) {
    super(dialect, action, funcArgs, execArgs, returnValues);
    throwIfFalsy(action, 'action');
  }
}

class WrapIOProcessor {
  constructor(public action: mm.WrappedAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): ActionIO {
    const { action, dialect } = this;
    const innerAction = action.action;
    const [, actionName] = action.ensureInitialized();
    const innerIO = actionToIO(
      innerAction,
      dialect,
      `WrappedAction "${actionName}"`,
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
          `The argument "${key}" doesn't exist in action "${
            action.__name
          }", available keys "${innerFuncArgs.getKeysString()}"`,
        );
      }
    }
    // funcArgs
    const funcArgs = new VarList(
      `Func args of action "${action.__name}"`,
      true,
    );
    funcArgs.add(defs.dbxQueryableVar);

    // Skip the first param, which is always either `dbx.Queryable` or `db.Tx`.
    for (let i = 1; i < innerFuncArgs.list.length; i++) {
      const arg = innerFuncArgs.list[i];
      const newValue = args[arg.name];
      if (!newValue) {
        // If this argument doesn't appear on `args`, it will still
        // be an func argument.
        funcArgs.add(arg);
      } else if (newValue instanceof mm.ValueRef) {
        // If this argument appears on `args` with a `ValueRef`,
        // it's being replaced by another name.
        funcArgs.add(new VarInfo(newValue.name, arg.type, arg.value, true));
      }
    }

    // For temp actions, inner and outer actions are merged into one:
    //   mm.update().wrap(args) -> mm.update(args)
    // For non-temp actions:
    //   this.t.wrap(args) -> inner = this.t, outer = this.t(args)
    const funcPath = utils.actionCallPath(
      innerActionTable === action.__table ? null : innerActionTable.__name,
      innerAction.__name || actionName,
      false,
    );

    if (action.isTemp) {
      // We can change innerIO in-place and return it as no other place is using it.
      innerIO.funcArgs = funcArgs;
      const innerExecArgs = innerIO.execArgs;
      for (let i = 0; i < innerExecArgs.list.length; i++) {
        const v = innerExecArgs.list[i];
        const value = args[v.name];
        if (value) {
          if (value instanceof mm.ValueRef) {
            innerExecArgs.list[i] = VarInfo.withValue(v, value.name);
          } else {
            innerExecArgs.list[i] = VarInfo.withValue(v, `${value}`);
          }
        }
      }
      return innerIO;
    }

    const execArgs = new VarList(
      `Exec args of action "${action.__name}"`,
      true,
    );
    for (const v of innerFuncArgs.distinctList) {
      const value = args[v.name];
      if (value) {
        if (value instanceof mm.ValueRef) {
          execArgs.add(new VarInfo(value.name, v.type, v.value));
        } else {
          execArgs.add(VarInfo.withValue(v, `${value}`));
        }
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
      innerIO,
    );
  }
}

export function wrapIO(action: mm.Action, dialect: Dialect): ActionIO {
  const pro = new WrapIOProcessor(action as mm.WrappedAction, dialect);
  return pro.convert();
}

registerHandler(mm.ActionType.wrap, wrapIO);
