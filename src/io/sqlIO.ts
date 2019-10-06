import { throwIfFalsy } from 'throw-if-arg-empty';
import * as dd from 'mingru-models';
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
    public sql: dd.SQL,
    public dialect: Dialect,
    public varList: VarList,
  ) {
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(varList, 'varList');
  }

  toSQL(
    sourceTable: dd.Table | null,
    cb?: (element: dd.SQLElement) => string | null,
  ): string {
    const { sql } = this;
    let res = '';
    for (const element of sql.elements) {
      if (element.type === dd.SQLElementType.column) {
        const col = element.toColumn();
        if (sourceTable && col.getSourceTable() !== sourceTable) {
          throw new Error(
            `Column source table assetion failed, expected "${
              sourceTable.__name
            }", got "${col.getSourceTable()}".`,
          );
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
    element: dd.SQLElement,
    dialect: Dialect,
    sourceTable: dd.Table | null,
  ): string {
    switch (element.type) {
      case dd.SQLElementType.rawString: {
        return element.toRawString();
      }

      case dd.SQLElementType.column: {
        return dialect.encodeColumnName(element.toColumn());
      }

      case dd.SQLElementType.call: {
        const call = element.toCall();
        const name = dialect.sqlCall(call.type);
        const params = call.params.length
          ? call.params
              .map(p => sqlIO(p, dialect).toSQL(sourceTable))
              .join(', ')
          : '';
        return `${name}(${params})`;
      }

      case dd.SQLElementType.input: {
        return dialect.inputPlaceholder(element.toInput());
      }

      case dd.SQLElementType.rawColumn: {
        return dialect.encodeName(element.toRawColumn().selectedName);
      }

      default: {
        throw new Error(
          `Unsupported type of dd.SQLElement: ${
            element.type
          }, value: "${toTypeString(element)}"`,
        );
      }
    }
  }
}

export function sqlIO(sql: dd.SQL, dialect: Dialect): SQLIO {
  const vars = new VarList(`Expression ${sql.toString()}`, true);
  for (const element of sql.elements) {
    if (element.type === dd.SQLElementType.input) {
      const sqlVar = element.toInput();
      const varInfo = VarInfo.fromSQLVar(sqlVar, dialect);
      vars.add(varInfo);
    }
  }

  return new SQLIO(sql, dialect, vars);
}
