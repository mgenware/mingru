import GoBuilder from './goBuilder';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as mfs from 'm-fs';
import Dialect from '../dialect';
import * as nodepath from 'path';
import del from 'del';
import Logger from '../logger';

export interface IBuildOption {
  packageName?: string;
  noFileHeader?: boolean;
  cleanBuild?: boolean;
  noOutput?: boolean;
}

export default async function buildAsync(
  tableActionList: Array<dd.TableActionCollection<dd.Table>>,
  dialect: Dialect,
  outDir: string,
  options?: IBuildOption,
) {
  throwIfFalsy(tableActionList, 'tableActionList');
  throwIfFalsy(dialect, 'dialect');
  throwIfFalsy(outDir, 'outDir');
  const opts = options || {};
  const logger = new Logger(!opts.noOutput);

  if (opts.cleanBuild) {
    logger.info(`🧹  Cleaning directory "${outDir}"`);
    await del(outDir, { force: true });
  }

  await Promise.all(
    tableActionList.map(async action => {
      logger.info(`🚙  Building table "${action.table.__name}"`);
      const builder = new GoBuilder(action, dialect, logger, opts.packageName);
      const code = builder.build(false, !!opts.noFileHeader);
      const fileName = dd.utils.toSnakeCase(action.table.__name) + '_ta'; // Add a "_ta" suffix to table actions file
      const outFile = nodepath.join(outDir, fileName + '.go');
      await mfs.writeFileAsync(outFile, code, 'utf8');
    }),
  );
  logger.debug(`🎉  Build succeeded`);
}
