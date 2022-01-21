import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as utils from '../lib/stringUtils.js';
import { ActionIO } from './actionIO.js';
import { actionToIO } from './actionToIO.js';
import { ActionToIOOptions } from './actionToIOOptions.js';

// IO object for TA(Tabla actions)
export class TAIO {
  actionIOs: ActionIO[];

  // The name of generated table type.
  className: string;

  // The name of generated table instance.
  instanceName: string;

  // Table name in database.
  tableDBName: string;

  constructor(public ta: mm.TableActions, public opt: ActionToIOOptions) {
    throwIfFalsy(ta, 'ta');
    const taData = ta.__getData();
    const taTable = taData.table;
    const taTableName = taTable.__getData().name;
    const taOpt = taData.options;
    // Actions are sorted alphabetically.
    this.actionIOs = Object.entries(taData.actions)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([actionName, action]) => {
        if (!action) {
          throw new Error(`Unexpected undefined action in table actions "${ta}"`);
        }
        return actionToIO(
          action,
          {
            ...opt,
            unsafeTableInput: taOpt.unsafeTableInput,
          },
          `action "${taTableName}.${actionName}"`,
        );
      });

    this.className = utils.tableTypeName(taTableName);
    this.instanceName = utils.tablePascalName(taTableName);
    this.tableDBName = taTable.__getDBName();
  }
}
