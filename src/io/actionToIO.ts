import * as mm from 'mingru-models';
import { ActionIO } from './actionIO';
import Dialect from '../dialect';
import { throwIfFalsy } from 'throw-if-arg-empty';

export type HandlerType = (action: mm.Action, dialect: Dialect) => ActionIO;

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
  dialect: Dialect,
  dlgMsg: string,
): ActionIO {
  try {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');

    const handler = handlers.get(action.actionType);
    if (!handler) {
      throw new Error(
        `The type "${action.actionType}" is not supported in actionToIO`,
      );
    }
    return handler(action, dialect);
  } catch (err) {
    if (err.message) {
      err.message += ` [${dlgMsg}]`;
    }
    throw err;
  }
}

export default actionToIO;
