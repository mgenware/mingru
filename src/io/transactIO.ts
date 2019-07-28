import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import actionToIO, { registerHanlder } from './actionToIO';
import * as utils from './utils';
import * as defs from '../defs';
import { InsertIO } from './insertIO';

export class TransactMemberIO {
  constructor(
    public actionIO: ActionIO,
    public callPath: string,
    public isTemp: boolean,
  ) {}
}

export class TransactIO extends ActionIO {
  lastInsertedMember?: TransactMemberIO;

  constructor(
    public action: dd.TransactAction,
    public memberIOs: TransactMemberIO[],
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
  ) {
    super(action, funcArgs, execArgs, returnValues);
    throwIfFalsy(action, 'action');
  }
}

class TransactIOProcessor {
  constructor(public action: dd.TransactAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): TransactIO {
    const { action, dialect } = this;
    const { members } = action;
    let lastInsertMember: TransactMemberIO | undefined;
    const outerActionName = action.__name;
    const outerActionTable = action.__table;
    if (!outerActionName || !outerActionTable) {
      throw new Error('Action not initialized');
    }
    const memberIOs = members.map((m, idx) => {
      const mAction = m.action;
      if (!mAction.__table || !mAction.__name) {
        throw new Error('Unexpected error, member action is not initialized');
      }
      const memberActionTable = mAction.__table;
      const memberActionName = mAction.__name;

      // Call actionToIO after initialization
      const io = actionToIO(
        mAction,
        dialect,
        `transaction child index "${idx}"`,
      );

      const callPath = utils.actionCallPath(
        action.__table === mAction.__table ? null : memberActionTable.__name,
        memberActionName,
        m.isTemp ? true : false, // Temp member func is generated as private member
      );
      const memberIO = new TransactMemberIO(io, callPath, m.isTemp);
      if (
        mAction.actionType === dd.ActionType.insert &&
        (memberIO.actionIO as InsertIO).fetchInsertedID
      ) {
        lastInsertMember = memberIO;
      }
      return memberIO;
    });

    // funcArgs
    const funcArgs = new VarList(
      `Func args of action "${action.__name}"`,
      true,
    );
    funcArgs.add(defs.sqlDBVar);
    for (const m of memberIOs) {
      const mAction = m.actionIO;
      // Skip the first param of member functions, which is dbx.Queryable
      for (const v of mAction.funcArgs.list.slice(1)) {
        funcArgs.add(v);
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
    if (lastInsertMember) {
      returnValues.add(defs.insertedIDVar);
    }

    const result = new TransactIO(
      action,
      memberIOs,
      funcArgs,
      execArgs,
      returnValues,
    );
    result.lastInsertedMember = lastInsertMember;
    return result;
  }
}

export function transactIO(action: dd.Action, dialect: Dialect): TransactIO {
  const pro = new TransactIOProcessor(action as dd.TransactAction, dialect);
  return pro.convert();
}

registerHanlder(dd.ActionType.transact, transactIO);
