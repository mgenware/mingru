import VarInfo from './varInfo';
import { ActionIO } from '../io/common';

export class ActionResult {
  constructor(
    public io: ActionIO,
    public name: string,
    public code: string,
    public returnTypes: string[],
    public params: VarInfo[],
  ) {}
}
