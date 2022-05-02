import * as mm from 'mingru-models';
import { ActionIO } from './actionIO.js';
import { AGInfo } from './agInfo.js';

export const actionToIOCache = new Map<mm.Action, ActionIO>();
export const agToAGInfoCache = new Map<mm.ActionGroup, AGInfo>();
