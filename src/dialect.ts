/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import { TypeInfo } from './lib/varInfo';

export class Dialect {
  encodeName(_: string): string {
    throw new Error('Not implemented yet');
  }

  // Translates a JavaScript object to SQL equivalent
  objToSQL(_: unknown, __: mm.Table | null): string {
    throw new Error('Not implemented yet');
  }

  colTypeToGoType(_: mm.ColumnType): TypeInfo {
    throw new Error('Not implemented yet');
  }

  colToSQLType(_: mm.Column): string {
    throw new Error('Not implemented yet');
  }

  as(_: string, __: string): string {
    throw new Error('Not implemented yet');
  }

  encodeColumnName(column: mm.Column): string {
    return this.encodeName(column.getDBName());
  }

  encodeTableName(table: mm.Table): string {
    return this.encodeName(table.getDBName());
  }

  inputPlaceholder(v: mm.SQLVariable): string {
    if (v.isArray) {
      return `+"mingru.InputPlaceholders(len(${v.name}))"+`;
    }
    return '?';
  }

  sqlCall(_: mm.SQLCallType): string {
    throw new Error('Not implemented yet');
  }
}

export default Dialect;
