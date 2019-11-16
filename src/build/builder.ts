import GoBuilder from './goBuilder';
import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as mfs from 'm-fs';
import Dialect from '../dialect';
import * as nodepath from 'path';
import * as del from 'del';
import logger from '../logger';
import CSQLBuilder from './csqlBuilder';
import { BuildOption } from './buildOption';

export default class Builder {
  opts: BuildOption;
  private buildStarted = false;
  constructor(
    public dialect: Dialect,
    public outDir: string,
    opts?: BuildOption,
  ) {
    throwIfFalsy(dialect, 'dialect');
    throwIfFalsy(outDir, 'outDir');
    opts = opts || {};
    logger.enabled = !opts.noOutput;
    this.opts = opts;
  }

  async build(callback: () => Promise<void>): Promise<void> {
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
    await goBuilder.buildAsync(actions, this.outDir, this.dialect, this.opts);
    logger.debug(`🎉  Action build succeeded`);
  }

  async buildCreateTableSQLFilesAsync(tables: mm.Table[]): Promise<void> {
    throwIfFalsy(tables, 'tables');
    this.checkBuildStatus();
    // Remove duplicate values.
    tables = [...new Set(tables)];
    await Promise.all(tables.map(async t => await this.buildCSQL(t)));
    logger.debug(`🎉  Table build succeeded`);
  }

  private checkBuildStatus() {
    if (!this.buildStarted) {
      throw new Error('You should call this method inside build()');
    }
  }

  private async buildCSQL(table: mm.Table): Promise<void> {
    const { dialect } = this;
    let { outDir } = this;
    outDir = nodepath.join(outDir, 'create_sql');
    const builder = new CSQLBuilder(table, dialect);
    const fileName = mm.utils.toSnakeCase(table.__name);
    const outFile = nodepath.join(outDir, fileName + '.sql');
    const sql = builder.build();
    await mfs.writeFileAsync(outFile, sql, 'utf8');
  }
}
