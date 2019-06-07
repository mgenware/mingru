import * as utils from './utils';
import * as dd from 'dd-models';
import SQLVariableList from './sqlInputList';

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
