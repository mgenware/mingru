import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as mfs from 'm-fs';
import * as np from 'path';
import { promises as fs } from 'fs';
import del from 'del';
import tempy from 'tempy';
import * as defs from '../def/defs.js';
import { Dialect } from '../dialect.js';
import CoreBuilderWrapper from './coreBuilderWrapper.js';
import logger from '../logger.js';
import CSQLBuilder from './csqlBuilder.js';
import { BuildOptions } from './buildOptions.js';
import { toSnakeCase } from '../lib/stringUtils.js';

const tableSQLDir = 'table_sql';
const migSQLDir = 'migration_sql';

export default class Builder {
  opts: BuildOptions;
  private buildStarted = false;

  // This is a tmp dir. When build is done successfully.
  // `workingDir` contents get copied to `ourDir`.
  // If `cleanOutDir` is on, `ourDir` gets deleted before copying.
  workingDir: string;

  constructor(public dialect: Dialect, public outDir: string, opts?: BuildOptions) {
    throwIfFalsy(dialect, 'dialect');
    throwIfFalsy(outDir, 'outDir');
    // eslint-disable-next-line no-param-reassign
    opts = opts ?? {};
    logger.enabled = !opts.noOutput;
    this.opts = opts;
    this.workingDir = tempy.directory();
  }

  async buildAsync(callback: () => Promise<void>): Promise<void> {
    throwIfFalsy(callback, 'callback');
    const { opts, workingDir, outDir } = this;
    this.buildStarted = true;
    await callback();
    this.buildStarted = false;
    if (opts.cleanOutDir) {
      logger.info(`🛀  Cleaning directory "${outDir}"`);
      await del(outDir, { force: true });
    }
    await fs.cp(workingDir, this.outDir, { recursive: true });
  }

  async buildActionsAsync(actions: Array<mm.TableActions | mm.Table>): Promise<void> {
    throwIfFalsy(actions, 'actions');
    this.checkBuildStatus();
    const coreBuilderWrapper = new CoreBuilderWrapper();
    await coreBuilderWrapper.buildAsync(
      actions,
      this.workingDir,
      { dialect: this.dialect },
      this.opts,
    );
  }

  async buildCreateTableSQLFilesAsync(tables: mm.Table[]): Promise<void> {
    throwIfFalsy(tables, 'tables');
    this.checkBuildStatus();
    // Remove duplicate values.
    // eslint-disable-next-line no-param-reassign
    tables = [...new Set(tables)];
    const csqlBuilders = await Promise.all(tables.map((t) => this.buildCSQL(t)));

    // Generate migration up file.
    const migUpSQLFile = np.join(this.workingDir, migSQLDir, 'up.sql');
    let upSQL = this.opts.sqlFileHeader ?? defs.fileHeader;
    for (const builder of csqlBuilders) {
      upSQL += `${builder.sql}\n`;
    }
    await mfs.writeFileAsync(migUpSQLFile, upSQL);

    // Generate migration down file.
    const migDownSQLFile = np.join(this.workingDir, migSQLDir, 'down.sql');
    let downSQL = this.opts.sqlFileHeader ?? defs.fileHeader;
    // Drop tables in reverse order.
    for (let i = tables.length - 1; i >= 0; i--) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const table = tables[i]!;
      logger.debug(`🏗 Building table SQL [${table.__getDBName()}]`);
      downSQL += `DROP TABLE IF EXISTS ${table.__getDBName()};\n`;
    }
    await mfs.writeFileAsync(migDownSQLFile, downSQL);
  }

  private checkBuildStatus() {
    if (!this.buildStarted) {
      throw new Error('You should call this method inside buildAsync()');
    }
  }

  private async buildCSQL(table: mm.Table): Promise<CSQLBuilder> {
    const { dialect } = this;
    let { workingDir } = this;
    workingDir = np.join(workingDir, tableSQLDir);
    const builder = new CSQLBuilder(table, dialect);
    const fileName = toSnakeCase(table.__getData().name);
    const outFile = np.join(workingDir, fileName + '.sql');
    const sql = builder.build(this.opts.sqlFileHeader);
    await mfs.writeFileAsync(outFile, sql);
    return builder;
  }
}
