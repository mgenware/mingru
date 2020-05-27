import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { VarInfo, TypeInfo } from './varInfo';
import Dialect from '../dialect';

export class TypeInfoBuilder {
  static fromSQLVariable(variable: mm.SQLVariable, dialect: Dialect): TypeInfo {
    throwIfFalsy(variable, 'variable');
    throwIfFalsy(dialect, 'dialect');
    const { type } = variable;
    if (typeof type === 'string') {
      const parts = type.split('|');
      const typeName = parts[0];
      let namespace: string | undefined;
      if (parts.length > 1) {
        // eslint-disable-next-line prefer-destructuring
        namespace = parts[1];
      }
      return TypeInfo.type(typeName, namespace);
    }
    if (type instanceof mm.Column) {
      return dialect.colTypeToGoType(type.__type);
    }
    return dialect.colTypeToGoType(type);
  }
}

export class VarInfoBuilder {
  static fromSQLVar(v: mm.SQLVariable, dialect: Dialect): VarInfo {
    throwIfFalsy(v, 'v');
    throwIfFalsy(dialect, 'dialect');
    const typeInfo = TypeInfoBuilder.fromSQLVariable(v, dialect);
    return new VarInfo(v.name, typeInfo);
  }
}
