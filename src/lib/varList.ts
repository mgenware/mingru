import { throwIfFalsy, throwIfFalsyStrict } from 'throw-if-arg-empty';
import { VarInfo } from './varInfo';

/**
 * Note that variables with same names and types are considered duplicates. Variables with same
     names but different types are always invalid and will trigger exceptions.
 * When duplicates are allowed:
 *   Used in `SQLIO` (for example, WHERE expressions): all variables are tracked in insertion order.
 * When duplicates are NOT allowed:
 *   Used in selected columns, setters. Exceptions are thrown in this case.
 */
export default class VarList {
  // A list of variables in insertion order.
  list: VarInfo[] = [];
  // A map containing all unique variables.
  private map = new Map<string, VarInfo>();

  constructor(public name: string, public allowDuplicates = false) {}

  get length(): number {
    // Do not use map.length, when DuplicatesHanding is allow, only list holds all items
    return this.list.length;
  }

  get distinctList(): VarInfo[] {
    return [...this.map.values()];
  }

  getByIndex(idx: number): VarInfo {
    return this.list[idx];
  }

  getByName(name: string): VarInfo | undefined {
    throwIfFalsy(name, 'name');
    return this.map.get(name);
  }

  getKeysString(): string {
    return [...this.map.keys()].join(', ');
  }

  add(varInfo: VarInfo) {
    throwIfFalsy(varInfo, 'varInfo');

    const prev = this.getByName(varInfo.name);
    if (prev) {
      // Found an existing var with the same name, check if their types are identical.
      if (prev.type.toString() === varInfo.type.toString()) {
        if (!this.allowDuplicates) {
          throw new Error(`Duplicate variables "${varInfo.name}" found in "${this.name}"`);
        }
        // Duplicates are allowed here.
        this.list.push(varInfo);
        return;
      }
      throw new Error(
        `Cannot handle two variables with the same name "${
          varInfo.name
        }" but different types ("${prev.type.toString()}" and "${varInfo.type.toString()}") in "${
          this.name
        }"`,
      );
    }
    this.map.set(varInfo.name, varInfo);
    this.list.push(varInfo);
  }

  merge(vars: VarInfo[]) {
    throwIfFalsyStrict(vars, 'vars');
    for (const v of vars) {
      this.add(v);
    }
  }

  toString(): string {
    const s = this.list.map((item) => item.toString()).join(', ');
    if (this.list.length !== this.map.size) {
      const mapValues = [...this.map.values()];
      const mapStr = mapValues.map((item) => item.toString()).join(', ');
      return `${s} {${mapStr}}`;
    }
    return s;
  }
}
