import VarInfo from './varInfo';
import { ActionIO } from '../io/common';

export class ActionResult {
  constructor(
    public io: ActionIO,
    public code: string,
    public returnTypes: string[],
    public params: VarInfo[],
  ) {}
}
