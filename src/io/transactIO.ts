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
    const memberIOs = members.map(m => {
      const io = actionToIO(m.action, dialect);
      const callPath = utils.actionCallPath(m.action, action.__table);
      return new TransactMemberIO(io, callPath);
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

    // returnValues is empty for transact io
    const returnValues = new VarList(
      `Returns of action ${action.__name}`,
      false,
    );

    return new TransactIO(action, memberIOs, funcArgs, execArgs, returnValues);
  }
}

export function transactIO(action: dd.Action, dialect: Dialect): TransactIO {
  const pro = new TransactIOProcessor(action as dd.TransactAction, dialect);
  return pro.convert();
}

registerHanlder(dd.ActionType.transact, transactIO);
