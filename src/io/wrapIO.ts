import { ActionIO } from './common';
import SQLVariableList from './sqlInputList';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { selectIO } from './selectIO';
import Dialect from '../dialect';
import { insertIO } from './insertIO';
import { updateIO } from './updateIO';
import { deleteIO } from './deleteIO';

export class WrapIO extends ActionIO {
  inputs: SQLVariableList;
  innerIO: ActionIO;

  constructor(public action: dd.WrappedAction, dialect: Dialect) {
    super(action);
    throwIfFalsy(action, 'action');

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

      default: {
        throw new Error(
          `Not supported action type "${
            innerAction.actionType
          }" inside toWrapIO`,
        );
      }
    }
    this.innerIO = innerIO;

    const { args } = action;
    // Throw on non-existing argument names
    const inputs = innerIO.getInputs();
    for (const key of Object.keys(args)) {
      if (!inputs.getByName(key)) {
        throw new Error(
          `The argument "${key}" doesn't exist in action "${action.__name}"`,
        );
      }
    }
    // Populate new inputs
    const newInputs = new SQLVariableList();
    for (const input of inputs.list) {
      if (!args[input.name]) {
        newInputs.add(input);
      }
    }
    this.inputs = newInputs;
  }

  getInputs(): SQLVariableList {
    return this.inputs;
  }
}
