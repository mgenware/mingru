/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import { TypeInfo } from './lib/varInfo.js';

export type StringSegment = string | CodeSegment;

export interface CodeSegment {
  code: string;
}

export enum SQLTypeMode {
  // Standard type string in CREATE TABLE.
  standard,
  // Type string used for column aliases(Available in MySQL).
  alias,
}

// Base class for a dialect implementation.
export class Dialect {
  // Encodes the given name to SQL.
  encodeName(_name: string): string {
    throw new Error('Not implemented yet');
  }

  // Translates a JavaScript object to SQL equivalent
  objToSQL(_obj: unknown, _table: mm.Table | null): mm.SQL {
    throw new Error('Not implemented yet');
  }

  // Converts the specified column to `TypeInfo`.
  colTypeToGoType(_colType: mm.ColumnType): TypeInfo {
    throw new Error('Not implemented yet');
  }

  // Converts the specified column to SQL type.
  colToSQLType(_col: mm.Column, _mode?: SQLTypeMode): mm.SQL {
    throw new Error('Not implemented yet');
  }

  // Wraps the given SQL expression in a AS SQL clause with the given name.
  as(_sql: mm.SQL, _name: string): mm.SQL {
    throw new Error('Not implemented yet');
  }

  // A helper to encode the name of the specified column.
  encodeColumnName(column: mm.Column): string {
    return this.encodeName(column.__getDBName());
  }

  // A helper to encode the name of the specified table.
  encodeTableName(table: mm.Table): string {
    return this.encodeName(table.__getDBName());
  }

  // Returns the SQL expression of an input placeholder.
  inputPlaceholder(): StringSegment[] {
    return ['?'];
  }

  // Returns the SQL function name of the given `SQLCallType`.
  sqlCall(_: mm.SQLCallType): string {
    throw new Error('Not implemented yet');
  }
}

export default Dialect;
