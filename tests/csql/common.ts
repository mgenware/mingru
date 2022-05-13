import * as np from 'path';
import * as mm from 'mingru-models';
import * as mfs from 'm-fs';
import * as mr from '../../dist/main.js';
import { eq } from '../assert-aliases.js';

const DestDataDir = 'tests/csql/dest';

export async function testBuildAsync(table: mm.Table, path: string) {
  let content = '';
  if (path) {
    // eslint-disable-next-line no-param-reassign
    path = np.resolve(np.join(DestDataDir, `${path}.sql`));
    content = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.CSQLBuilder(table);
  const actual = builder.build('');
  if (path) {
    eq(actual, content);
  }
  return builder;
}
