import * as dd from 'dd-models';
import { Dialect } from '../dialect';
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
  static fromSQLVar(v: dd.SQLVariable, dialect: Dialect): VarInfo {
    throwIfFalsy(v, 'v');
    throwIfFalsy(dialect, 'dialect');
    const typeInfo = TypeInfo.fromSQLVariable(v, dialect);
    return new VarInfo(v.name, typeInfo);
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
