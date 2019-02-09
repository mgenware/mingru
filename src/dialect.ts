import * as dd from 'dd-models';

// A bridge represents a mapping from SQL type to Go type.
export class TypeBridge {
  constructor(
    public type: string,
    public importPath: string | null,
    public isSystemImport: boolean,
  ) {}

  toString(): string {
    return this.type;
  }
}

export class Dialect {
  escape(_: string): string {
    throw new Error('Not implemented yet');
  }

  // Translates a JavaScript object to SQL equivalent
  translate(_: unknown): string {
    throw new Error('Not implemented yet');
  }

  goType(_: dd.ColumnType): TypeBridge {
    throw new Error('Not implemented yet');
  }

  as(_: string, __: string): string {
    throw new Error('Not implemented yet');
  }

  escapeColumn(column: dd.Column): string {
    return this.escape(column.getDBName());
  }

  escapeTable(table: dd.Table): string {
    return this.escape(table.__name);
  }

  inputPlaceholder(_: dd.SQLInput | null): string {
    return '?';
  }

  sqlCall(_: dd.SQLCallType): string {
    throw new Error('Not implemented yet');
  }
}

export default Dialect;
