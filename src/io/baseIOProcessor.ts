import * as mm from 'mingru-models';
import * as defs from '../def/defs.js';
import { ParamList } from '../lib/varList.js';
import { VarDef } from '../lib/varInfo.js';
import { ActionToIOOptions } from './actionToIOOptions.js';

export default class BaseIOProcessor<T extends mm.Action> {
  get configurableTableName(): string | undefined {
    const ad = this.action.__getData();
    if (ad.sqlTable) {
      if (ad.sqlTable.__getData().tableParam) {
        return defs.tableParamName(ad.sqlTable);
      }
      // `sqlTable` is present (likely a tmp action in a transaction).
      // Not a table param even through its group table can be a table param.
      return undefined;
    }
    const gt = this.mustGetAvailableSQLTable();
    if (gt.__getData().tableParam) {
      return defs.tableParamName(gt);
    }
    return undefined;
  }

  constructor(public action: T, public opt: ActionToIOOptions) {}

  // Use this instead of `__mustGetAvailableSQLTable` to take `opt.outerGroupTable` into account.
  mustGetAvailableSQLTable() {
    return this.action.__mustGetAvailableSQLTable(this.opt.outerGroupTable);
  }

  // eslint-disable-next-line class-methods-use-this
  hoiseTableParams(pl: ParamList) {
    const { list } = pl;
    const tableParams: VarDef[] = [];
    const othParams: VarDef[] = [];
    for (const vd of list) {
      if (vd.type === defs.dbxTableType) {
        tableParams.push(vd);
      } else {
        othParams.push(vd);
      }
    }
    if (!tableParams.length) {
      // No table params hoisted.
      return pl;
    }
    // Re-create a new list.
    const res = new ParamList(pl.name);
    for (const tp of tableParams) {
      res.add(tp);
    }
    for (const op of othParams) {
      res.add(op);
    }
    return res;
  }
}
