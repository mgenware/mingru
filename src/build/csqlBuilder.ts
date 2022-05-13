/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import ctx from '../ctx.js';
import * as defs from '../def/defs.js';
import { SQLTypeMode } from '../dialect.js';
import { sqlIO } from '../io/sqlIO.js';
import { extractStringContentFromSegments } from './goCodeUtil.js';

export default class CSQLBuilder {
  tableData: mm.TableData;
  sql = '';

  constructor(public table: mm.Table) {
    this.tableData = table.__getData();
  }

  build(header: string | undefined): string {
    const { table, tableData } = this;
    const columns = Object.values(tableData.columns);
    const body = [];

    const pks: string[] = [];
    const fks: string[] = [];
    const indicesLines: string[] = [];
    const colAliases = new Set<string>();
    for (const col of columns) {
      if (!col) {
        continue;
      }
      const colType = col.__type();
      const colData = col.__getData();
      const colDBNameEncoded = ctx.dialect.encodeColumnName(col);
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
      const io = sqlIO(ctx.dialect.colToSQLType(col), null, `[Building SQL type of column ${col}]`);
      body.push(
        `${ctx.dialect.encodeColumnName(col)} ${extractStringContentFromSegments(io.code)}`,
      );

      const colAlias = colData.attrs?.get(mm.ColumnAttribute.alias);
      if (typeof colAlias === 'string') {
        if (colAliases.has(colAlias)) {
          throw new Error(`Column alias "${colAlias}" has been defined.`);
        }
        colAliases.add(colAlias);
        const code = extractStringContentFromSegments(
          sqlIO(
            ctx.dialect.colToSQLType(col, SQLTypeMode.alias),
            null,
            `[Building SQL type of column ${col}] with alias ${colAlias}`,
          ).code,
        );
        body.push(`${ctx.dialect.encodeName(colAlias)} ${code}`);
      }
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
    let sql = `CREATE TABLE ${ctx.dialect.encodeTableName(table)} (\n`;
    sql += this.increaseIndent(body, ',\n');
    sql += '\n)\n';
    sql += 'CHARACTER SET=utf8mb4\nCOLLATE=utf8mb4_unicode_ci\n';
    sql += ';\n';
    this.sql = sql;
    return (header ?? defs.fileHeader) + sql;
  }

  private groupNames(names: string[]): string {
    return `(${names.join(', ')})`;
  }

  private increaseIndent(lines: string[], sep: string): string {
    return lines.map((line) => `\t${line}`).join(sep);
  }

  private fkExpression(col: mm.Column, fCol: mm.Column): string {
    return `CONSTRAINT FOREIGN KEY(${ctx.dialect.encodeColumnName(
      col,
    )}) REFERENCES ${ctx.dialect.encodeTableName(
      fCol.__getData().table as mm.Table,
    )} (${ctx.dialect.encodeColumnName(fCol)}) ON DELETE CASCADE`;
  }
}
