import * as mm from 'mingru-models';
import * as defs from '../def/defs.js';
import { ActionIO } from './actionIO.js';
import { actionToIO } from './actionToIO.js';
import { ActionToIOOptions } from './actionToIOOptions.js';

// IO object for AG(action group).
export class AGIO {
  actionIOs: ActionIO[];

  // The name of generated table type.
  className: string;

  // The name of generated table instance.
  instanceName: string;

  // Table name in database.
  tableDBName: string;

  constructor(public ag: mm.ActionGroup, public opt: ActionToIOOptions) {
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

    const agName = defs.agName(ag);
    this.className = `${agName}AGType`;
    this.instanceName = agName;
    this.tableDBName = agTable.__getDBName();
  }
}
