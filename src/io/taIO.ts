import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as utils from './utils';
import { selectIO } from './selectIO';
import { updateIO } from './updateIO';
import { insertIO } from './insertIO';
import { deleteIO } from './deleteIO';
import { ActionIO } from './actionIO';
import { wrapIO } from './wrapIO';

// IO object for TA(Tabla actions)
export class TAIO {
  actions: ActionIO[];
  className: string;
  instanceName: string;

  constructor(public ta: dd.TA, public dialect: Dialect) {
    throwIfFalsy(ta, 'ta');

    const actions: ActionIO[] = [];
    dd.enumerateActions(
      ta,
      action => {
        actions.push(this.actionToIO(action, dialect));
      },
      { sorted: true },
    );
    this.actions = actions;

    this.className = utils.tableToClsName(ta.__table);
    this.instanceName = utils.tableToObjName(ta.__table);
  }

  private actionToIO(action: dd.Action, dialect: Dialect): ActionIO {
    switch (action.actionType) {
      case dd.ActionType.select:
        return selectIO(action as dd.SelectAction, dialect);

      case dd.ActionType.update:
        return updateIO(action as dd.UpdateAction, dialect);

      case dd.ActionType.insert:
        return insertIO(action as dd.InsertAction, dialect);

      case dd.ActionType.delete:
        return deleteIO(action as dd.DeleteAction, dialect);

      case dd.ActionType.wrap:
        return wrapIO(action as dd.WrappedAction, dialect);

      default:
        throw new Error(
          `Unsupported action type "${action.actionType}" in TAIO.actionToIO`,
        );
    }
  }
}
