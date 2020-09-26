/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import * as defs from '../defs';
import Dialect from '../dialect';
import { sqlIO } from '../io/sqlIO';
import { makeStringFromSegments } from './goCode';

export default class CSQLBuilder {
  constructor(public table: mm.Table, public dialect: Dialect) {}

  build(noHeader?: boolean): string {
    const { table, dialect } = this;
    const columns = Object.values(table.__columns);
    const body = [];

    const pks: string[] = [];
    const fks: string[] = [];
    for (const col of columns) {
      const colType = col.__type;
      if (colType.pk) {
        pks.push(col.getDBName());
      }
      if (col.__foreignColumn) {
        const exp = this.fkExpression(col, col.__foreignColumn);
        fks.push(exp);
      }
      const io = sqlIO(dialect.colToSQLType(col), dialect, null);
      body.push(`${dialect.encodeColumnName(col)} ${makeStringFromSegments(io.code)}`);
    }
    if (pks.length) {
      body.push(`PRIMARY KEY ${this.groupNames(pks)}`);
    }
    if (fks.length) {
      body.push(...fks);
    }
    let code = noHeader ? '' : defs.fileHeader;
    code = `CREATE TABLE ${dialect.encodeTableName(table)} (\n`;
    code += this.increaseIndent(body, ',\n');
    code += '\n)\n';
    code += 'CHARACTER SET=utf8mb4\nCOLLATE=utf8mb4_unicode_ci\n';
    code += ';\n';
    return code;
  }

  private groupNames(names: string[]): string {
    return `(${names.map((n) => this.dialect.encodeName(n)).join(', ')})`;
  }

  private increaseIndent(lines: string[], sep: string): string {
    return lines.map((line) => `\t${line}`).join(sep);
  }

  private fkExpression(col: mm.Column, fCol: mm.Column): string {
    const { dialect } = this;
    return `CONSTRAINT FOREIGN KEY(${dialect.encodeColumnName(
      col,
    )}) REFERENCES ${dialect.encodeTableName(fCol.__table as mm.Table)} (${dialect.encodeColumnName(
      fCol,
    )}) ON DELETE CASCADE`;
  }
}
