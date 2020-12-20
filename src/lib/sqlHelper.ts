import * as mm from 'mingru-models';
import toTypeString from 'to-type-string';
import { ActionIO } from '../io/actionIO';
import { SQLIO } from '../io/sqlIO';
import VarList from './varList';
import * as defs from '../defs';
import { StringSegment } from '../dialect';
import BaseIOProcessor from '../io/baseIOProcessor';

export function sniffSQLType(sql: mm.SQL): mm.ColumnType | null {
  for (const element of sql.elements) {
    const { type } = element;
    if (type === mm.SQLElementType.column) {
      return element.toColumn().__mustGetType();
    }
    if (type === mm.SQLElementType.call) {
      const call = element.toCall();
      const { returnType } = call;
      if (returnType instanceof mm.ColumnType) {
        return returnType;
      }
      // `returnType` is the index of the specified param that indicates the return type.
      const param = call.params[returnType];
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!param) {
        throw new Error(`Unexpected empty param from return type index ${returnType}`);
      }
      if (param instanceof mm.Column) {
        return param.__mustGetType();
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
      const { type: rawType, core: rawCore } = raw.__getData();
      if (rawType) {
        return rawType;
      }
      if (rawCore instanceof mm.Column) {
        return rawCore.__mustGetType();
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
      const { core: rawCore } = rawCol.__getData();
      if (rawCore instanceof mm.SQL) {
        if (!visitElements(rawCore, fn)) {
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
      const { core } = value.__getData();
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
  sc: mm.SelectedColumn,
  fn: (column: mm.Column) => boolean,
): boolean {
  if (sc instanceof mm.Column) {
    return fn(sc);
  }
  const { core: scCore } = sc.__getData();
  if (!scCore) {
    throw new Error(`Unexpected undefined core at row column "${sc}"`);
  }
  if (scCore instanceof mm.Column) {
    return fn(scCore);
  }
  return visitColumns(scCore, fn);
}

export function hasJoinForColumn(col: mm.Column): boolean {
  return col.__getData().table instanceof mm.JoinedTable;
}

export function hasJoinInSelectedColumn(sc: mm.SelectedColumn): boolean {
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

export function mergeIOVerListsWithSQLIO(funcArgs: VarList, execArgs: VarList, io: SQLIO | null) {
  if (!io) {
    return;
  }
  funcArgs.merge(io.distinctVars);
  execArgs.merge(io.vars);
}

export function mergeIOVerListsWithActionIO(
  funcArgs: VarList,
  execArgs: VarList,
  io: ActionIO | null,
) {
  if (!io) {
    return;
  }
  funcArgs.merge(io.funcArgs.distinctList);
  execArgs.merge(io.execArgs.list);
}

export function handleNonSelectSQLFrom(
  processor: BaseIOProcessor,
  table: mm.Table,
): StringSegment[] {
  const e = processor.opt.dialect.encodeName;
  return processor.isFromTableInput()
    ? [{ code: defs.tableInputName }]
    : [`${e(table.__getDBName())}`];
}

export function flattenUnions(action: mm.SelectAction): Array<mm.SelectAction | boolean> {
  const { unionMembers, unionAllFlag } = action.__getData();
  if (unionMembers?.length) {
    const [a, b] = unionMembers;
    return [...flattenUnions(a), !!unionAllFlag, ...flattenUnions(b)];
  }
  return [action];
}
