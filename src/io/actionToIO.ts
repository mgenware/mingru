import * as mm from 'mingru-models';
import mustBeErr from 'must-be-err';
import { ActionIO } from './actionIO.js';
import { ActionToIOOptions } from './actionToIOOptions.js';
import { AGInfo } from './agInfo.js';

export type HandlerType = (agInfo: AGInfo, action: mm.Action, opt: ActionToIOOptions) => ActionIO;

const handlers = new Map<number, HandlerType>();

export function registerHandler(type: mm.ActionType, handler: HandlerType) {
  if (handlers.has(type)) {
    throw new Error(`The type "${type}" has been registered`);
  }
  handlers.set(type, handler);
}

const actionToIOCache = new Map<mm.Action, ActionIO>();
const agToAGInfoCache = new Map<mm.ActionGroup, AGInfo>();

export function actionToIO(
  action: mm.Action,
  opt: ActionToIOOptions,
  descMsg: string, // used for debugging / logging purposes.
): ActionIO {
  try {
    const cached = actionToIOCache.get(action);
    if (cached) {
      return cached;
    }
    const { actionType } = action.__getData();
    if (actionType === undefined) {
      throw new Error(`Unexpected undefined action type on action "${action}"`);
    }
    const handler = handlers.get(actionType);
    if (!handler) {
      throw new Error(`The type "${actionType}" is not supported in actionToIO`);
    }

    const ag = action.__mustGetActionGroup();
    let agInfo: AGInfo;
    const cachedAGInfo = agToAGInfoCache.get(ag);
    if (cachedAGInfo) {
      agInfo = cachedAGInfo;
    } else {
      agInfo = new AGInfo(ag);
      agToAGInfoCache.set(ag, agInfo);
    }
    const result = handler(agInfo, action, opt);
    actionToIOCache.set(action, result);
    return result;
  } catch (err) {
    mustBeErr(err);
    err.message += ` [${descMsg}]`;
    throw err;
  }
}

export default actionToIO;
