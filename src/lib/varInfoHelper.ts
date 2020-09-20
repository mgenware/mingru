import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { VarInfo, TypeInfo, AtomicTypeInfo } from './varInfo';
import Dialect from '../dialect';

export class TypeInfoBuilder {
  static fromSQLVariable(variable: mm.SQLVariable, dialect: Dialect): TypeInfo {
    throwIfFalsy(variable, 'variable');
    throwIfFalsy(dialect, 'dialect');
    const { type } = variable;
    if (type instanceof mm.Column) {
      return dialect.colTypeToGoType(type.__type);
    }
    if (type instanceof mm.ColumnType) {
      return dialect.colTypeToGoType(type);
    }
    let typePath = type.module || '';
    if (type.importPath) {
      typePath += `|${type.importPath}`;
    }
    return new AtomicTypeInfo(type.name, type.defaultValue, typePath);
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
