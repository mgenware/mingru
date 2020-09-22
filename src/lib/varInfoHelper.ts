import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { VarInfo, TypeInfo, AtomicTypeInfo, typeInfoToArray } from './varInfo';
import Dialect from '../dialect';

export class TypeInfoBuilder {
  static fromSQLVariable(variable: mm.SQLVariable, dialect: Dialect): TypeInfo {
    throwIfFalsy(variable, 'variable');
    throwIfFalsy(dialect, 'dialect');
    const { type } = variable;

    let typeInfo: TypeInfo;
    if (type instanceof mm.Column) {
      typeInfo = dialect.colTypeToGoType(type.__type);
    } else if (type instanceof mm.ColumnType) {
      typeInfo = dialect.colTypeToGoType(type);
    } else {
      let typePath = type.module || '';
      if (type.importPath) {
        typePath += `|${type.importPath}`;
      }
      typeInfo = new AtomicTypeInfo(type.name, type.defaultValue, typePath);
    }
    if (variable.isArray) {
      typeInfo = typeInfoToArray(typeInfo);
    }
    return typeInfo;
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
