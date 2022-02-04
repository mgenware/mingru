import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Dialect } from '../dialect.js';
import { ActionIO } from './actionIO.js';
import VarList from '../lib/varList.js';
import { VarInfo, VarValue } from '../lib/varInfo.js';
import { registerHandler, actionToIO } from './actionToIO.js';
import * as defs from '../def/defs.js';
import { ActionToIOOptions } from './actionToIOOptions.js';
import BaseIOProcessor from './baseIOProcessor.js';

export class WrapIO extends ActionIO {
  constructor(
    dialect: Dialect,
    public wrapAction: mm.WrapAction,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
    public funcPath: string | null,
    public innerIO: ActionIO,
  ) {
    super(dialect, wrapAction, null, funcArgs, execArgs, returnValues);
    throwIfFalsy(wrapAction, 'wrapAction');
  }
}

class WrapIOProcessor extends BaseIOProcessor {
  constructor(public action: mm.WrapAction, opt: ActionToIOOptions) {
    super(action, opt);
  }

  convert(): ActionIO {
    const { action, opt } = this;
    const { dialect } = opt;
    const actionData = action.__getData();
    const { innerAction } = actionData;
    if (!innerAction) {
      throw new Error(`Unexpected empty inner action on action "${action}"`);
    }
    const actionName = this.mustGetActionName();
    const groupTable = this.mustGetGroupTable();
    if (!actionName) {
      throw new Error(`Action name is empty, action "${action}"`);
    }

    const innerIO = actionToIO(
      innerAction,
      { ...opt, groupTable, actionName },
      `WrapAction "${actionName}"`,
    );
    const innerActionData = innerAction.__getData();

    const args = actionData.args || {};
    // Throw on non-existing argument names.
    const innerFuncArgs = innerIO.funcArgs;
    for (const key of Object.keys(args)) {
      if (!innerFuncArgs.getByName(key)) {
        throw new Error(
          `The argument "${key}" doesn't exist in action "${action}". Available arguments: "${innerFuncArgs.getKeysString()}", your arguments: "${Object.keys(
            args,
          )}"`,
        );
      }
    }
    // funcArgs
    const funcArgs = new VarList(`Func args of action "${action}"`, true);
    funcArgs.add(defs.dbxQueryableVar);

    // Skip the first param, which is always `mingru.Queryable` or `db.Tx`.
    for (let i = 1; i < innerFuncArgs.list.length; i++) {
      const arg = innerFuncArgs.list[i];
      if (!arg) {
        throw new Error('Unexpected func argument');
      }
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
      if (inputArg === undefined) {
        funcArgs.add(arg);
      } else if (inputArg instanceof mm.ValueRef) {
        funcArgs.add(VarInfo.withValue(arg, inputArg));
      }
    }

    // `isInline` means the `innerIO` is not used by any other actions. We can
    // update it in-place and return it as the IO object for this action.
    // Example:
    //   mm.update().wrap(args) -> mm.update(args)
    // NOTE that `innerIO` might be any action types.
    if (!innerActionData.name) {
      innerIO.funcArgs = funcArgs;
      const innerExecArgs = innerIO.execArgs;
      innerExecArgs.list.forEach((arg, i) => {
        const input = args[arg.name];
        // If argument is a constant, update the `innerExecArgs`.
        if (input instanceof mm.ValueRef === false && input !== undefined) {
          innerExecArgs.list[i] = VarInfo.withValue(arg, this.constantToVarValue(input));
        }
      });

      // IMPORTANT! Give `innerIO` a name as it doesn't have one.
      // Calling `__configure` with another table won't inner action's
      // previous table.
      innerAction.__configure(groupTable, this.mustGetActionName());
      return innerIO;
    }

    // Non-inline case.
    const innerActionGroupTable = innerActionData.groupTable;
    // `innerActionGroupTable` should not be null as `innerAction` should
    // be initialized at the point.
    if (!innerActionGroupTable) {
      throw new Error(`Unexpected uninitialized WRAP action "${innerActionData.name}"`);
    }
    const funcPath = defs.actionCallPath(
      innerActionGroupTable === groupTable ? null : innerActionGroupTable.__getData().name,
      innerActionData.name || actionName,
      false,
    );

    const execArgs = new VarList(`Exec args of action "${action}"`, true);
    for (const arg of innerFuncArgs.distinctList) {
      const input = args[arg.name];
      // Update all arguments in `execArgs` that have been overwritten as constant.
      if (input instanceof mm.ValueRef === false && input !== undefined) {
        execArgs.add(VarInfo.withValue(arg, this.constantToVarValue(input)));
      } else {
        execArgs.add(arg);
      }
    }

    return new WrapIO(dialect, action, funcArgs, execArgs, innerIO.returnValues, funcPath, innerIO);
  }

  // eslint-disable-next-line class-methods-use-this
  private constantToVarValue(value: unknown): VarValue {
    if (value instanceof mm.ValueRef) {
      return value;
    }
    if (value instanceof mm.Table) {
      return value;
    }
    if (value === null) {
      return mm.constants.NULL;
    }
    return `${value}`;
  }
}

export function wrapIO(action: mm.Action, opt: ActionToIOOptions): ActionIO {
  const pro = new WrapIOProcessor(action as mm.WrapAction, opt);
  return pro.convert();
}

registerHandler(mm.ActionType.wrap, wrapIO);
