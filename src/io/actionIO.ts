import * as utils from './utils';
import * as dd from 'dd-models';
import VarList from '../lib/varList';

export class ActionIO {
  className: string;
  instanceName: string;
  funcName: string;

  constructor(
    public action: dd.Action,
    public inputVarList: VarList,
    public returnVarList: VarList,
  ) {
    this.className = utils.tableToClsName(action.__table);
    this.instanceName = utils.tableToObjName(action.__table);
    this.funcName = utils.actionToFuncName(action);
  }

  get fullFuncName(): string {
    return `${this.instanceName}.${this.funcName}`;
  }
}
