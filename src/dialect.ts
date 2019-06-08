import * as dd from 'dd-models';

export class Dialect {
  escape(_: string): string {
    throw new Error('Not implemented yet');
  }

  // Translates a JavaScript object to SQL equivalent
  translate(_: unknown): string {
    throw new Error('Not implemented yet');
  }

  convertColumnType(_: dd.ColumnType): string {
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

  inputPlaceholder(_: dd.SQLVariable | null): string {
    return '?';
  }

  sqlCall(_: dd.SQLCallType): string {
    throw new Error('Not implemented yet');
  }
}

export default Dialect;
