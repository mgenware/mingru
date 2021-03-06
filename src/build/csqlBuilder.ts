/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import * as defs from '../defs.js';
import { Dialect } from '../dialect.js';
import { sqlIO } from '../io/sqlIO.js';
import { extractStringContentFromSegments } from './goCode.js';

export default class CSQLBuilder {
  tableData: mm.TableData;

  constructor(public table: mm.Table, public dialect: Dialect) {
    this.tableData = table.__getData();
  }

  build(header: string | undefined): string {
    const { table, dialect, tableData } = this;
    const columns = Object.values(tableData.columns);
    const body = [];

    const pks: string[] = [];
    const fks: string[] = [];
    const indicesLines: string[] = [];
    for (const col of columns) {
      if (!col) {
        continue;
      }
      const colType = col.__mustGetType();
      const colData = col.__getData();
      const colDBNameEncoded = this.dialect.encodeColumnName(col);
      const fk = colData.foreignColumn;
      if (colType.pk) {
        pks.push(colDBNameEncoded);
      }
      if (fk) {
        const exp = this.fkExpression(col, fk);
        fks.push(exp);
      }
      if (colData.index) {
        indicesLines.push(`${colData.isUniqueIndex ? 'UNIQUE ' : ''}INDEX (${colDBNameEncoded})`);
      }
      const io = sqlIO(dialect.colToSQLType(col), dialect, null);
      body.push(`${dialect.encodeColumnName(col)} ${extractStringContentFromSegments(io.code)}`);
    }
    if (pks.length) {
      body.push(`PRIMARY KEY ${this.groupNames(pks)}`);
    }
    if (fks.length) {
      body.push(...fks);
    }
    if (indicesLines.length) {
      body.push(...indicesLines);
    }
    let code = header ?? defs.fileHeader;
    code += `CREATE TABLE ${dialect.encodeTableName(table)} (\n`;
    code += this.increaseIndent(body, ',\n');
    code += '\n)\n';
    code += 'CHARACTER SET=utf8mb4\nCOLLATE=utf8mb4_unicode_ci\n';
    code += ';\n';
    return code;
  }

  private groupNames(names: string[]): string {
    return `(${names.join(', ')})`;
  }

  private increaseIndent(lines: string[], sep: string): string {
    return lines.map((line) => `\t${line}`).join(sep);
  }

  private fkExpression(col: mm.Column, fCol: mm.Column): string {
    const { dialect } = this;
    return `CONSTRAINT FOREIGN KEY(${dialect.encodeColumnName(
      col,
    )}) REFERENCES ${dialect.encodeTableName(
      fCol.__getData().table as mm.Table,
    )} (${dialect.encodeColumnName(fCol)}) ON DELETE CASCADE`;
  }
}
