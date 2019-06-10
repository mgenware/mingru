import { throwIfFalsy } from 'throw-if-arg-empty';
import * as dd from 'dd-models';

// tslint:disable-next-line no-any
let emptySQLVarList: any = null;

// SQLVarList is used in SQLIO to store a list of dd.SQLVariable and groups them by name with insertion order.
export default class SQLVarList {
  static get empty(): SQLVarList {
    if (!emptySQLVarList) {
      emptySQLVarList = new SQLVarList();
      emptySQLVarList.seal();
    }
    return emptySQLVarList;
  }

  list: dd.SQLVariable[] = [];
  map: { [name: string]: dd.SQLVariable } = {};
  sealed = false;

  get length(): number {
    return this.list.length;
  }

  getByIndex(index: number): dd.SQLVariable | null {
    return this.list[index];
  }

  getByName(name: string): dd.SQLVariable | null {
    return this.map[name];
  }

  seal() {
    this.sealed = true;
  }

  add(val: dd.SQLVariable) {
    if (this.sealed) {
      throw new Error('InputList is sealed');
    }
    throwIfFalsy(val, 'val');
    const prev = this.getByName(val.name);
    if (prev) {
      if (!prev.isEqualTo(val)) {
        throw new Error(
          `Two inputs with same name "${val.name}" but different types`,
        );
      }
    } else {
      this.list.push(val);
      this.map[val.name] = val;
    }
  }

  merge(other: SQLVarList) {
    throwIfFalsy(other, 'other');
    for (const ipt of other.list) {
      this.add(ipt);
    }
  }

  copy(): SQLVarList {
    const res = new SQLVarList();
    res.map = { ...this.map };
    res.list = [...this.list];
    return res;
  }
}
