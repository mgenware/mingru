import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionToIOOptions } from './actionToIOOptions';

export default class BaseIOProcessor {
  constructor(public action: mm.Action, public opt: ActionToIOOptions) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(opt, 'opt');
  }

  mustGetAvailableSQLTable(): mm.Table {
    const table = this.action.mustGetAvailableSQLTable(this.opt.groupTable);
    if (!table) {
      throw new Error(`No available SQL tables, action "${this.action}"`);
    }
    return table;
  }

  mustGetGroupTable(): mm.Table {
    const table = this.action.__groupTable || this.opt.groupTable;
    if (!table) {
      throw new Error(`No available group tables, action "${this.action}"`);
    }
    return table;
  }

  mustGetActionName(): string {
    const name = this.action.__name || this.opt.actionName;
    if (!name) {
      throw new Error(`Action name is empty, action "${this.action}"`);
    }
    return name;
  }

  isFromTableInput(): boolean {
    const { action, opt } = this;
    return !!(opt.unsafeTableInput && action.__groupTable && !action.__sqlTable);
  }
}
