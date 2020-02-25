import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import actionToIO, { registerHandler } from './actionToIO';
import * as utils from './utils';
import * as defs from '../defs';
import VarInfo from '../lib/varInfo';

export class TransactMemberIO {
  constructor(
    public actionIO: ActionIO,
    public callPath: string,
    public isTemp: boolean,
    public declaredReturnValues?: { [name: string]: string },
  ) {}

  toString(): string {
    return `TransactMemberIO(${this.actionIO.action}, ${this.callPath}, ${
      this.isTemp
    }, ${JSON.stringify(this.declaredReturnValues)})`;
  }
}

export class TransactIO extends ActionIO {
  constructor(
    dialect: Dialect,
    public action: mm.TransactAction,
    public memberIOs: TransactMemberIO[],
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
  ) {
    super(dialect, action, funcArgs, execArgs, returnValues);
    throwIfFalsy(action, 'action');
  }
}

class TransactIOProcessor {
  constructor(public action: mm.TransactAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): TransactIO {
    const { action, dialect } = this;
    const { members } = action;
    action.ensureInitialized();
    const memberIOs = members.map((mem, idx) => {
      const childAction = mem.action;
      const [childTable, childName] = childAction.ensureInitialized();

      // Call actionToIO after initialization.
      const io = actionToIO(
        childAction,
        dialect,
        `transaction child index ${idx}`,
      );

      // `isMemberSibling` describes if this member and current TX action
      // belong to same parent.
      const isMemberSibling = mem.isTemp || action.__table === childTable;
      const callPath = utils.actionCallPath(
        isMemberSibling ? null : childTable.__name,
        childName,
        mem.isTemp,
      );
      return new TransactMemberIO(io, callPath, mem.isTemp, mem.returnValues);
    });

    // funcArgs
    const funcArgs = new VarList(
      `Func args of action "${action.__name}"`,
      true,
    );
    funcArgs.add(defs.sqlDBVar);
    for (const mem of memberIOs) {
      const mAction = mem.actionIO;
      // Skip the first param of all member functions, which is dbx.Queryable.
      for (const v of mAction.funcArgs.list.slice(1)) {
        if (!v.isRef) {
          // See `isRef` for details
          funcArgs.add(v);
        }
      }
    }
    // execArgs is empty for transact io
    const execArgs = new VarList(
      `Exec args of action "${action.__name}"`,
      true,
    );

    const returnValues = new VarList(
      `Returns of action ${action.__name}`,
      false,
    );

    // Collecting all declared return values from members.
    // K: declared value name, V: source info (original var info in action return list).
    const declaredReturnValues: { [name: string]: VarInfo } = {};
    for (const mem of memberIOs) {
      if (!mem.declaredReturnValues) {
        continue;
      }
      for (const key of Object.keys(mem.declaredReturnValues)) {
        const value = mem.declaredReturnValues[key];
        // Checking if this value has been declared.
        // declaredReturnValues stores things in reverse order, declared value as key.
        if (declaredReturnValues[value]) {
          throw new Error(`The return value "${value}" has been declared`);
        }

        // Try fetching the return value info in action return list.
        const srcVarInfo = mem.actionIO.returnValues.getByName(key);
        if (!srcVarInfo) {
          throw new Error(
            `The return value "${key}" doesn't exist in member action "${
              mem.actionIO.action
            }", available keys "${mem.actionIO.returnValues.getKeysString()}"`,
          );
        }

        // Now both value and key are valid.
        declaredReturnValues[value] = new VarInfo(
          value,
          srcVarInfo.type,
          srcVarInfo.value,
        );
      }
    }

    if (action.__returnValues) {
      for (const name of action.__returnValues) {
        if (!declaredReturnValues[name]) {
          throw new Error(
            `The return value "${name}" is not declared by any member`,
          );
        }
        returnValues.add(declaredReturnValues[name]);
      }
    }

    const result = new TransactIO(
      dialect,
      action,
      memberIOs,
      funcArgs,
      execArgs,
      returnValues,
    );
    return result;
  }
}

export function transactIO(action: mm.Action, dialect: Dialect): TransactIO {
  const pro = new TransactIOProcessor(action as mm.TransactAction, dialect);
  return pro.convert();
}

registerHandler(mm.ActionType.transact, transactIO);
