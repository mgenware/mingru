import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { ActionToIOOptions } from './actionToIOOptions';

export default class BaseIOProcessor {
  constructor(public action: mm.Action, public opt: ActionToIOOptions) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(opt, 'opt');
  }
}
