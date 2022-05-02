import * as mm from 'mingru-models';
import { ActionIO } from './actionIO.js';
import actionToIO from './actionToIO.js';
import { ActionToIOOptions } from './actionToIOOptions.js';
import { AGInfo } from './agInfo.js';

// IO object for AG(action group).
export class AGIO {
  actionIOs: ActionIO[];
  agInfo: AGInfo;

  constructor(public ag: mm.ActionGroup, public opt: ActionToIOOptions) {
    this.agInfo = AGInfo.fromAG(ag);
    const agData = ag.__getData();
    const agTable = agData.groupTable;
    const agTableName = agTable.__getData().name;
    // Actions are sorted alphabetically.
    this.actionIOs = Object.entries(agData.actions)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([actionName, action]) => {
        if (!action) {
          throw new Error(`Unexpected undefined action in action group "${ag}"`);
        }
        return actionToIO(action, opt, `action "${agTableName}.${actionName}"`);
      });
  }
}
