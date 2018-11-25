import * as dd from 'dd-models';

export default class Dialect {
  escape(_: string): string {
    throw new Error('Not implemented yet');
  }

  goType(_: dd.Column): string {
    throw new Error('Not implemented yet');
  }

  as(_: string, __: string): string {
    throw new Error('Not implemented yet');
  }

  escapeColumn(column: dd.ColumnBase): string {
    return this.escape(column.__name);
  }

  escapeTable(table: dd.Table): string {
    return this.escape(table.__name);
  }

  inputPlaceholder(_: dd.InputParam): string {
    return '?';
  }
}
