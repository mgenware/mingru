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
  dialect: Dialect,
  sourceTable: mm.Table | null,
  elementHandler?: (element: mm.SQLElement) => StringSegment[] | null,
  actionHandler?: (action: mm.Action) => StringSegment[],
): StringSegment[] {
  const res: StringSegment[] = [];
  for (const element of sql.elements) {
    if (element.type === mm.SQLElementType.column) {
      const col = element.toColumn();
      if (sourceTable) {
        col.checkSourceTable(sourceTable);
      }
    }
    let cbRes: StringSegment[] | null = null;
    if (elementHandler) {
      cbRes = elementHandler(element);
    }
    const elementResults =
      cbRes === null
        ? handleElement(element, dialect, sourceTable, elementHandler, actionHandler)
        : cbRes;
    for (const r of elementResults) {
      res.push(r);
    }
  }
  return res;
}

function handleElement(
  element: mm.SQLElement,
  dialect: Dialect,
  sourceTable: mm.Table | null,
  elementHandler: ((element: mm.SQLElement) => StringSegment[] | null) | undefined,
  actionHandler: ((action: mm.Action) => StringSegment[]) | undefined,
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
            call.params.map((p) =>
              getSQLCode(p, dialect, sourceTable, elementHandler, actionHandler),
            ),
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
      if (!actionHandler) {
        throw new Error(`No action handler for action "${action}"`);
      }
      if (action instanceof mm.Action) {
        return actionHandler(action);
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
  elementHandler?: (element: mm.SQLElement) => StringSegment[] | null;
  actionHandler?: (action: mm.Action) => StringSegment[];
}

export function sqlIO(
  sql: mm.SQL,
  dialect: Dialect,
  sourceTable: mm.Table | null,
  opt?: SQLIOBuilderOption,
): SQLIO {
  const vars = new VarList(`Expression ${sql.toString()}`, true);
  for (const element of sql.elements) {
    if (element.type === mm.SQLElementType.input) {
      const sqlVar = element.toInput();
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
    getSQLCode(sql, dialect, sourceTable, opt.elementHandler, opt.actionHandler),
  );
}
