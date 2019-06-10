import * as dd from 'dd-models';
import { Dialect } from '../dialect';
import SQLVarList from '../io/sqlVarList';
import { throwIfFalsy } from 'throw-if-arg-empty';

export class TypeInfo {
  static fromSQLVariable(variable: dd.SQLVariable, dialect: Dialect): TypeInfo {
    throwIfFalsy(variable, 'variable');
    throwIfFalsy(dialect, 'dialect');

    if (variable.type instanceof dd.Column) {
      return dialect.convertColumnType((variable.type as dd.Column).type);
    }
    // variable.type is a string
    const parts = variable.type.split('|');
    const typeName = parts[0];
    let namespace: string | undefined;
    if (parts.length > 1) {
      namespace = parts[1];
    }
    return new TypeInfo(typeName, namespace);
  }
  constructor(public typeName: string, public namespace?: string) {}

  toString(): string {
    let s = this.typeName;
    if (this.namespace) {
      s += '|' + this.namespace;
    }
    return s;
  }
}

export class VarInfo {
  static fromSQLVars(vars: SQLVarList, dialect: Dialect): VarInfo[] {
    throwIfFalsy(vars, 'vars');
    throwIfFalsy(dialect, 'dialect');

    const res: VarInfo[] = [];
    for (const v of vars.list) {
      const typeInfo = TypeInfo.fromSQLVariable(v, dialect);
      res.push(new VarInfo(v.name, typeInfo));
    }
    return res;
  }
  constructor(
    public name: string,
    public type: TypeInfo,
    public originalName?: string, // e.g. name: []*Person, originalName: Person
  ) {}

  toString(): string {
    let s = `${this.name}: ${this.type.toString()}`;
    if (this.originalName) {
      s = `${s}(${this.originalName})`;
    }
    return s;
  }
}

export default VarInfo;
