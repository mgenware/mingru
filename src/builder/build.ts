import GoBuilder from './goBuilder';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as mfs from 'm-fs';
import Dialect from '../dialect';
import * as nodepath from 'path';

export interface IBuildOption {
  packageName?: string;
  noFileHeader?: boolean;
}

export default async function buildAsync(
  tableActionList: dd.TableActionCollection[],
  dialect: Dialect,
  outDir: string,
  options?: IBuildOption,
) {
  throwIfFalsy(tableActionList, 'tableActionList');
  throwIfFalsy(dialect, 'dialect');
  throwIfFalsy(outDir, 'outDir');
  const opts = options || {};

  await Promise.all(
    tableActionList.map(async action => {
      const builder = new GoBuilder(action, dialect, opts.packageName);
      const code = builder.build(false, !!opts.noFileHeader);
      const fileName = dd.utils.capitalizeFirstLetter(
        dd.utils.toCamelCase(action.table.__name),
      );
      const outFile = nodepath.join(outDir, fileName + '.go');
      await mfs.writeFileAsync(outFile, code, 'utf8');
    }),
  );
}
