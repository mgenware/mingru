import * as mm from 'mingru-models';
import * as defs from '../def/defs.js';
import { agToAGInfoCache } from './cache.js';

// AG info shared by both `AGIO` and `ActionIO`.
export class AGInfo {
  instanceName: string;
  className: string;

  private constructor(public ag: mm.ActionGroup) {
    this.instanceName = defs.agInstanceName(ag);
    this.className = `${this.instanceName}AGType`;
  }

  static fromAG(ag: mm.ActionGroup) {
    let agInfo: AGInfo;
    const cachedAGInfo = agToAGInfoCache.get(ag);
    if (cachedAGInfo) {
      agInfo = cachedAGInfo;
    } else {
      agInfo = new AGInfo(ag);
      agToAGInfoCache.set(ag, agInfo);
    }
    return agInfo;
  }
}
