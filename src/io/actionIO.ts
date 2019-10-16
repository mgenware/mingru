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
    public returnValues: VarList, // `returnValues` doesn't contain the last error param.
  ) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(funcArgs, 'funcArgs');
    throwIfFalsy(execArgs, 'execArgs');
    throwIfFalsy(returnValues, 'returnValues');

    const [table, name] = action.ensureInitialized();
    this.table = table;
    this.funcName = utils.actionPascalName(name);

    this.funcStubs = action.__argStubs.map(v => VarInfo.fromSQLVar(v, dialect));
  }
}
