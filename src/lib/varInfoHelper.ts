import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { VarInfo, TypeInfo, AtomicTypeInfo, typeInfoToArray } from './varInfo';
import * as stringUtils from './stringUtils';
import { Dialect } from '../dialect';

export class TypeInfoBuilder {
  static fromSQLVariable(variable: mm.SQLVariable, dialect: Dialect): TypeInfo {
    throwIfFalsy(variable, 'variable');
    throwIfFalsy(dialect, 'dialect');
    const { type } = variable;

    let typeInfo: TypeInfo;
    if (type instanceof mm.Column) {
      typeInfo = dialect.colTypeToGoType(type.__mustGetType());
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
    return typeInfo;
  }
}

export class VarInfoBuilder {
  static fromSQLVar(v: mm.SQLVariable, dialect: Dialect): VarInfo {
    throwIfFalsy(v, 'v');
    throwIfFalsy(dialect, 'dialect');
    const typeInfo = TypeInfoBuilder.fromSQLVariable(v, dialect);
    return new VarInfo(this.getInputNameFromColumn(v, v.name, v.column), typeInfo);
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
    const colData = column.__getData();
    if (colData.inputName) {
      return colData.inputName;
    }
    const name = column.__mustGetName();
    const table = column.__mustGetTable();
    const curName = stringUtils.toCamelCase(name);

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (table instanceof mm.JoinedTable) {
      if (table.associative) {
        return curName;
      }
      return table.tableInputName() + stringUtils.toPascalCase(curName);
    }
    return curName;
  }
}
