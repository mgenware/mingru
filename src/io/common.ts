import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import SQLVariableList from './sqlInputList';
import Dialect from '../dialect';
import { SQLIO } from './sqlIO';
import * as utils from './utils';
import { selectIO } from './selectIO';
import { updateIO } from './updateIO';
import { insertIO } from './insertIO';
import { deleteIO } from './deleteIO';

export class ActionIO {
  className: string;
  instanceName: string;
  funcName: string;

  constructor(public action: dd.Action) {
    this.className = utils.tableToClsName(action.__table);
    this.instanceName = utils.tableToObjName(action.__table);
    this.funcName = utils.actionToFuncName(action);
  }

  get fullFuncName(): string {
    return `${this.instanceName}.${this.funcName}`;
  }

  getInputs(): SQLVariableList {
    throw new Error('Not implemented yet');
  }

  getReturns(): SQLVariableList {
    throw new Error('Not implemented yet');
  }
}

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

      default:
        throw new Error(
          `Unsupported action type "${action.actionType}" in TAIO.actionToIO`,
        );
    }
  }
}

export class SetterIO {
  static fromMap(map: Map<dd.Column, dd.SQL>): SetterIO[] {
    return Array.from(
      map,
      ([key, value]) => new SetterIO(key, new SQLIO(value)),
    );
  }

  constructor(public col: dd.Column, public sql: SQLIO) {
    throwIfFalsy(col, 'col');
    throwIfFalsy(sql, 'sql');
  }
}

export function settersToInputs(setters: SetterIO[]): SQLVariableList {
  // Set inputs
  const inputs = new SQLVariableList();
  // Merge setter inputs
  for (const setter of setters) {
    if (setter.sql.inputs.length) {
      inputs.merge(setter.sql.inputs);
    }
  }
  inputs.seal();
  return inputs;
}
