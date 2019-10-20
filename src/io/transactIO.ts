import * as mm from 'mingru-models';
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
    let lastInsertMember: TransactMemberIO | undefined;
    action.ensureInitialized();
    const memberIOs = members.map((m, idx) => {
      const childAction = m.action;
      const [childTable, childName] = childAction.ensureInitialized();

      // Call actionToIO after initialization
      const io = actionToIO(
        childAction,
        dialect,
        `transaction child index "${idx}"`,
      );

      // This indicates if the member function is generate locally
      // Tmp members are always generated locally
      const isChildFuncPrivate = m.isTemp || action.__table === childTable;
      const callPath = utils.actionCallPath(
        isChildFuncPrivate ? null : childTable.__name,
        childName,
        m.isTemp, // Temp members generated generated locally, thus are always private
      );
      const memberIO = new TransactMemberIO(io, callPath, m.isTemp);
      if (
        childAction.actionType === mm.ActionType.insert &&
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
      dialect,
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

export function transactIO(action: mm.Action, dialect: Dialect): TransactIO {
  const pro = new TransactIOProcessor(action as mm.TransactAction, dialect);
  return pro.convert();
}

registerHanlder(mm.ActionType.transact, transactIO);
