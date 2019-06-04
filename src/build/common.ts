export class ActionResult {
  constructor(
    public name: string,
    public code: string,
    public returnTypes: string[],
    public params: VarInfo[],
  ) {}
}
