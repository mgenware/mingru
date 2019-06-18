import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as utils from './utils';
import { ActionIO } from './actionIO';
import actionToIO from './actionToIO';

// IO object for TA(Tabla actions)
export class TAIO {
  actions: ActionIO[];
  className: string;
  instanceName: string;

  constructor(public ta: dd.TA, public dialect: Dialect) {
    throwIfFalsy(ta, 'ta');

    const actions: ActionIO[] = [];
    dd.enumerateActions(
      ta,
      action => {
        actions.push(actionToIO(action, dialect));
      },
      { sorted: true },
    );
    this.actions = actions;

    this.className = utils.tableToClsName(ta.__table);
    this.instanceName = utils.tableToObjName(ta.__table);
  }
}
