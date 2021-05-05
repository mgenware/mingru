import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import VarList from '../lib/varList.js';
import { VarInfo } from '../lib/varInfo.js';
import { Dialect, StringSegment } from '../dialect.js';
import { VarInfoBuilder } from '../lib/varInfoHelper.js';
import { makeStringFromSegments } from '../build/goCode.js';

export class ActionIO {
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

    const { argStubs } = action.__getData();
    this.funcStubs = (argStubs ?? []).map((v) => VarInfoBuilder.fromSQLVar(v, dialect));
  }

  getSQLCode(): string {
    if (this.sql) {
      return makeStringFromSegments(this.sql);
    }
    return '';
  }
}
