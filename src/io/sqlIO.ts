/* eslint-disable @typescript-eslint/no-use-before-define */
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import * as mm from 'mingru-models';
import Dialect, { StringSegment } from '../dialect';
import VarList from '../lib/varList';
import VarInfo from '../lib/varInfo';
import { VarInfoBuilder } from '../lib/varInfoHelper';
import { makeStringFromSegments } from '../build/goCode';
import { join2DArrays } from '../lib/arrayUtils';
import actionToIO from './actionToIO';

export class SQLIO {
  get vars(): VarInfo[] {
    return this.varList.list;
  }

  get distinctVars(): VarInfo[] {
    return this.varList.distinctList;
  }

  constructor(
    public sql: mm.SQL,
    public dialect: Dialect,
    public varList: VarList,
    public code: StringSegment[],
  ) {
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(varList, 'varList');
    throwIfFalsy(code, 'code');
  }

  getCodeString(): string {
    return makeStringFromSegments(this.code);
  }
}

// Helpers to build an `SQLIO`.
function getSQLCode(
  sql: mm.SQL,
  sourceTable: mm.Table | null,
  dialect: Dialect,
  rewriteElement: ((element: mm.SQLElement) => StringSegment[] | null) | undefined,
): StringSegment[] {
  const res: StringSegment[] = [];
  for (const element of sql.elements) {
    if (element.type === mm.SQLElementType.column) {
      const col = element.toColumn();
      if (sourceTable) {
        col.checkSourceTable(sourceTable);
      }
    }
    let rewriteElementRes: StringSegment[] | null = null;
    if (rewriteElement) {
      rewriteElementRes = rewriteElement(element);
    }
    const elementResults =
      rewriteElementRes === null ? handleElement(element, sourceTable, dialect) : rewriteElementRes;
    for (const r of elementResults) {
      res.push(r);
    }
  }
  return res;
}

function handleSubquery(
  action: mm.Action,
  defaultTable: mm.Table | null,
  dialect: Dialect,
): StringSegment[] {
  if (action instanceof mm.SelectAction) {
    // Subqueries don't have a name, we'll give them a dummy name so
    // they are considered initialized.
    if (!action.__name) {
      // eslint-disable-next-line no-param-reassign
      action.__name = '__SQLCall_EMBEDDED_ACTION__';
    }
    // Subqueires may or may not have a table assigned, if not set,
    // we assign current source table to them.
    if (!action.__table) {
      // eslint-disable-next-line no-param-reassign
      action.__table = defaultTable;
    }

    const io = actionToIO(action, dialect, 'handleSubquery');
    if (!io.sql) {
      throw new Error(`Unexpected null SQL code at action "${action.toString()}"`);
    }
    return io.sql;
  }
  throw new Error(`Subquery can only contain SELECT clause, got "${toTypeString(action)}"`);
}

function handleElement(
  element: mm.SQLElement,
  defaultTable: mm.Table | null,
  dialect: Dialect,
): StringSegment[] {
  switch (element.type) {
    case mm.SQLElementType.rawString: {
      return [element.toRawString()];
    }

    case mm.SQLElementType.column: {
      return [dialect.encodeColumnName(element.toColumn())];
    }

    case mm.SQLElementType.call: {
      const call = element.toCall();
      const name = dialect.sqlCall(call.type);
      const params = call.params.length
        ? join2DArrays(
            call.params.map((p) => getSQLCode(p, defaultTable, dialect, undefined)),
            ', ',
          )
        : '';
      return [`${name}(${params})`];
    }

    case mm.SQLElementType.input: {
      return dialect.inputPlaceholder(element.toInput());
    }

    case mm.SQLElementType.rawColumn: {
      const rawCol = element.toRawColumn();
      if (rawCol.selectedName) {
        return [dialect.encodeName(rawCol.selectedName)];
      }
      if (rawCol.core instanceof mm.Column) {
        return [dialect.encodeColumnName(rawCol.core)];
      }
      throw new Error(
        'The argument `selectedName` is required for an SQL expression without any columns inside',
      );
    }

    case mm.SQLElementType.action: {
      const action = element.value;
      if (action instanceof mm.Action) {
        return handleSubquery(action, action.__table || defaultTable, dialect);
      }
      throw new Error(`Element is not an action, got \`${toTypeString(action)}\``);
    }

    default: {
      throw new Error(
        `Unsupported type of \`SQLElement\`: ${element.type}, value: "${toTypeString(element)}"`,
      );
    }
  }
}

export interface SQLIOBuilderOption {
  rewriteElement?: (element: mm.SQLElement) => StringSegment[] | null;
}

export function sqlIO(
  sql: mm.SQL,
  dialect: Dialect,
  // Default table if `FROM` is not present.
  defaultTable: mm.Table | null,
  opt?: SQLIOBuilderOption,
): SQLIO {
  const vars = new VarList(`Expression ${sql.toString()}`, true);
  if (!Array.isArray(sql.elements)) {
    throw new Error(`Elements should be an array, got \`${toTypeString(sql.elements)}\``);
  }
  for (const element of sql.elements) {
    if (element.type === mm.SQLElementType.input) {
      const sqlVar = element.toInput();
      const varInfo = VarInfoBuilder.fromSQLVar(sqlVar, dialect);
      vars.add(varInfo);
    }
  }

  // eslint-disable-next-line no-param-reassign
  opt = opt || {};
  return new SQLIO(sql, dialect, vars, getSQLCode(sql, defaultTable, dialect, opt.rewriteElement));
}
