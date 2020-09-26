import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as utils from '../lib/stringUtils';
import VarList from '../lib/varList';
import VarInfo from '../lib/varInfo';
import Dialect, { StringSegment } from '../dialect';
import { VarInfoBuilder } from '../lib/varInfoHelper';
import { makeStringFromSegments } from '../build/goCode';

export class ActionIO {
  table: mm.Table;
  funcName = '';
  funcStubs: VarInfo[];

  constructor(
    public dialect: Dialect,
    public action: mm.Action,
    public sql: StringSegment[] | null,
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

    this.funcStubs = action.__argStubs.map((v) => VarInfoBuilder.fromSQLVar(v, dialect));
  }

  getSQLCode(): string {
    if (this.sql) {
      return makeStringFromSegments(this.sql);
    }
    return '';
  }
}
