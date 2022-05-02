import * as mm from 'mingru-models';
import * as su from '../lib/stringUtils.js';
import { ActionToIOOptions } from './actionToIOOptions.js';

export default class BaseIOProcessor {
  get configurableTableName(): string | undefined {
    const ad = this.action.__getData();
    if (ad.sqlTable && ad.sqlTable.__getData().tableParam) {
      return su.toCamelCase(ad.sqlTable.__getData().name);
    }
    if (ad.groupTable && ad.groupTable.__getData().tableParam) {
      return su.toCamelCase(ad.groupTable.__getData().name);
    }
    return undefined;
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
