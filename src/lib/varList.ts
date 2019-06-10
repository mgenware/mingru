import VarInfo from './varInfo';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';

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
      if (prev.toString() === this.toString()) {
        // Duplicate variable, return
        return;
      }
      throw new Error(
        `Cannot handle two variables with same names "${
          v.name
        }" but different types ("${prev.toString()}" and "${this.toString()}") in "${
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
