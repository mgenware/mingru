import * as mm from 'mingru-models';
import { fromTableParamName } from './def/pub.js';

export function wrapActionWithFromTableParam(action: mm.Action, table: mm.Table) {
  return action.wrap({ [fromTableParamName]: table });
}
