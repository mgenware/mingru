import * as mm from 'mingru-models';
import mustBeErr from 'must-be-err';
import { ActionIO } from './actionIO.js';
import { ActionToIOOptions } from './actionToIOOptions.js';
import { actionToIOCache } from './cache.js';

export type HandlerType = (action: mm.Action, opt: ActionToIOOptions) => ActionIO;

const handlers = new Map<number, HandlerType>();

export function registerHandler(type: mm.ActionType, handler: HandlerType) {
  if (handlers.has(type)) {
    throw new Error(`The type "${type}" has been registered`);
  }
  handlers.set(type, handler);
}

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

    const result = handler(action, opt);
    actionToIOCache.set(action, result);
    return result;
  } catch (err) {
    mustBeErr(err);
    err.message += ` [${descMsg}]`;
    throw err;
  }
}

export default actionToIO;
