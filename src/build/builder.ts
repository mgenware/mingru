import GoBuilder from './goBuilder';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as mfs from 'm-fs';
import Dialect from '../dialect';
import * as nodepath from 'path';
import del from 'del';
import logger from '../logger';
import { TAIO } from '../io/taIO';
import CSQLBuilder from './csqlBuilder';

export interface IBuildOption {
  packageName?: string;
  noFileHeader?: boolean;
  cleanBuild?: boolean;
  noOutput?: boolean;
  buildCode?: boolean;
  buildCSQL?: boolean;
}

class Builder {
  opts: IBuildOption;
  constructor(
    public taList: dd.TA[],
    public dialect: Dialect,
    public outDir: string,
    opts?: IBuildOption,
  ) {
    throwIfFalsy(taList, 'tableActionList');
    throwIfFalsy(dialect, 'dialect');
    throwIfFalsy(outDir, 'outDir');
    opts = opts || {};
    // Some options default to true
    if (opts.buildCode === undefined) {
      opts.buildCode = true;
    }
    logger.enabled = !opts.noOutput;
    this.opts = opts;
  }

  async build(): Promise<void> {
    const { opts, outDir } = this;
    if (opts.cleanBuild) {
      logger.info(`🧹  Cleaning directory "${outDir}"`);
      await del(outDir, { force: true });
    }
    await Promise.all(this.taList.map(async ta => await this.buildTA(ta)));
    logger.debug(`🎉  Build succeeded`);
  }

  private async buildTA(ta: dd.TA): Promise<void> {
    const { opts } = this;
    logger.info(`🚙  Building table "${ta.__table.__name}"`);
    if (opts.buildCode) {
      await this.buildCode(ta);
    }
    if (opts.buildCSQL) {
      await this.buildCSQL(ta.__table);
    }
  }

  private async buildCode(ta: dd.TA): Promise<void> {
    const { dialect, outDir, opts } = this;
    const taIO = new TAIO(ta, dialect);
    const builder = new GoBuilder(taIO, opts.packageName);
    const code = builder.build(!!opts.noFileHeader);
    const fileName = dd.utils.toSnakeCase(ta.__table.__name) + '_ta'; // Add a "_ta" suffix to table actions file
    const outFile = nodepath.join(outDir, fileName + '.go');
    await mfs.writeFileAsync(outFile, code, 'utf8');
  }

  private async buildCSQL(table: dd.Table): Promise<void> {
    const { dialect, outDir } = this;
    const builder = new CSQLBuilder(table, dialect);
    const fileName = dd.utils.toSnakeCase(table.__name);
    const outFile = nodepath.join(outDir, fileName + '.sql');
    const sql = builder.build();
    await mfs.writeFileAsync(outFile, sql, 'utf8');
  }
}

export default async function buildAsync(
  taList: dd.TA[],
  dialect: Dialect,
  outDir: string,
  options?: IBuildOption,
) {
  const builder = new Builder(taList, dialect, outDir, options);
  await builder.build();
}
