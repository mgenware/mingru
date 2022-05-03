import * as mm from 'mingru-models';
import { Dialect } from '../dialect.js';
import { ActionIO } from './actionIO.js';
import { ParamList, ValueList } from '../lib/varList.js';
import { ValueType } from '../lib/varInfo.js';
import { registerHandler, actionToIO } from './actionToIO.js';
import * as defs from '../def/defs.js';
import { ActionToIOOptions } from './actionToIOOptions.js';
import BaseIOProcessor from './baseIOProcessor.js';

export class WrapIO extends ActionIO {
  constructor(
    dialect: Dialect,
    public wrapAction: mm.WrapAction,
    funcArgs: ParamList,
    execArgs: ValueList,
    returnValues: ParamList,
    public funcPath: string | null,
    public innerIO: ActionIO,
    firstParamDB: boolean,
  ) {
    super(dialect, wrapAction, null, funcArgs, execArgs, returnValues, firstParamDB);
  }
}

class WrapIOProcessor extends BaseIOProcessor<mm.WrapAction> {
  convert(): ActionIO {
    const { action, opt } = this;
    const { dialect } = opt;
    const actionData = action.__getData();
    const { innerAction } = actionData;
    if (!innerAction) {
      throw new Error(`Unexpected empty inner action on action "${action}"`);
    }
    const actionName = action.__mustGetName();
    const ag = action.__mustGetActionGroup();

    const innerIO = actionToIO(innerAction, opt, `WrapActionCore "${actionName}"`);
    const innerActionData = innerAction.__getData();

    const userArgs = actionData.args || {};
    // Throw on non-existing argument names.
    const innerFuncArgs = innerIO.funcArgs;
    for (const key of Object.keys(userArgs)) {
      if (!innerFuncArgs.getByName(key)) {
        const availableArgs = [innerIO.dbArgVarInfo().name];
        availableArgs.push(...innerFuncArgs.keys());
        throw new Error(
          `The argument "${key}" doesn't exist in action "${innerAction}". Available arguments: ${availableArgs.join(
            ',',
          )}, your arguments: ${Object.keys(userArgs)}`,
        );
      }
    }
    const funcArgs = new ParamList(`Func args of action "${action}"`);
    const execArgs = new ValueList(`Exec args of action "${action}"`);
    const capturedFuncArgs: Record<string, mm.CapturedVar> = {};
    const capturedVars: Record<string, mm.CapturedVar> = {};

    for (const innerArg of innerFuncArgs.list) {
      const userArgValue = userArgs[innerArg.name];
      if (userArgValue === undefined) {
        // Value not set by user, expose it to outer level.
        funcArgs.add(innerArg);
        // Add the original value to exec args since it's not updated.
        execArgs.addVarDef(innerArg);

        /**
         * inner(a, b) {...}
         *
         * WRAP:
         * inner.wrap({ c: 1 })
         *
         * Result:
         * wrapped(a, b) -> inner(a, b)
         */
      } else if (userArgValue instanceof mm.CapturedVar) {
        // (This scenario is only supported in TX members)
        // See the example below. Func and exec args are inherited from inner action.
        // The captured var is added to `capturedVars`, which will be handled by
        // `TransactIO`.
        funcArgs.add(innerArg);
        execArgs.addVarDef(innerArg);
        capturedFuncArgs[innerArg.name] = userArgValue;
        capturedVars[userArgValue.firstName] = userArgValue;

        /**
         * .transact(
         *    <some member declaring a var named "id">
         *    .insert(...).wrap({ col: mm.capturedVar("id") })
         * )
         *
         * This translates to:
         *
         * func tx_child_2(col) { ... }
         *
         * .transact(
         *    res, err := tx_child_1(...)
         *    err = tx_child_2(res)
         * )
         */
      } else if (userArgValue instanceof mm.RenameArg) {
        // Value is renamed, expose it with the new name.
        funcArgs.add({ ...innerArg, name: userArgValue.name });
        // Add the updated value to exec args.
        execArgs.addValue(userArgValue.name);

        /**
         * inner(a, b) {...}
         *
         * WRAP:
         * inner.wrap({ a: renamedVar(mod) })
         *
         * Result:
         * // Inside a TX.
         *    outer := anotherTXMem()
         *    wrapped(mod, b) -> inner(mod, b)
         */
      } else {
        // Here value is being set as a constant.
        // Add the updated value to exec args.
        execArgs.addValue(this.handleConstantValue(userArgValue));

        /**
         * inner(a, b) {...}
         *
         * WRAP:
         * inner.wrap({ a: 1 })
         *
         * Result:
         * // Inside a TX.
         *    outer := anotherTXMem()
         *    wrapped(b) -> inner(1, b)
         */
      }
    }

    // If the inner action is inline. We can update it in-place and
    // return it as the IO object for this action.
    // Example:
    //   mm.update().wrap(args) -> mm.update(args);
    if (innerActionData.inline) {
      if (innerAction instanceof mm.TransactAction) {
        throw new Error(
          'Wrapping an unnamed TRANSACT action is not supported. Wrap the TRANSACT action through a member variable instead.',
        );
      }

      // Set the `name` to undefined to allow inner action to be
      // re-configured.
      innerActionData.name = undefined;
      innerAction.__configure(actionName, ag, false);

      innerIO.funcArgs = funcArgs;
      innerIO.execArgs = execArgs;

      innerIO.capturedFuncArgs = capturedFuncArgs;
      innerIO.capturedVars = capturedVars;
      return innerIO;
    }

    // Non-inline case.
    // Is child member AG the same as the outer AG.
    const isSameAG = ag === innerActionData.actionGroup;
    const funcPath = defs.actionCallPath(
      isSameAG ? null : innerActionData.actionGroup ?? null,
      innerAction.__mustGetName(),
      false,
    );

    const retIO = new WrapIO(
      dialect,
      action,
      funcArgs,
      execArgs,
      innerIO.returnValues,
      funcPath,
      innerIO,
      innerIO.isDBArgSQLDB,
    );
    retIO.capturedFuncArgs = capturedFuncArgs;
    retIO.capturedVars = capturedVars;
    return retIO;
  }

  // eslint-disable-next-line class-methods-use-this
  private handleConstantValue(value: string | number | mm.Table | null): ValueType {
    if (value instanceof mm.Table) {
      return value;
    }
    if (value === null) {
      return mm.constants.NULL;
    }
    // string or number.
    return value.toString();
  }
}

export function wrapIO(action: mm.Action, opt: ActionToIOOptions): ActionIO {
  const pro = new WrapIOProcessor(action as mm.WrapAction, opt);
  return pro.convert();
}

registerHandler(mm.ActionType.wrap, wrapIO);
