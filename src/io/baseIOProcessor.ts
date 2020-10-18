import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionToIOOptions } from './actionToIOOptions';

export default class BaseIOProcessor {
  constructor(public action: mm.Action, public opt: ActionToIOOptions) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(opt, 'opt');
  }

  mustGetFromTable(): mm.Table {
    const fromTable = this.action.__table || this.opt.contextTable;
    if (!fromTable) {
      throw new Error(`\`fromTable\` is empty, action "${this.action}"`);
    }
    return fromTable;
  }

  mustGetActionName(): string {
    const name = this.action.__name || this.opt.actionName;
    if (!name) {
      throw new Error(`Action name is empty, action "${this.action}"`);
    }
    return name;
  }
}
