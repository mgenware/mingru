import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as utils from '../lib/stringUtils';
import { ActionIO } from './actionIO';
import actionToIO from './actionToIO';

// IO object for TA(Tabla actions)
export class TAIO {
  actions: ActionIO[];
  className: string;
  instanceName: string;

  constructor(public ta: mm.TableActions, public dialect: Dialect) {
    throwIfFalsy(ta, 'ta');

    const actions: ActionIO[] = [];
    mm.enumerateActions(
      ta,
      (action, prop) => {
        actions.push(actionToIO(action, dialect, `action "${prop}"`));
      },
      { sorted: true },
    );
    this.actions = actions;

    if (!ta.__table) {
      throw new Error('Table action group is not initialized');
    }
    this.className = utils.tableTypeName(ta.__table.__name);
    this.instanceName = utils.tablePascalName(ta.__table.__name);
  }
}
