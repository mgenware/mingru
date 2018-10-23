import * as dd from 'dd-models';
import is from '@sindresorhus/is';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from './dialect';

export default class Select {
  constructor(
    public columns: unknown,
    public from: dd.Table,
    public dialect: Dialect,
  ) { }

  toString(): string {
    let sql = '';
    const { columns, from, dialect } = this;
    throwIfFalsy(columns, 'columns');
    throwIfFalsy(from, 'from');

    sql += 'SELECT ';
    let needJoin = false;
    // columns
    let cols: Array<unknown>;
    if (is.array(columns)) {
      cols = columns as Array<unknown>;

      let firstTable: dd.Table|null = null;
      for (const col of cols) {
        if (col instanceof dd.Column) {
          const table = (col as dd.Column).table;
          if (firstTable === null) {
            firstTable = table;
          } else if (firstTable !== table) {
            needJoin = true;
            break;
          }
        }
      }
    } else {
      cols = [columns];
    }
    sql += cols.map(c => this.formatColumn(c, needJoin)).join(', ');

    // from
    sql += ` FROM ${dialect.escapeName(from.TableName)}`;
    return sql;
  }

  private formatColumn(col: unknown, needJoin: boolean): string {
    throwIfFalsy(col, 'col');

    const { dialect } = this;
    if (col instanceof dd.Column) {
      const column = col as dd.Column;
      const colName = dialect.escapeName(column.name);
      if (needJoin) {
        return `${colName} AS ${dialect.escapeName(column.table.TableName)}`;
      }
      return colName;
    }
    return (col as object).toString();
  }
}
