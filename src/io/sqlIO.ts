import { throwIfFalsy } from 'throw-if-arg-empty';
import * as mm from 'mingru-models';
import Dialect from '../dialect';
import toTypeString from 'to-type-string';
import VarList from '../lib/varList';
import VarInfo from '../lib/varInfo';

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
  ) {
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(varList, 'varList');
  }

  toSQL(
    sourceTable: mm.Table | null,
    cb?: (element: mm.SQLElement) => string | null,
  ): string {
    const { sql } = this;
    let res = '';
    for (const element of sql.elements) {
      if (element.type === mm.SQLElementType.column) {
        const col = element.toColumn();
        if (sourceTable) {
          col.checkSourceTable(sourceTable);
        }
      }
      let cbRes: string | null = null;
      if (cb) {
        cbRes = cb(element);
      }
      res +=
        cbRes === null
          ? this.handleElement(element, this.dialect, sourceTable)
          : cbRes;
    }
    return res;
  }

  private handleElement(
    element: mm.SQLElement,
    dialect: Dialect,
    sourceTable: mm.Table | null,
  ): string {
    switch (element.type) {
      case mm.SQLElementType.rawString: {
        return element.toRawString();
      }

      case mm.SQLElementType.column: {
        return dialect.encodeColumnName(element.toColumn());
      }

      case mm.SQLElementType.call: {
        const call = element.toCall();
        const name = dialect.sqlCall(call.type);
        const params = call.params.length
          ? call.params
              .map(p => sqlIO(p, dialect).toSQL(sourceTable))
              .join(', ')
          : '';
        return `${name}(${params})`;
      }

      case mm.SQLElementType.input: {
        return dialect.inputPlaceholder(element.toInput());
      }

      case mm.SQLElementType.rawColumn: {
        const rawCol = element.toRawColumn();
        if (rawCol.selectedName) {
          return dialect.encodeName(rawCol.selectedName);
        }
        if (rawCol.core instanceof mm.Column) {
          return dialect.encodeColumnName(rawCol.core);
        }
        rawCol.throwNameNotAvailableError();
      }

      default: {
        throw new Error(
          `Unsupported type of mm.SQLElement: ${
            element.type
          }, value: "${toTypeString(element)}"`,
        );
      }
    }
  }
}

export function sqlIO(sql: mm.SQL, dialect: Dialect): SQLIO {
  const vars = new VarList(`Expression ${sql.toString()}`, true);
  for (const element of sql.elements) {
    if (element.type === mm.SQLElementType.input) {
      const sqlVar = element.toInput();
      const varInfo = VarInfo.fromSQLVar(sqlVar, dialect);
      vars.add(varInfo);
    }
  }

  return new SQLIO(sql, dialect, vars);
}
