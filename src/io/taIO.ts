import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as utils from '../lib/stringUtils';
import { ActionIO } from './actionIO';
import actionToIO from './actionToIO';
import { ActionToIOOptions } from './actionToIOOptions';

// IO object for TA(Tabla actions)
export class TAIO {
  actionIOs: ActionIO[];
  className: string;
  instanceName: string;

  constructor(public ta: mm.TableActions, public opt: ActionToIOOptions) {
    throwIfFalsy(ta, 'ta');

    // Actions are sorted alphabetically.
    this.actionIOs = Object.entries(ta.__actions)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([actionName, action]) => actionToIO(action, opt, `action "${actionName}"`));

    const taTable = ta.mustGetTable();
    const taTableName = taTable.__name;
    this.className = utils.tableTypeName(taTableName);
    this.instanceName = utils.tablePascalName(taTableName);
  }
}
