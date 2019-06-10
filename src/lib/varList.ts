import VarInfo from './varInfo';
import { throwIfFalsy } from 'throw-if-arg-empty';

export default class VarList {
  list: VarInfo[] = [];
  private map = new Map<string, VarInfo>();

  constructor(public name: string) {}

  get length(): number {
    return this.list.length;
  }

  getByIndex(idx: number): VarInfo {
    return this.list[idx];
  }

  getByName(name: string): VarInfo | undefined {
    throwIfFalsy(name, 'name');
    return this.map.get(name);
  }

  add(v: VarInfo) {
    throwIfFalsy(v, 'v');
    const prev = this.getByName(v.name);
    if (prev) {
      // Found an existing var with the same name, check if their types are identical
      if (prev.type.toString() === v.type.toString()) {
        // Ignore identical variables
        return;
      }
      throw new Error(
        `Cannot handle two variables with same names "${
          v.name
        }" but different types ("${prev.type.toString()}" and "${v.type.toString()}") in "${
          this.name
        }"`,
      );
    }
    this.map.set(v.name, v);
    this.list.push(v);
  }

  mergeWith(vars: VarList) {
    throwIfFalsy(vars, 'vars');
    for (const v of vars.list) {
      this.add(v);
    }
  }

  toString(): string {
    return this.list.map(item => item.toString()).join(', ');
  }
}
