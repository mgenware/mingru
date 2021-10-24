import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as mfs from 'm-fs';
import * as nodepath from 'path';
import del from 'del';
import * as defs from '../defs.js';
import { Dialect } from '../dialect.js';
import GoBuilder from './goBuilder.js';
import logger from '../logger.js';
import CSQLBuilder from './csqlBuilder.js';
import { BuildOptions } from './buildOptions.js';
import { toSnakeCase } from '../lib/stringUtils.js';

const tableSQLDir = 'table_sql';
const migSQLDir = 'migration_sql';

export default class Builder {
  opts: BuildOptions;
  private buildStarted = false;

  constructor(public dialect: Dialect, public outDir: string, opts?: BuildOptions) {
    throwIfFalsy(dialect, 'dialect');
    throwIfFalsy(outDir, 'outDir');
    // eslint-disable-next-line no-param-reassign
    opts = opts ?? {};
    logger.enabled = !opts.noOutput;
    this.opts = opts;
  }

  async buildAsync(callback: () => Promise<void>): Promise<void> {
    throwIfFalsy(callback, 'callback');
    const { opts, outDir } = this;
    this.buildStarted = true;
    if (opts.cleanBuild) {
      logger.info(`🛀  Cleaning directory "${outDir}"`);
      await del(outDir, { force: true });
    }
    await callback();
    this.buildStarted = false;
  }

  async buildActionsAsync(actions: mm.TableActions[]): Promise<void> {
    throwIfFalsy(actions, 'actions');
    this.checkBuildStatus();
    const goBuilder = new GoBuilder();
    await goBuilder.buildAsync(actions, this.outDir, { dialect: this.dialect }, this.opts);
    logger.debug('🎉  Action build succeeded');
  }

  async buildCreateTableSQLFilesAsync(tables: mm.Table[]): Promise<void> {
    throwIfFalsy(tables, 'tables');
    this.checkBuildStatus();
    // Remove duplicate values.
    // eslint-disable-next-line no-param-reassign
    tables = [...new Set(tables)];
    const csqlBuilders = await Promise.all(tables.map((t) => this.buildCSQL(t)));

    // Generate migration up file.
    const migUpSQLFile = nodepath.join(this.outDir, migSQLDir, 'up.sql');
    let upSQL = this.opts.sqlFileHeader ?? defs.fileHeader;
    for (const builder of csqlBuilders) {
      upSQL += `${builder.sql}\n`;
    }
    await mfs.writeFileAsync(migUpSQLFile, upSQL);

    // Generate migration down file.
    const migDownSQLFile = nodepath.join(this.outDir, migSQLDir, 'down.sql');
    let downSQL = this.opts.sqlFileHeader ?? defs.fileHeader;
    // Drop tables in reverse order.
    for (let i = tables.length - 1; i >= 0; i--) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const table = tables[i]!;
      downSQL += `DROP TABLE IF EXISTS ${table.__getDBName()};\n`;
    }
    await mfs.writeFileAsync(migDownSQLFile, downSQL);

    logger.debug('🎉  SQL generation succeeded');
  }

  private checkBuildStatus() {
    if (!this.buildStarted) {
      throw new Error('You should call this method inside buildAsync()');
    }
  }

  private async buildCSQL(table: mm.Table): Promise<CSQLBuilder> {
    const { dialect } = this;
    let { outDir } = this;
    outDir = nodepath.join(outDir, tableSQLDir);
    const builder = new CSQLBuilder(table, dialect);
    const fileName = toSnakeCase(table.__getData().name);
    const outFile = nodepath.join(outDir, fileName + '.sql');
    const sql = builder.build(this.opts.sqlFileHeader);
    await mfs.writeFileAsync(outFile, sql);
    return builder;
  }
}
