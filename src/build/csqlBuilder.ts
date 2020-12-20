/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import * as defs from '../defs';
import Dialect from '../dialect';
import { sqlIO } from '../io/sqlIO';
import { extractStringContentFromSegments } from './goCode';

export default class CSQLBuilder {
  tableData: mm.TableData;

  constructor(public table: mm.Table, public dialect: Dialect) {
    this.tableData = table.__getData();
  }

  build(noHeader: boolean): string {
    const { table, dialect, tableData } = this;
    const columns = Object.values(tableData.columns);
    const body = [];

    const pks: string[] = [];
    const fks: string[] = [];
    for (const col of columns) {
      const colType = col.__mustGetType();
      const fk = col.__getData().foreignColumn;
      if (colType.pk) {
        pks.push(col.__getDBName());
      }
      if (fk) {
        const exp = this.fkExpression(col, fk);
        fks.push(exp);
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
    let code = noHeader ? '' : defs.fileHeader;
    code += `CREATE TABLE ${dialect.encodeTableName(table)} (\n`;
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
    )}) REFERENCES ${dialect.encodeTableName(
      fCol.__getData().table as mm.Table,
    )} (${dialect.encodeColumnName(fCol)}) ON DELETE CASCADE`;
  }
}
