import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import actionToIO, { registerHandler } from './actionToIO';
import * as utils from '../lib/stringUtils';
import * as defs from '../defs';
import VarInfo from '../lib/varInfo';
import BaseIOProcessor from './baseIOProcessor';
import { ActionToIOOptions } from './actionToIOOptions';

export class TransactMemberIO {
  constructor(
    public member: mm.TransactionMember,
    public assignedName: string,
    public actionIO: ActionIO,
    public callPath: string,
  ) {}

  get isInline(): boolean {
    return !this.member.action.__name;
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
    public childReturnValues: { [name: string]: TXMReturnValueInfo },
  ) {
    super(dialect, transactAction, null, funcArgs, execArgs, returnValues);
    throwIfFalsy(transactAction, 'transactAction');
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
    const parentName = action.mustGetName();
    const parentTable = action.mustGetTable();
    const { dialect } = opt;
    const { members } = action;
    const memberIOs = members.map((mem, idx) => {
      const childAction = mem.action;
      const childTable = childAction.__table || parentTable;
      const childName = childAction.__name || mem.name || `${parentName}Child${idx + 1}`;

      const io = actionToIO(
        childAction,
        { ...opt, contextTable: action.mustGetTable(), actionName: childName },
        `transaction child index ${idx}`,
      );

      // `isMemberSibling` describes if this member and current TX action
      // belong to the same parent.
      const isMemberInline = !mem.action.__name;
      const isMemberSibling = isMemberInline || action.__table === childTable;
      const callPath = utils.actionCallPath(
        isMemberSibling ? null : childTable.__name,
        childName,
        isMemberInline,
      );
      return new TransactMemberIO(mem, childName, io, callPath);
    });

    // funcArgs
    const funcArgs = new VarList(`Func args of action "${action.__name}"`, true);
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
    const execArgs = new VarList(`Exec args of action "${action.__name}"`, true);

    const returnValues = new VarList(`Return values of action ${action.__name}`, false);

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
    const crv: { [name: string]: TXMReturnValueInfo } = {};
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

        // Check if declared return value exists in TX members.
        const srcVarInfo = mem.actionIO.returnValues.getByName(key);
        if (!srcVarInfo) {
          throw new Error(
            `The return value named "${key}" doesn't exist in member action "${
              mem.actionIO.action
            }", available keys "${mem.actionIO.returnValues.getKeysString()}"`,
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
          for (const value of Object.values(memAction.args)) {
            if (value instanceof mm.ValueRef) {
              const refName = value.firstName;
              if (crv[refName]) {
                crv[refName].refs.push(TXMReturnValueSource.reference);
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
      const argValues = Object.values((memberAction as mm.WrapAction).args);
      for (const value of argValues) {
        if (value instanceof mm.ValueRef) {
          varRefs.add(value.firstName);
        }
      }
    }

    // Check TX return value refs.
    if (action.__returnValues) {
      for (const name of action.__returnValues) {
        if (!crv[name]) {
          throw new Error(`The return value named "${name}" is not declared by any member`);
        }
        const info = crv[name];
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
