import * as mm from 'mingru-models';
import { ActionIO } from './actionIO.js';
import { ParamList, ValueList } from '../lib/varList.js';
import { actionToIO, registerHandler } from './actionToIO.js';
import * as defs from '../def/defs.js';
import { VarDef } from '../lib/varInfo.js';
import BaseIOProcessor from './baseIOProcessor.js';
import { ActionToIOOptions } from './actionToIOOptions.js';

export class TransactMemberIO {
  constructor(
    public member: mm.TransactionMember,
    public actionIO: ActionIO,
    public callPath: string,
  ) {}

  get isInline(): boolean {
    return !!this.member.action.__getData().inline;
  }

  toString(): string {
    return `TransactMemberIO(${this.actionIO.action}, ${this.callPath})`;
  }
}

export class TransactIO extends ActionIO {
  constructor(
    public transactAction: mm.TransactAction,
    public memberIOs: TransactMemberIO[],
    funcArgs: ParamList,
    execArgs: ValueList,
    returnValues: ParamList,
    public childReturnValues: { [name: string]: TXMReturnValueInfo | undefined },
  ) {
    super(transactAction, null, funcArgs, execArgs, returnValues, true);
  }
}

// How a CRV is used.
// See "Child return values (CRV)" below for details.
export enum TXMReturnValueSource {
  returnValue,
  reference,
}

// See "Child return values (CRV)" below for details.
export interface TXMReturnValueInfo {
  def: VarDef;
  // A variable can have no refs (unused var), or multiple refs
  // (used by both TX func return values and other TX member funcs).
  refs: TXMReturnValueSource[];
}

class TransactIOProcessor extends BaseIOProcessor<mm.TransactAction> {
  convert(): TransactIO {
    const { action, opt } = this;
    const actionData = action.__getData();
    const { members } = actionData;
    if (!members?.length) {
      throw new Error(`Unexpected empty members at action ${action}`);
    }

    const memberIOs = members.map((mem, idx) => {
      const childAction = mem.action;
      const childActionData = mem.action.__getData();
      const childName = childAction.__mustGetName();

      const io = actionToIO(childAction, opt, `Transaction child number ${idx + 1}`);

      // Is child member AG the same as the outer AG.
      const isSameAG =
        childActionData.inline || action.__mustGetActionGroup() === childActionData.actionGroup;
      const callPath = defs.actionCallPath(
        isSameAG ? null : childActionData.actionGroup ?? null,
        childName,
        !!childActionData.inline,
      );
      return new TransactMemberIO(mem, io, callPath);
    });

    /**
     * Child return values (CRV)
     * Keeps track of information about TX member return values.
     *
     * # Return value type
     * When a TX return value is declared (like `a` in the following example), we
     * need to find where `a` is defined and what the type of `a` is to generate
     * appropriate return type for `a`.
     *
     * # How it is used
     * - none: not used
     * - return value: used as a TX return value, like `a`, `b` in the example below.
     * - referenced: like `c11`, `c12` in example.
     *
     * Example:
     * func tx() (type1, type2, error) {
     *   var a, b
     *   go.tx {
     *      c11, c12, _, _, err := child(...)
     *      _, c22, err := child(c11, ...)
     *      a = c12
     *      b = c22
     *   }
     *   return a, b
     * }
     * >> TX return values: [a, b]
     * >> referenced vars: [c11, c12, c22]
     */

    // K: declared return value (name), V: info.
    const crv: { [name: string]: TXMReturnValueInfo | undefined } = {};
    for (const mem of memberIOs) {
      // Return values of current TX member.
      // NOT to be confused with `ActionIO.returnValues` which is a `ParamList`.
      // This is a plain object (K: imported child return value, V: exported return value)
      // See mingru-models `declareReturnValues` and `setReturnValues` for details.
      // Example:
      // cmtID, err := txMember(...)
      // returnValues = { insertedID: cmtID }

      // No action if TX member has no return values.
      const memReturnValues = mem.member.returnValues;
      if (!memReturnValues) {
        continue;
      }

      for (const key of Object.keys(memReturnValues)) {
        const retValueName = memReturnValues[key];
        if (!retValueName) {
          continue;
        }

        // Check if declared return value exists in TX members.
        const memReturnDef = mem.actionIO.returnValues.getByName(key);
        if (!memReturnDef) {
          throw new Error(
            `The return value named "${key}" doesn't exist in member action "${
              mem.actionIO.action
            }", available return values "${mem.actionIO.returnValues
              .keys()
              .join(',')}", got "${JSON.stringify(Object.keys(memReturnValues))}"`,
          );
        }

        // Now both value and key are valid.
        crv[retValueName] = {
          def: { name: retValueName, type: memReturnDef.type },
          refs: [],
        };

        // Check captured vars by other TX members.
        const mActionIO = mem.actionIO;
        for (const capVar of Object.values(mActionIO.capturedVars)) {
          const refName = capVar.firstName;
          const crvRes = crv[refName];
          if (crvRes) {
            crvRes.refs.push(TXMReturnValueSource.reference);
          }
        }
      }
    }

    // Track referenced vars.
    // K: declared value name, V: source info (original var info in action return list).
    const varRefs = new Set<string>();
    for (const mem of memberIOs) {
      const memberAction = mem.actionIO.action;
      if (memberAction instanceof mm.WrapAction === false) {
        continue;
      }
      const argValues = Object.values((memberAction as mm.WrapAction).__getData().args ?? {});
      for (const value of argValues) {
        if (value instanceof mm.CapturedVar) {
          varRefs.add(value.firstName);
        }
      }
    }

    // funcArgs
    const funcArgs = new ParamList(`Func args of action "${action}"`);
    for (const mem of memberIOs) {
      const mIO = mem.actionIO;
      for (const arg of mIO.funcArgs.list) {
        // See details in `WrapIO.ts` (the `mm.CapturedVar` section).
        // Check if this func arg has been captured in WRAP action.
        // If it's captured, no need to add it to TXIO func args.
        // Also, the exec args of this member needs to be updated (only
        // tmp member can have wrapped `mm.CapturedVar`. We can safely
        // update exec args here.)
        if (!mIO.capturedFuncArgs[arg.name]) {
          funcArgs.add(arg);
        }
      }
    }
    // `execArgs` is empty in `TransactIO`.
    const execArgs = new ValueList(`Exec args of action "${action}"`);
    const returnValues = new ParamList(`Return values of action ${action}`);

    // Check TX return value refs.
    if (actionData.returnValues) {
      for (const name of actionData.returnValues) {
        const info = crv[name];
        if (!info) {
          throw new Error(`The return value named "${name}" is not declared by any member`);
        }
        info.refs.push(TXMReturnValueSource.returnValue);
        returnValues.add(info.def);
      }
    }

    const result = new TransactIO(
      action,
      memberIOs,
      this.hoiseTableParams(funcArgs),
      execArgs,
      returnValues,
      crv,
    );
    return result;
  }
}

export function transactIO(action: mm.Action, opt: ActionToIOOptions): TransactIO {
  const pro = new TransactIOProcessor(action as mm.TransactAction, opt);
  return pro.convert();
}

registerHandler(mm.ActionType.transact, transactIO);
