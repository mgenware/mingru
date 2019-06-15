import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { selectIO } from './selectIO';
import Dialect from '../dialect';
import { insertIO } from './insertIO';
import { updateIO } from './updateIO';
import { deleteIO } from './deleteIO';
import { ActionIO } from './actionIO';
import VarList from '../lib/varList';
import VarInfo, { TypeInfo } from '../lib/varInfo';
import * as utils from './utils';

export class WrapIO extends ActionIO {
  constructor(
    public action: dd.WrappedAction,
    public innerIO: ActionIO,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
    public funcPath: string,
  ) {
    super(action, funcArgs, execArgs, returnValues);
    throwIfFalsy(action, 'action');
  }
}

class WrapIOProcessor {
  constructor(public action: dd.WrappedAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): WrapIO {
    const { action, dialect } = this;
    let innerIO: ActionIO;
    const innerAction = action.action;
    switch (innerAction.actionType) {
      case dd.ActionType.select: {
        innerIO = selectIO(innerAction as dd.SelectAction, dialect);
        break;
      }

      case dd.ActionType.insert: {
        innerIO = insertIO(innerAction as dd.InsertAction, dialect);
        break;
      }

      case dd.ActionType.update: {
        innerIO = updateIO(innerAction as dd.UpdateAction, dialect);
        break;
      }

      case dd.ActionType.delete: {
        innerIO = deleteIO(innerAction as dd.DeleteAction, dialect);
        break;
      }

      case dd.ActionType.wrap: {
        innerIO = wrapIO(innerAction as dd.WrappedAction, dialect);
        break;
      }

      default: {
        throw new Error(
          `Not supported action type "${
            innerAction.actionType
          }" inside toWrapIO`,
        );
      }
    }

    const { args } = action;
    // Throw on non-existing argument names
    const innerFuncArgs = innerIO.funcArgs;
    const innerExecArgs = innerIO.execArgs;
    for (const key of Object.keys(args)) {
      if (!innerFuncArgs.getByName(key)) {
        throw new Error(
          `The argument "${key}" doesn't exist in action "${action.__name}"`,
        );
      }
    }
    // funcArgs
    const funcArgs = new VarList(
      `Func args of action "${action.__name}"`,
      true,
    );
    for (const v of innerFuncArgs.list) {
      if (!args[v.name]) {
        funcArgs.add(v);
      }
    }
    // execArgs
    const execArgs = new VarList(
      `Exec args of action "${action.__name}"`,
      true,
    );
    // Pass the queryable param
    execArgs.add(new VarInfo('queryable', new TypeInfo('dbx.Queryable')));
    for (const v of innerExecArgs.list) {
      if (args[v.name]) {
        // Replace the variable with a value
        execArgs.add(VarInfo.withValue(v, args[v.name] as string));
      } else {
        execArgs.add(v);
      }
    }

    let funcPath = utils.actionToFuncName(innerAction);
    if (innerAction.__table !== action.__table) {
      funcPath = utils.tableToObjName(innerAction.__table) + '.' + funcPath;
    } else {
      funcPath = 'da.' + funcPath;
    }

    return new WrapIO(
      action,
      innerIO,
      funcArgs,
      execArgs,
      innerIO.returnValues,
      funcPath,
    );
  }
}

export function wrapIO(action: dd.WrappedAction, dialect: Dialect): WrapIO {
  const pro = new WrapIOProcessor(action, dialect);
  return pro.convert();
}
