import * as mm from 'mingru-models';
import * as defs from '../def/defs.js';
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
    const gt = this.groupTable();
    if (gt?.__getData().tableParam) {
      return defs.tableParamName(gt);
    }
    return undefined;
  }

  constructor(public action: T, public opt: ActionToIOOptions) {}

  mustGetAvailableSQLTable(): mm.Table {
    const table = this.action.__mustGetAvailableSQLTable(this.opt.outerGroupTable);
    return table;
  }

  mustGetGroupTable(): mm.Table {
    const gt = this.groupTable();
    if (!gt) {
      throw new Error(`No available group tables in action "${this.action}"`);
    }
    return gt;
  }

  mustGetActionName(): string {
    const name = this.action.__getData().name || this.opt.outerActionName;
    if (!name) {
      throw new Error(`Action name is empty, action "${this.action}"`);
    }
    return name;
  }

  private groupTable() {
    return this.action.__getData().actionGroup?.__getData().groupTable ?? this.opt.outerGroupTable;
  }
}
