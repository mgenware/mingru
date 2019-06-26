import * as dd from 'dd-models';
import * as defs from '../defs';
import Dialect from '../dialect';

export default class CSQLBuilder {
  constructor(public table: dd.Table, public dialect: Dialect) {}

  build(noHeader?: boolean): string {
    const { table, dialect } = this;
    const columns = table.__columns;
    const body = [];

    const pks: string[] = [];
    const fks: string[] = [];
    for (const col of columns) {
      const colType = col.type;
      if (colType.pk) {
        pks.push(col.getDBName());
      }
      if (col.foreignColumn) {
        const exp = this.fkExpression(col, col.foreignColumn);
        fks.push(exp);
      }
      body.push(
        `${dialect.encodeColumnName(col)} ${dialect.colToSQLType(col)}`,
      );
    }
    if (pks.length) {
      body.push(`PRIMARY KEY ${this.groupNames(pks)}`);
    }
    if (fks.length) {
      body.push(...fks);
    }
    let code = noHeader ? '' : defs.FileHeader;
    code = `CREATE TABLE ${dialect.encodeTableName(table)} (\n`;
    code += this.increaseIndent(body, ',\n');
    code += '\n)\n';
    code += `CHARACTER SET=utf8mb4\nCOLLATE=utf8mb4_unicode_ci\n`;
    code += ';\n';
    return code;
  }

  private groupNames(names: string[]): string {
    return `(${names.map(n => this.dialect.encodeName(n)).join(', ')})`;
  }

  private increaseIndent(lines: string[], sep: string): string {
    return lines.map(line => `\t${line}`).join(sep);
  }

  private fkExpression(col: dd.Column, fCol: dd.Column) {
    const { dialect } = this;
    return `CONSTRAINT FOREIGN KEY(${dialect.encodeColumnName(
      col,
    )}) REFERENCES ${dialect.encodeTableName(
      fCol.castToTable(),
    )} (${dialect.encodeColumnName(fCol)}) ON DELETE CASCADE`;
  }
}
