import * as mm from 'mingru-models';
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
import { dedup } from '../lib/arrayUtils.js';

const tableSQLDir = 'table_sql';
const migSQLDir = 'migration_sql';

export default class Builder {
  opts: BuildOptions;

  // This is a tmp dir. When build is done successfully.
  // `workingDir` contents get copied to `ourDir`.
  // If `cleanOutDir` is on, `ourDir` gets deleted before copying.
  workingDir: string;

  constructor(public dialect: Dialect, public outDir: string, opts?: BuildOptions) {
    // eslint-disable-next-line no-param-reassign
    opts = opts ?? {};
    logger.enabled = !opts.noOutput;
    this.opts = opts;
    this.workingDir = tempy.directory();
  }

  async build(source: Array<mm.ActionGroup | mm.Table>): Promise<void> {
    const { opts, workingDir, outDir } = this;

    let somethingBuilt = false;
    if (!opts.noSourceBuilding) {
      // `buildSource` returns table from the given source array (including ones from actions).
      // Calling `concat` to convert it to a mutable array.
      await this.buildSource(source);
      somethingBuilt = true;
    }

    if (opts.createTableSQL) {
      const tables = dedup(
        source
          .map((item) => (item instanceof mm.Table ? item : item.__getData().groupTable))
          .filter((t) => !t.__getData().virtualTable),
      );
      await this.buildCreateTableSQL(tables);
      somethingBuilt = true;
    }

    if (!somethingBuilt) {
      logger.info('No actions needed');
    }

    if (opts.cleanOutDir) {
      logger.info(`🛀  Cleaning directory "${outDir}"`);
      await del(outDir, { force: true });
    }
    await fs.cp(workingDir, this.outDir, { recursive: true });
  }

  private async buildSource(source: Array<mm.ActionGroup | mm.Table>) {
    const coreBuilderWrapper = new CoreBuilderWrapper();
    await coreBuilderWrapper.buildAsync(
      source,
      this.workingDir,
      { dialect: this.dialect },
      this.opts,
    );
  }

  private async buildCreateTableSQL(tables: mm.Table[]): Promise<void> {
    // Remove duplicate values.
    const csqlBuilders = await Promise.all(tables.map((t) => this.buildCSQL(t)));

    // Generate migration up file.
    const migUpSQLFile = np.join(this.workingDir, migSQLDir, 'up.sql');
    let upSQL = this.opts.sqlFileHeader ?? defs.fileHeader;
    let first = true;
    for (const builder of csqlBuilders) {
      if (first) {
        first = false;
      } else {
        upSQL += '\n';
      }
      upSQL += builder.sql;
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
