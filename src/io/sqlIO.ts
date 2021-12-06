/* eslint-disable @typescript-eslint/no-use-before-define */
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import * as mm from 'mingru-models';
import { Dialect, StringSegment } from '../dialect.js';
import VarList from '../lib/varList.js';
import { VarInfo } from '../lib/varInfo.js';
import { VarInfoBuilder } from '../lib/varInfoHelper.js';
import { makeStringFromSegments } from '../build/goCode.js';
import { join2DArrays } from '../lib/arrayUtils.js';
import { actionToIO } from './actionToIO.js';
import { ActionIO } from './actionIO.js';

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
  rewriteElement: ((element: mm.SQLElement) => StringSegment[] | null) | null,
  subqueryCallback: ((action: mm.Action, io: ActionIO) => void) | null,
): StringSegment[] {
  const res: StringSegment[] = [];
  for (const element of sql.elements) {
    if (element.type === mm.SQLElementType.column) {
      const col = element.toColumn();
      if (sourceTable) {
        col.__checkSourceTable(sourceTable);
      }
    }
    let rewriteElementRes: StringSegment[] | null = null;
    if (rewriteElement) {
      rewriteElementRes = rewriteElement(element);
    }
    // At this point, `rewriteElement` only handles top level elements, it needs to
    // go inside of `handleElement` to handle embedded elements in SQL call params.
    // Note that it doesn't handle elements in subqueries.
    const elementResults =
      rewriteElementRes === null
        ? handleElement(element, sourceTable, dialect, rewriteElement, subqueryCallback)
        : rewriteElementRes;
    for (const r of elementResults) {
      res.push(r);
    }
  }
  return res;
}

function handleSubquery(
  action: mm.Action,
  defaultGroupTable: mm.Table | null,
  dialect: Dialect,
): ActionIO {
  if (action instanceof mm.SelectAction) {
    const groupTable = action.__getData().groupTable || defaultGroupTable;
    if (!groupTable) {
      throw new Error('No group table available for subquery initialization');
    }
    // Embedded actions are not validated by mingru-models.
    action.__validate(groupTable);

    const io = actionToIO(
      action,
      { dialect, selectionLiteMode: true, groupTable },
      'handleSubquery',
    );
    return io;
  }
  throw new Error(`Subquery can only contain SELECT clause, got "${toTypeString(action)}"`);
}

function handleElement(
  element: mm.SQLElement,
  defaultTable: mm.Table | null,
  dialect: Dialect,
  rewriteElement: ((element: mm.SQLElement) => StringSegment[] | null) | null,
  subqueryCallback: ((action: mm.Action, io: ActionIO) => void) | null,
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
      const res: StringSegment[] = [`${name}(`];

      if (call.params.length) {
        res.push(
          ...join2DArrays(
            call.params.map((p) =>
              getSQLCode(p, defaultTable, dialect, rewriteElement, subqueryCallback),
            ),
            ', ',
          ),
        );
      }
      res.push(')');
      return res;
    }

    case mm.SQLElementType.input: {
      const input = element.toInput();
      if (input.isArray) {
        return [
          { code: `mingru.InputPlaceholders(len(${VarInfoBuilder.getSQLVarInputName(input)}))` },
        ];
      }
      return dialect.inputPlaceholder();
    }

    case mm.SQLElementType.rawColumn: {
      const rawCol = element.toSelectedColumn();
      const { selectedName, core } = rawCol.__getData();
      if (!core) {
        throw new Error(`Unexpected undefined core at raw column "${rawCol}"`);
      }
      if (selectedName) {
        return [dialect.encodeName(selectedName)];
      }
      if (core instanceof mm.Column) {
        if (selectedName) {
          return getSQLCode(
            dialect.as(mm.sql`${core}`, selectedName),
            defaultTable,
            dialect,
            rewriteElement,
            subqueryCallback,
          );
        }
        return [dialect.encodeColumnName(core)];
      }

      if (!selectedName) {
        throw new Error(
          'The argument `selectedName` is required for an SQL expression without any columns inside',
        );
      }
      return getSQLCode(
        dialect.as(core, selectedName),
        defaultTable,
        dialect,
        rewriteElement,
        subqueryCallback,
      );
    }

    case mm.SQLElementType.action: {
      const action = element.value;
      if (action instanceof mm.Action) {
        const io = handleSubquery(action, action.__getData().groupTable || defaultTable, dialect);
        subqueryCallback?.(action, io);
        if (!io.sql) {
          throw new Error(`Unexpected empty SQL code from IO, action "${action}"`);
        }
        return io.sql;
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
  subqueryCallback?: (action: mm.Action, io: ActionIO) => void;
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
      // There's no unsafe calls here. It's probably an ESLint TypeScript bug.
      // eslint-disable-next-line max-len
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
      const sqlVar = element.toInput();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const varInfo = VarInfoBuilder.fromSQLVar(sqlVar, dialect);
      vars.add(varInfo);
    }
  }

  // eslint-disable-next-line no-param-reassign
  opt = opt || {};
  return new SQLIO(
    sql,
    dialect,
    vars,
    getSQLCode(
      sql,
      defaultTable,
      dialect,
      opt.rewriteElement || null,
      opt.subqueryCallback || null,
    ),
  );
}
