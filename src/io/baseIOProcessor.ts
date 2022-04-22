import * as mm from 'mingru-models';
import { ActionToIOOptions } from './actionToIOOptions.js';

export default class BaseIOProcessor {
  get configurableTableName(): string | undefined {
    // If `SQLTable` is present (likely `.from` being called in TX),
    // Ignore `opt.configurableTableName`, the from table is not
    // configurable anymore.
    if (this.action.__getData().sqlTable) {
      return undefined;
    }
    return this.opt.configurableTableName;
  }

  constructor(public action: mm.Action, public opt: ActionToIOOptions) {}

  mustGetAvailableSQLTable(): mm.Table {
    const table = this.action.__mustGetAvailableSQLTable(this.opt.outerGroupTable);
    return table;
  }

  mustGetGroupTable(): mm.Table {
    const table = this.action.__getData().groupTable || this.opt.outerGroupTable;
    if (!table) {
      throw new Error(`No available group tables, action "${this.action}"`);
    }
    return table;
  }

  mustGetActionName(): string {
    const name = this.action.__getData().name || this.opt.outerActionName;
    if (!name) {
      throw new Error(`Action name is empty, action "${this.action}"`);
    }
    return name;
  }
}
