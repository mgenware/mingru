import * as dd from 'mingru-models';
import { TypeInfo } from './lib/varInfo';

export class Dialect {
  encodeName(_: string): string {
    throw new Error('Not implemented yet');
  }

  // Translates a JavaScript object to SQL equivalent
  objToSQL(_: unknown, __: dd.Table | null): string {
    throw new Error('Not implemented yet');
  }

  colTypeToGoType(_: dd.ColumnType): TypeInfo {
    throw new Error('Not implemented yet');
  }

  colToSQLType(_: dd.Column): string {
    throw new Error('Not implemented yet');
  }

  as(_: string, __: string): string {
    throw new Error('Not implemented yet');
  }

  encodeColumnName(column: dd.Column): string {
    return this.encodeName(column.getDBName());
  }

  encodeTableName(table: dd.Table): string {
    return this.encodeName(table.getDBName());
  }

  inputPlaceholder(_: dd.SQLVariable | null): string {
    return '?';
  }

  sqlCall(_: dd.SQLCallType): string {
    throw new Error('Not implemented yet');
  }
}

export default Dialect;
