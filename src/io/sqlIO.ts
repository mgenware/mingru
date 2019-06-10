import { throwIfFalsy } from 'throw-if-arg-empty';
import * as dd from 'dd-models';
import Dialect from '../dialect';
import toTypeString from 'to-type-string';
import VarList from '../lib/varList';
import VarInfo from '../lib/varInfo';

export class SQLIO {
  static fromSQL(sql: dd.SQL, dialect: Dialect): SQLIO {
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(dialect, 'dialect');

    const vars = new VarList(`Expression ${sql.toString()}`);
    for (const element of sql.elements) {
      if (element.type === dd.SQLElementType.input) {
        const sqlVar = element.value as dd.SQLVariable;
        const varInfo = VarInfo.fromSQLVar(sqlVar, dialect);
        vars.add(varInfo);
      }
    }

    return new SQLIO(sql, vars);
  }

  private constructor(public sql: dd.SQL, public varList: VarList) {
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(varList, 'varList');
  }

  toSQL(
    dialect: Dialect,
    cb?: (element: dd.SQLElement) => string | null,
  ): string {
    const { sql } = this;
    let res = '';
    for (const element of sql.elements) {
      let cbRes: string | null = null;
      if (cb) {
        cbRes = cb(element);
      }
      res += cbRes === null ? this.handleElement(element, dialect) : cbRes;
    }
    return res;
  }

  private handleElement(element: dd.SQLElement, dialect: Dialect): string {
    switch (element.type) {
      case dd.SQLElementType.rawString: {
        return element.toRawString();
      }

      case dd.SQLElementType.column: {
        return dialect.escapeColumn(element.toColumn());
      }

      case dd.SQLElementType.call: {
        const call = element.toCall();
        const name = dialect.sqlCall(call.type);
        const params = call.params.length
          ? call.params
              .map(p => SQLIO.fromSQL(p, dialect).toSQL(dialect))
              .join(', ')
          : '';
        return `${name}(${params})`;
      }

      case dd.SQLElementType.input: {
        return dialect.inputPlaceholder(element.toInput());
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
  return SQLIO.fromSQL(sql, dialect);
}
