import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionToIOOptions } from './actionToIOOptions.js';

export default class BaseIOProcessor {
  constructor(public action: mm.Action, public opt: ActionToIOOptions) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(opt, 'opt');
  }

  mustGetAvailableSQLTable(): mm.Table {
    const table = this.action.__mustGetAvailableSQLTable(this.opt.groupTable);
    return table;
  }

  mustGetGroupTable(): mm.Table {
    const table = this.action.__getData().groupTable || this.opt.groupTable;
    if (!table) {
      throw new Error(`No available group tables, action "${this.action}"`);
    }
    return table;
  }

  mustGetActionName(): string {
    const name = this.action.__getData().name || this.opt.actionName;
    if (!name) {
      throw new Error(`Action name is empty, action "${this.action}"`);
    }
    return name;
  }

  isFromTableInput(): boolean {
    const { action, opt } = this;
    return !!(
      opt.configurableTable &&
      action.__getData().groupTable &&
      !action.__getData().sqlTable
    );
  }
}
