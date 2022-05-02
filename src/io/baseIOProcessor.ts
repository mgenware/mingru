import * as mm from 'mingru-models';
import * as su from '../lib/stringUtils.js';
import { ActionToIOOptions } from './actionToIOOptions.js';
import { AGInfo } from './agInfo.js';

export default class BaseIOProcessor<T extends mm.Action> {
  get configurableTableName(): string | undefined {
    const ad = this.action.__getData();
    if (ad.sqlTable && ad.sqlTable.__getData().tableParam) {
      return su.toCamelCase(ad.sqlTable.__getData().name);
    }
    const gt = this.groupTable();
    if (gt?.__getData().tableParam) {
      return su.toCamelCase(gt.__getData().name);
    }
    return undefined;
  }

  constructor(public agInfo: AGInfo, public action: T, public opt: ActionToIOOptions) {}

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
