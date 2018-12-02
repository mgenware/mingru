import GoBuilder from './goBuilder';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import * as mfs from 'm-fs';
import Dialect from '../dialect';
import * as nodepath from 'path';

export default async function buildAsync(
  tableActionList: dd.TableActionCollection[],
  dialect: Dialect,
  outDir: string,
) {
  throwIfFalsy(tableActionList, 'tableActionList');
  throwIfFalsy(dialect, 'dialect');
  throwIfFalsy(outDir, 'outDir');

  await Promise.all(
    tableActionList.map(async action => {
      const builder = new GoBuilder(action, dialect);
      const code = builder.build();
      const fileName = dd.utils.capitalizeColumnName(action.table.__name);
      const outFile = nodepath.join(outDir, fileName + '.go');
      await mfs.writeFileAsync(outFile, code, 'utf8');
    }),
  );
}
