import * as utils from './utils';
import * as dd from 'dd-models';
import VarList from '../lib/varList';
import { throwIfFalsy } from 'throw-if-arg-empty';

export class ActionIO {
  funcName: string = '';

  constructor(
    public action: dd.Action,
    public funcArgs: VarList,
    public execArgs: VarList,
    public returnValues: VarList,
  ) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(funcArgs, 'funcArgs');
    throwIfFalsy(execArgs, 'execArgs');
    throwIfFalsy(returnValues, 'returnValues');

    if (!action.__table) {
      throw new Error(`Action not initialized`);
    }

    // action can be a temporary wrapped action as a member of a transaction, which doesn't have a valid name.
    const actionName = action.__name;
    if (actionName) {
      this.funcName = utils.actionPascalName(actionName);
    }
  }
}
