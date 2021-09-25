import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import {
  VarInfo,
  TypeInfo,
  AtomicTypeInfo,
  typeInfoToArray,
  typeInfoToPointer,
  typeInfoWithoutPointer,
} from './varInfo.js';
import * as stringUtils from './stringUtils.js';
import { Dialect } from '../dialect.js';

export class TypeInfoBuilder {
  static fromSQLVariable(variable: mm.SQLVariable, dialect: Dialect): TypeInfo {
    throwIfFalsy(variable, 'variable');
    throwIfFalsy(dialect, 'dialect');
    const { type } = variable;

    let typeInfo: TypeInfo;
    if (type instanceof mm.Column) {
      typeInfo = dialect.colTypeToGoType(type.__type());
    } else if (type instanceof mm.ColumnType) {
      typeInfo = dialect.colTypeToGoType(type);
    } else {
      let typePath = type.module || '';
      if (type.importPath) {
        typePath += `|${type.importPath}`;
      }
      typeInfo = new AtomicTypeInfo(type.type, type.defaultValue, typePath);
    }
    if (variable.isArray) {
      typeInfo = typeInfoToArray(typeInfo);
    }
    // Handle nullability attributes, which can override inferred nullability.
    if (variable.nullable !== undefined) {
      return variable.nullable ? typeInfoToPointer(typeInfo) : typeInfoWithoutPointer(typeInfo);
    }
    return typeInfo;
  }
}

export class VarInfoBuilder {
  static getSQLVarInputName(v: mm.SQLVariable): string {
    return stringUtils.toCamelCase(this.getInputNameFromColumn(v, v.name, v.column));
  }

  static fromSQLVar(v: mm.SQLVariable, dialect: Dialect): VarInfo {
    throwIfFalsy(v, 'v');
    throwIfFalsy(dialect, 'dialect');
    const typeInfo = TypeInfoBuilder.fromSQLVariable(v, dialect);
    return new VarInfo(this.getSQLVarInputName(v), typeInfo);
  }

  private static getInputNameFromColumn(
    v: mm.SQLVariable,
    inputName: string | undefined,
    column?: mm.Column,
  ): string {
    if (inputName) {
      return inputName;
    }
    if (!column) {
      throw new Error(`Missing \`inputName\` for variable ${v}`);
    }
    return column.__getModelName();
  }
}
