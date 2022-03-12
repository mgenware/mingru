import * as mm from 'mingru-models';
import { ParamList, ValueList } from '../lib/varList.js';
import { VarDef } from '../main.js';
import { Dialect, StringSegment } from '../dialect.js';
import { VarDefBuilder } from '../lib/varInfoHelper.js';
import { makeStringFromSegments } from '../build/goCodeUtil.js';
import * as defs from '../def/defs.js';

export class ActionIO {
  funcStubs: VarDef[];

  constructor(
    public dialect: Dialect,
    public action: mm.Action,
    public sql: StringSegment[] | null,
    public funcArgs: ParamList,
    public execArgs: ValueList,
    // NOTE: `returnValues` doesn't contain the last error param.
    public returnValues: ParamList,
    // True if first func param is `sql.DB`. Otherwise, `mingru.Queryable`.
    public isDBArgSQLDB: boolean,
  ) {
    const { argStubs } = action.__getData();
    this.funcStubs = (argStubs ?? []).map((v) => VarDefBuilder.fromSQLVar(v, dialect));
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
