/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import { TypeInfo } from './lib/varInfo';

export type StringSegment = string | CodeSegment;

export interface CodeSegment {
  code: string;
}

export class Dialect {
  encodeName(_: string): string {
    throw new Error('Not implemented yet');
  }

  // Translates a JavaScript object to SQL equivalent
  objToSQL(_: unknown, __: mm.Table | null): mm.SQL {
    throw new Error('Not implemented yet');
  }

  colTypeToGoType(_: mm.ColumnType): TypeInfo {
    throw new Error('Not implemented yet');
  }

  colToSQLType(_: mm.Column): mm.SQL {
    throw new Error('Not implemented yet');
  }

  as(_: mm.SQL, __: string): mm.SQL {
    throw new Error('Not implemented yet');
  }

  encodeColumnName(column: mm.Column): string {
    return this.encodeName(column.__getDBName());
  }

  encodeTableName(table: mm.Table): string {
    return this.encodeName(table.__getDBName());
  }

  inputPlaceholder(v: mm.SQLVariable): StringSegment[] {
    if (v.isArray) {
      return [{ code: `mingru.InputPlaceholders(len(${v.name}))` }];
    }
    return ['?'];
  }

  sqlCall(_: mm.SQLCallType): string {
    throw new Error('Not implemented yet');
  }
}

export default Dialect;
