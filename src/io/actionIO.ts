import * as utils from './utils';
import * as mm from 'mingru-models';
import VarList from '../lib/varList';
import { throwIfFalsy } from 'throw-if-arg-empty';
import VarInfo from '../lib/varInfo';
import Dialect from '../dialect';

export class ActionIO {
  table: mm.Table;
  funcName = '';
  funcStubs: VarInfo[];

  constructor(
    public dialect: Dialect,
    public action: mm.Action,
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
    this.table = action.__table;

    // action can be a temporary wrapped action as a member of a transaction, which doesn't have a valid name.
    const actionName = action.__name;
    if (actionName) {
      this.funcName = utils.actionPascalName(actionName);
    }

    this.funcStubs = action.__argStubs.map(v => VarInfo.fromSQLVar(v, dialect));
  }
}
