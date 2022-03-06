import * as mm from 'mingru-models';
import { Dialect } from '../dialect.js';
import { ActionIO } from './actionIO.js';
import VarList from '../lib/varList.js';
import { actionToIO, registerHandler } from './actionToIO.js';
import * as defs from '../def/defs.js';
import { VarInfo } from '../lib/varInfo.js';
import BaseIOProcessor from './baseIOProcessor.js';
import { ActionToIOOptions } from './actionToIOOptions.js';

export class TransactMemberIO {
  constructor(
    public member: mm.TransactionMember,
    public assignedName: string,
    public actionIO: ActionIO,
    public callPath: string,
  ) {}

  get isInline(): boolean {
    return !this.member.action.__getData().name;
  }

  toString(): string {
    return `TransactMemberIO(${this.actionIO.action}, ${this.callPath})`;
  }
}

export class TransactIO extends ActionIO {
  constructor(
    dialect: Dialect,
    public transactAction: mm.TransactAction,
    public memberIOs: TransactMemberIO[],
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
    public childReturnValues: { [name: string]: TXMReturnValueInfo | undefined },
  ) {
    super(dialect, transactAction, null, funcArgs, execArgs, returnValues);
  }
}

// See "Child return values (CRV)" below for details.
export enum TXMReturnValueSource {
  returnValue,
  reference,
}

// See "Child return values (CRV)" below for details.
export interface TXMReturnValueInfo {
  typeInfo: VarInfo;
  // A variable can have no refs (unused var), or multiple refs
  // (used by both TX func return values and other TX member funcs).
  refs: TXMReturnValueSource[];
}

class TransactIOProcessor extends BaseIOProcessor {
  constructor(public action: mm.TransactAction, opt: ActionToIOOptions) {
    super(action, opt);
  }

  convert(): TransactIO {
    const { action, opt } = this;
    const parentName = action.__mustGetName();
    const groupTable = action.__mustGetGroupTable();
    const actionData = action.__getData();
    const { dialect } = opt;
    const { members } = actionData;
    if (!members) {
      throw new Error(`Unexpected empty members at action ${action}`);
    }
    const memberIOs = members.map((mem, idx) => {
      const childAction = mem.action;
      const childActionData = mem.action.__getData();
      const childGroupTable = childActionData.groupTable;
      const childName = childActionData.name || mem.name || `${parentName}Child${idx + 1}`;

      const io = actionToIO(
        childAction,
        { ...opt, groupTable, actionName: childName },
        `Transaction child number ${idx + 1}`,
      );

      const isChildInline = !childActionData.name;
      const isChildSameRoot = isChildInline || groupTable === childGroupTable;
      const callPath = defs.actionCallPath(
        isChildSameRoot ? null : childGroupTable?.__getData().name || null,
        childName,
        isChildInline,
      );
      return new TransactMemberIO(mem, childName, io, callPath);
    });

    // funcArgs
    const funcArgs = new VarList(`Func args of action "${action}"`, true);
    funcArgs.add(defs.sqlDBVar);
    for (const mem of memberIOs) {
      const mAction = mem.actionIO;
      // Skip the first param of all member functions, which is `mingru.Queryable`.
      for (const v of mAction.funcArgs.list.slice(1)) {
        if (!v.hasValueRef) {
          funcArgs.add(v);
        }
      }
    }
    // execArgs is empty for transact io
    const execArgs = new VarList(`Exec args of action "${action}"`, true);

    const returnValues = new VarList(`Return values of action ${action}`, false);

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
     * none: not used
     * return value: used as a TX return value, like `a`, `b` in example.
     * referenced: like `c11`, `c12` in example.
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
      // NOT to be confused with `ActionIO.returnValues` which is a `VarList`.
      // This is a plain object (K: imported child return value, V: exported return value)
      // See mingru-models `declareReturnValues` and `setReturnValues` for details.
      // Example:
      // cmtID, err := txMember(...)
      // returnValues = { insertedID: cmtID }
      const memReturnValues = mem.member.returnValues;
      if (!memReturnValues) {
        continue;
      }

      // NOTE: `ActionIO.returnValues` K:
      for (const key of Object.keys(memReturnValues)) {
        const retValueName = memReturnValues[key];
        if (!retValueName) {
          continue;
        }

        // Check if declared return value exists in TX members.
        const srcVarInfo = mem.actionIO.returnValues.getByName(key);
        if (!srcVarInfo) {
          throw new Error(
            `The return value named "${key}" doesn't exist in member action "${
              mem.actionIO.action
            }", available return values "${mem.actionIO.returnValues.getKeysString()}", got "${JSON.stringify(
              Object.keys(memReturnValues),
            )}"`,
          );
        }

        // Now both value and key are valid.
        crv[retValueName] = {
          typeInfo: new VarInfo(retValueName, srcVarInfo.type, srcVarInfo.value),
          refs: [],
        };

        // Check values referenced by other TX members.
        const memAction = mem.actionIO.action;
        if (memAction instanceof mm.WrapAction) {
          for (const value of Object.values(memAction.__getData().args ?? {})) {
            if (value instanceof mm.ValueRef) {
              const refName = value.firstName;
              const crvRes = crv[refName];
              if (crvRes) {
                crvRes.refs.push(TXMReturnValueSource.reference);
              }
            }
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
        if (value instanceof mm.ValueRef) {
          varRefs.add(value.firstName);
        }
      }
    }

    // Check TX return value refs.
    if (actionData.returnValues) {
      for (const name of actionData.returnValues) {
        const info = crv[name];
        if (!info) {
          throw new Error(`The return value named "${name}" is not declared by any member`);
        }
        info.refs.push(TXMReturnValueSource.returnValue);
        returnValues.add(info.typeInfo);
      }
    }

    const result = new TransactIO(
      dialect,
      action,
      memberIOs,
      funcArgs,
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
