import VarInfo from './varInfo';
import { throwIfFalsy } from 'throw-if-arg-empty';
import SQLVarList from '../io/sqlVarList';
import Dialect from '../dialect';

export default class VarList {
  static fromSQLVars(
    name: string,
    vars: SQLVarList,
    dialect: Dialect,
    allowDuplicates = false,
  ): VarList {
    const res = new VarList(name, allowDuplicates);
    res.addSQLVars(vars, dialect);
    return res;
  }

  list: VarInfo[] = [];
  private map = new Map<string, VarInfo>();

  constructor(public name: string, public allowDuplicates = false) {}

  get length(): number {
    return this.list.length;
  }

  add(v: VarInfo) {
    throwIfFalsy(v, 'v');
    if (!this.allowDuplicates && this.map.has(v.name)) {
      throw new Error(
        `Duplicate variable "${v.name}" found in context "${this.name}"`,
      );
    }
    this.list.push();
  }

  addSQLVars(vars: SQLVarList, dialect: Dialect) {
    // Arguments are checkd in VarInfo.fromSQLVars
    const list = VarInfo.fromSQLVars(vars, dialect);
    for (const v of list) {
      this.add(v);
    }
  }

  mergeWith(vars: VarList) {
    throwIfFalsy(vars, 'vars');
    for (const v of vars.list) {
      this.add(v);
    }
  }

  getByIndex(idx: number): VarInfo {
    return this.list[idx];
  }

  getByName(name: string): VarInfo | undefined {
    throwIfFalsy(name, 'name');
    return this.map.get(name);
  }
}
