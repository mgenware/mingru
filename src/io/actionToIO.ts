import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionIO } from './actionIO';
import { ActionToIOOptions } from './actionToIOOptions';

export type HandlerType = (action: mm.Action, opt: ActionToIOOptions) => ActionIO;

const handlers = new Map<number, HandlerType>();

export function registerHandler(type: mm.ActionType, handler: HandlerType) {
  throwIfFalsy(handler, 'handlers');
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
    throwIfFalsy(action, 'action');
    throwIfFalsy(opt, 'opt');

    const handler = handlers.get(action.actionType);
    if (!handler) {
      throw new Error(`The type "${action.actionType}" is not supported in actionToIO`);
    }
    return handler(action, opt);
  } catch (err) {
    if (err.message) {
      err.message += ` [${descMsg}]`;
    }
    throw err;
  }
}

export default actionToIO;
