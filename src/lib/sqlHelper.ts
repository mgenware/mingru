import * as mm from 'mingru-models';
import toTypeString from 'to-type-string';

export function sniffSQLType(sql: mm.SQL): mm.ColumnType | null {
  for (const element of sql.elements) {
    const { type } = element;
    if (type === mm.SQLElementType.column) {
      return element.toColumn().__type;
    }
    if (type === mm.SQLElementType.call) {
      const call = element.toCall();
      const { returnType } = call;
      if (returnType instanceof mm.ColumnType) {
        return returnType;
      }
      // `returnType` is the index of the specified param that indicates the return type.
      const param = call.params[returnType];
      if (!param) {
        throw new Error(`Unexpected empty param from return type index ${returnType}`);
      }
      if (param instanceof mm.Column) {
        return param.__type;
      }
      if (param instanceof mm.SQL) {
        return sniffSQLType(param);
      }
      throw new Error(
        `Return type index must point to a column-like value, got a "${toTypeString(
          param,
        )}" at index ${returnType}`,
      );
    }
    if (type === mm.SQLElementType.rawColumn) {
      const raw = element.toRawColumn();
      if (raw.type) {
        return raw.type;
      }
      if (raw.core instanceof mm.Column) {
        return raw.core.__type;
      }
    }
  }
  return null;
}

export function visitElements(sql: mm.SQL, fn: (element: mm.SQLElement) => boolean): boolean {
  for (const element of sql.elements) {
    if (!fn(element)) {
      return false;
    }
    if (element.type === mm.SQLElementType.rawColumn) {
      const rawCol = element.toRawColumn();
      if (rawCol.core instanceof mm.SQL) {
        if (!visitElements(rawCol.core, fn)) {
          return false;
        }
      }
    } else if (element.type === mm.SQLElementType.call) {
      const call = element.toCall();
      for (const arg of call.params) {
        if (!visitElements(arg, fn)) {
          return false;
        }
      }
    }
  }
  return true;
}

export function visitColumns(sql: mm.SQL, fn: (column: mm.Column) => boolean): boolean {
  return visitElements(sql, (element) => {
    const { value } = element;
    if (value instanceof mm.Column) {
      if (!fn(value)) {
        return false;
      }
    } else if (value instanceof mm.RawColumn) {
      const { core } = value;
      if (core instanceof mm.Column) {
        if (!fn(core)) {
          return false;
        }
      }
    }
    return true;
  });
}

export function visitColumnsFromSelectedColumn(
  sc: mm.SelectActionColumns,
  fn: (column: mm.Column) => boolean,
): boolean {
  if (sc instanceof mm.Column) {
    return fn(sc);
  }
  if (sc.core instanceof mm.Column) {
    return fn(sc.core);
  }
  return visitColumns(sc.core, fn);
}

export function hasJoinForColumn(col: mm.Column): boolean {
  return col.__table instanceof mm.JoinedTable;
}

export function hasJoinInSelectedColumn(sc: mm.SelectActionColumns): boolean {
  let hasJoin = false;
  visitColumnsFromSelectedColumn(sc, (col) => {
    if (hasJoinForColumn(col)) {
      hasJoin = true;
      return false;
    }
    return true;
  });
  return hasJoin;
}

export function hasJoinInSQL(sql: mm.SQL): boolean {
  let hasJoin = false;
  visitColumns(sql, (col) => {
    if (hasJoinForColumn(col)) {
      hasJoin = true;
      return false;
    }
    return true;
  });
  return hasJoin;
}
