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
      const inputArg = args[arg.name];
      // This argument is still exposed if it's not overwritten or it's overwritten by a `ValueRef`.
      // Imagine a func `func(x, y)`.
      // If input is a constant, e.g. {x: 123}, `x` won't be exposed, this IO results in:
      //   `func(y) { innerFunc(123, y) }
      // If input is a `ValueRef` like {x: result.prop}, `x` will still be exposed:
      //   `func(x, y) { innerFunc(x, y) }
      // In this case, `x` has a `ValueRef` value and is taken care of by the caller of this func
      // because the `ValueRef`
      // is only valid at the caller context.
      if (!inputArg) {
        funcArgs.add(arg);
      } else if (inputArg instanceof mm.ValueRef) {
        funcArgs.add(VarInfo.withValue(arg, inputArg));
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
      // `isTemp` means the `innerIO` is not used by any other actions. We can
      // update it in-place and return it as the IO object for this action.
      innerIO.funcArgs = funcArgs;
      const innerExecArgs = innerIO.execArgs;
      for (let i = 0; i < innerExecArgs.list.length; i++) {
        const arg = innerExecArgs.list[i];
        const input = args[arg.name];
        // If argument is a constant, update the `innerExecArgs`.
        if (input && typeof input === 'string') {
          innerExecArgs.list[i] = VarInfo.withValue(arg, input);
        }
      }
      return innerIO;
    }

    const execArgs = new VarList(
      `Exec args of action "${action.__name}"`,
      true,
    );
    for (const arg of innerFuncArgs.distinctList) {
      const input = args[arg.name];
      // Update all arguments in `execArgs` that have been overwritten as constant.
      if (input && typeof input === 'string') {
        execArgs.add(VarInfo.withValue(arg, input));
      } else {
        execArgs.add(arg);
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
