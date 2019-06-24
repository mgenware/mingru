import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import actionToIO, { registerHanlder } from './actionToIO';
import * as utils from './utils';
import * as defs from '../defs';

export class TransactMemberIO {
  constructor(public actionIO: ActionIO, public callPath: string) {}
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
    const memberIOs = members.map(m => {
      const mAction = m.action;
      const io = actionToIO(mAction, dialect);
      const callPath = utils.actionCallPath(mAction, action.__table);
      const memberIO = new TransactMemberIO(io, callPath);
      if (
        mAction.actionType === dd.ActionType.insert &&
        (mAction as dd.InsertAction).fetchInsertedID
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
