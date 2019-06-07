import VarInfo from './varInfo';
import { ActionIO } from '../io/actionIO';

export class ActionResult {
  constructor(
    public io: ActionIO,
    public code: string,
    public returnTypes: string[],
    public params: VarInfo[],
  ) {}
}
