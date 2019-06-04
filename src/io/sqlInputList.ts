const emptySQLVariableList = new SQLVariableList();
emptySQLVariableList.seal();

export default class SQLVariableList {
  static get empty(): SQLVariableList {
    return emptySQLVariableList;
  }

  list: SQLVariable[] = [];
  map: { [name: string]: SQLVariable } = {};
  sealed = false;

  get length(): number {
    return this.list.length;
  }

  getByIndex(index: number): SQLVariable | null {
    return this.list[index];
  }

  getByName(name: string): SQLVariable | null {
    return this.map[name];
  }

  seal() {
    this.sealed = true;
  }

  add(val: SQLVariable) {
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

  merge(other: SQLVariableList) {
    throwIfFalsy(other, 'other');
    for (const ipt of other.list) {
      this.add(ipt);
    }
  }

  copy(): SQLVariableList {
    const res = new SQLVariableList();
    res.map = { ...this.map };
    res.list = [...this.list];
    return res;
  }
}
