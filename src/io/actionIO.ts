import * as utils from './utils';
import * as dd from 'dd-models';
import VarList from '../lib/varList';
import { throwIfFalsy } from 'throw-if-arg-empty';

export class ActionIO {
  className: string = '';
  instanceName: string = '';
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

    // action can be a temp wrapped action in a transaction, which doesn't have a table attached.
    if (action.__table) {
      this.className = utils.tableToClsName(action.__table);
      this.instanceName = utils.tableToObjName(action.__table);
      this.funcName = utils.actionToFuncName(action);
    }
  }

  get fullFuncName(): string {
    return `${this.instanceName}.${this.funcName}`;
  }
}
