import * as mm from 'mingru-models';
import * as defs from '../def/defs.js';

// AG info shared by both `AGIO` and `ActionIO`.
export class AGInfo {
  instanceName: string;
  className: string;

  constructor(public ag: mm.ActionGroup) {
    this.instanceName = defs.agInstanceName(ag);
    this.className = `${this.instanceName}AGType`;
  }
}
