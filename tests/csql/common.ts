import * as nodepath from 'path';
import * as mr from '../../';
import * as dd from 'dd-models';
import * as mfs from 'm-fs';

const dialect = new mr.MySQL();
const DestDataDir = 'tests/csql/dest';

export async function testBuildAsync(table: dd.Table, path: string) {
  let content = '';
  if (path) {
    path = nodepath.resolve(nodepath.join(DestDataDir, path + '.sql'));
    content = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.CSQLBuilder(table, dialect);
  const actual = builder.build(true);
  if (path) {
    expect(actual).toBe(content);
  }
  return builder;
}
