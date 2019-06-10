import VarInfo from './varInfo';
import { throwIfFalsy } from 'throw-if-arg-empty';
import SQLVariableList from '../io/sqlInputList';
import Dialect from '../dialect';

export default class VarList {
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

  addSQLVars(vars: SQLVariableList, dialect: Dialect) {
    const list = VarInfo.fromSQLVars(vars, dialect);
    for (const v of list) {
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
