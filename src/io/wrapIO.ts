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

    const innerIO = actionToIO(
      innerAction,
      { ...opt, outerGroupTable: groupTable, outerActionName: actionName },
      `WrapAction "${actionName}"`,
    );
    const innerActionData = innerAction.__getData();

    const userArgs = actionData.args || {};
    // Throw on non-existing argument names.
    const innerFuncArgs = innerIO.funcArgs;
    for (const key of Object.keys(userArgs)) {
      if (!innerFuncArgs.getByName(key)) {
        const availableArgs = [innerIO.dbArgVarInfo().name];
        availableArgs.push(...innerFuncArgs.keys());
        throw new Error(
          `The argument "${key}" doesn't exist in action "${action}". Available arguments: ${availableArgs.join(
            ',',
          )}, your arguments: ${Object.keys(userArgs)}`,
        );
      }
    }
    const funcArgs = new ParamList(`Func args of action "${action}"`);
    const execArgs = new ValueList(`Exec args of action "${action}"`);

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
        // (TX only)
        // Value set as a captured var (from outer scope), don't expose it.
        // Update the exec args with the captured var.
        execArgs.addValue(userArgValue);

        /**
         * inner(a, b) {...}
         *
         * WRAP:
         * inner.wrap({ a: capturedVar(outer.var) })
         *
         * Result:
         * // Inside a TX.
         *    outer := anotherTXMem()
         *    wrapped(b) -> inner(outer.var, b)
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

    // If the inner action doesn't belong to any TA. We can update it
    // in-place and return it as the IO object for this action.
    // Example:
    //   mm.update().wrap(args) -> mm.update(args)
    // NOTE that `innerIO` might be any action types.
    if (!innerActionData.name) {
      if (innerAction instanceof mm.TransactAction) {
        throw new Error(
          'Wrapping an unnamed TRANSACT action is not supported. Wrap the TRANSACT action through a member variable instead.',
        );
      }
      innerIO.funcArgs = funcArgs;
      innerIO.execArgs = execArgs;

      // IMPORTANT! Give `innerIO` a name as it doesn't have one.
      // Calling `__configure` with another table won't change inner action's
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

    return new WrapIO(
      dialect,
      action,
      funcArgs,
      execArgs,
      innerIO.returnValues,
      funcPath,
      innerIO,
      innerIO.isDBArgSQLDB,
    );
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
