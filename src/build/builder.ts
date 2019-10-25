import GoBuilder from './goBuilder';
import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as mfs from 'm-fs';
import Dialect from '../dialect';
import * as nodepath from 'path';
import * as del from 'del';
import logger from '../logger';
import { TAIO } from '../io/taIO';
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

  async build(callback: () => void): Promise<void> {
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

  async buildActions(actions: mm.TableActions[]): Promise<void> {
    throwIfFalsy(actions, 'actions');
    this.checkBuildStatus();
    await Promise.all(actions.map(async ta => await this.buildTA(ta)));
    logger.debug(`🎉  Action build succeeded`);
  }

  async buildCreateTableSQLFiles(tables: mm.Table[]): Promise<void> {
    throwIfFalsy(tables, 'tables');
    this.checkBuildStatus();
    await Promise.all(tables.map(async t => await this.buildCSQL(t)));
    logger.debug(`🎉  Table build succeeded`);
  }

  private checkBuildStatus() {
    if (!this.buildStarted) {
      throw new Error('You should call this method inside build()');
    }
  }

  private async buildTA(ta: mm.TableActions): Promise<void> {
    if (!ta.__table) {
      throw new Error('Table action group is not initialized');
    }

    const { dialect, outDir, opts } = this;
    const taIO = new TAIO(ta, dialect);
    const builder = new GoBuilder(taIO, opts);
    const code = builder.build();
    const fileName = mm.utils.toSnakeCase(ta.__table.__name) + '_ta'; // Add a "_ta" suffix to table actions file
    const outFile = nodepath.join(outDir, fileName + '.go');
    await mfs.writeFileAsync(outFile, code, 'utf8');
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
