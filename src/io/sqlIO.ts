/* eslint-disable @typescript-eslint/no-use-before-define */
import toTypeString from 'to-type-string';
import * as mm from 'mingru-models';
import { StringSegment } from '../dialect.js';
import { SQLVarList } from '../lib/varList.js';
import { VarDefBuilder } from '../lib/varInfoHelper.js';
import { makeStringFromSegments } from '../build/goCodeUtil.js';
import { join2DArrays } from '../lib/arrayUtils.js';
import { actionToIO } from './actionToIO.js';
import { ActionIO } from './actionIO.js';
import ctx from '../ctx.js';

export class SQLIO {
  constructor(public sql: mm.SQL, public vars: SQLVarList, public code: StringSegment[]) {}

  getCodeString(): string {
    return makeStringFromSegments(this.code);
  }
}

// Helpers to build an `SQLIO`.
function getSQLCode(
  sql: mm.SQL,
  sourceTable: mm.Table | null,
  rewriteElement: ((element: mm.SQLElement) => StringSegment[] | null) | null,
  subqueryCallback: ((action: mm.Action, io: ActionIO) => void) | null,
  context: string,
): StringSegment[] {
  const res: StringSegment[] = [];
  for (const element of sql.elements) {
    if (element.type === mm.SQLElementType.column) {
      const col = element.toColumn();
      if (sourceTable) {
        col.__checkSourceTable(sourceTable, context);
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
        ? handleElement(element, sourceTable, rewriteElement, subqueryCallback, context)
        : rewriteElementRes;
    for (const r of elementResults) {
      res.push(r);
    }
  }
  return res;
}

function handleSubquery(action: mm.Action, defaultGroupTable: mm.Table | null): ActionIO {
  if (action instanceof mm.SelectAction) {
    const groupTable = action.__getGroupTable() ?? defaultGroupTable;
    if (!groupTable) {
      throw new Error('No group table available for subquery initialization');
    }
    // Embedded actions are not validated by mingru-models.
    action.__validate(groupTable);

    const io = actionToIO(
      action,
      { selectionLiteMode: true, outerGroupTable: groupTable },
      'handleSubquery',
    );
    return io;
  }
  throw new Error(`Subquery can only contain SELECT clause, got "${toTypeString(action)}"`);
}

function handleElement(
  element: mm.SQLElement,
  defaultTable: mm.Table | null,
  rewriteElement: ((element: mm.SQLElement) => StringSegment[] | null) | null,
  subqueryCallback: ((action: mm.Action, io: ActionIO) => void) | null,
  context: string,
): StringSegment[] {
  switch (element.type) {
    case mm.SQLElementType.rawString: {
      return [element.toRawString()];
    }

    case mm.SQLElementType.column: {
      return [ctx.dialect.encodeColumnName(element.toColumn())];
    }

    case mm.SQLElementType.call: {
      const call = element.toCall();
      const name = ctx.dialect.sqlCall(call.type);
      const res: StringSegment[] = [`${name}(`];

      if (call.params.length) {
        res.push(
          ...join2DArrays(
            call.params.map((p) =>
              getSQLCode(p, defaultTable, rewriteElement, subqueryCallback, context),
            ),
            ', ',
          ),
        );
      }
      res.push(')');
      return res;
    }

    case mm.SQLElementType.param: {
      const input = element.toParam();
      if (input.isArray) {
        return [
          { code: `mingru.InputPlaceholders(len(${VarDefBuilder.getSQLVarInputName(input)}))` },
        ];
      }
      return ctx.dialect.inputPlaceholder();
    }

    case mm.SQLElementType.rawColumn: {
      const rawCol = element.toSelectedColumn();
      const { selectedName, core } = rawCol.__getData();
      if (!core) {
        throw new Error(`Unexpected undefined core at raw column "${rawCol}"`);
      }
      if (selectedName) {
        return [ctx.dialect.encodeName(selectedName)];
      }
      if (core instanceof mm.Column) {
        if (selectedName) {
          return getSQLCode(
            ctx.dialect.as(mm.sql`${core}`, selectedName),
            defaultTable,
            rewriteElement,
            subqueryCallback,
            context,
          );
        }
        return [ctx.dialect.encodeColumnName(core)];
      }

      if (!selectedName) {
        throw new Error(
          'The argument `selectedName` is required for an SQL expression without any columns inside',
        );
      }
      return getSQLCode(
        ctx.dialect.as(core, selectedName),
        defaultTable,
        rewriteElement,
        subqueryCallback,
        context,
      );
    }

    case mm.SQLElementType.action: {
      const action = element.value;
      if (action instanceof mm.Action) {
        const io = handleSubquery(action, action.__getGroupTable() ?? defaultTable);
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
  // Default table if `FROM` is not present.
  defaultTable: mm.Table | null,
  context: string,
  opt?: SQLIOBuilderOption,
): SQLIO {
  const vars = new SQLVarList(`Expression ${sql.toString()}`);
  if (!Array.isArray(sql.elements)) {
    throw new Error(`Elements should be an array, got \`${toTypeString(sql.elements)}\``);
  }
  for (const element of sql.elements) {
    if (element.type === mm.SQLElementType.param) {
      // There's no unsafe calls here. It's probably an ESLint TypeScript bug.
      // eslint-disable-next-line max-len
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
      const sqlVar = element.toParam();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const varDef = VarDefBuilder.fromSQLVar(sqlVar);
      vars.add(varDef);
    }
  }

  // eslint-disable-next-line no-param-reassign
  opt = opt || {};
  return new SQLIO(
    sql,
    vars,
    getSQLCode(
      sql,
      defaultTable,
      opt.rewriteElement || null,
      opt.subqueryCallback || null,
      context,
    ),
  );
}
