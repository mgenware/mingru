import { VarDef, ValueType, formatVarDef } from './varInfo.js';

/**
 * Note that variables with same names and types are considered duplicates. Variables with same
     names but different types are always invalid and will trigger exceptions.
 * When duplicates are allowed:
 *   - `SQLIO`: all variables are tracked in insertion order
 *   - ExecArgs: same variable may be passed multiple times
 * When duplicates are ignored:
 *   - Selected columns
 *   - Setters
 *   - FuncArgs
 */
class VarListBase<T extends VarDef> {
  // A list of variables in insertion order.
  list: T[] = [];
  // A map containing all unique variables.
  private map = new Map<string, T>();

  constructor(public name: string, public allowDuplicates = false) {}

  get length(): number {
    // Do not use map.length, when DuplicatesHanding is allow, only list holds all items
    return this.list.length;
  }

  get distinctList(): T[] {
    if (!this.allowDuplicates) {
      throw new Error('`allowDuplicates` is false. Use `list` instead.');
    }
    return [...this.map.values()];
  }

  getByIndex(idx: number): T | undefined {
    return this.list[idx];
  }

  getByName(name: string): T | undefined {
    return this.map.get(name);
  }

  keys(): readonly string[] {
    return [...this.map.keys()];
  }

  add(varInfo: T) {
    const prev = this.getByName(varInfo.name);
    if (prev) {
      // Found an existing var with the same name, check if their types are identical.
      if (prev.type.toString() === varInfo.type.toString()) {
        if (!this.allowDuplicates) {
          return;
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

  merge(vars: T[]) {
    for (const v of vars) {
      this.add(v);
    }
  }

  toString(): string {
    const s = this.list.map((item) => formatVarDef(item)).join(', ');
    if (this.list.length !== this.map.size) {
      const mapValues = [...this.map.values()];
      const mapStr = mapValues.map((item) => formatVarDef(item)).join(', ');
      return `${s} {${mapStr}}`;
    }
    return s;
  }
}

export class ParamList extends VarListBase<VarDef> {
  constructor(name: string) {
    super(name, false);
  }
}

export class SQLVarList extends VarListBase<VarDef> {
  constructor(name: string) {
    super(name, true);
  }
}

export class ValueList {
  values: ValueType[] = [];

  static fromValues(name: string, values: ValueType[]) {
    const r = new ValueList(name);
    r.values = values;
    return r;
  }

  constructor(public name: string) {}

  addVarDef(v: VarDef) {
    this.values.push(v.name);
  }

  addValue(v: ValueType) {
    this.values.push(v);
  }

  mergeVarDefs(vars: VarDef[]) {
    for (const v of vars) {
      this.values.push(v.name);
    }
  }

  mergeList(list: ValueList) {
    for (const v of list.values) {
      this.values.push(v);
    }
  }

  toString(): string {
    return this.values.join(', ');
  }
}
