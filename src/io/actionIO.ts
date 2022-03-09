import * as mm from 'mingru-models';
import VarList from '../lib/varList.js';
import { VarInfo } from '../lib/varInfo.js';
import { Dialect, StringSegment } from '../dialect.js';
import { VarInfoBuilder } from '../lib/varInfoHelper.js';
import { makeStringFromSegments } from '../build/goCodeUtil.js';
import * as defs from '../def/defs.js';

export class ActionIO {
  funcStubs: VarInfo[];

  constructor(
    public dialect: Dialect,
    public action: mm.Action,
    public sql: StringSegment[] | null,
    public funcArgs: VarList,
    public execArgs: VarList,
    // NOTE: `returnValues` doesn't contain the last error param.
    public returnValues: VarList,
    // True if first func param is `sql.DB`. Otherwise, `mingru.Queryable`.
    public isDBArgSQLDB: boolean,
  ) {
    const { argStubs } = action.__getData();
    this.funcStubs = (argStubs ?? []).map((v) => VarInfoBuilder.fromSQLVar(v, dialect));
  }

  getSQLCode(): string {
    if (this.sql) {
      return makeStringFromSegments(this.sql);
    }
    return '';
  }

  dbArgVarInfo() {
    return this.isDBArgSQLDB ? defs.sqlDBVar : defs.dbxQueryableVar;
  }
}
