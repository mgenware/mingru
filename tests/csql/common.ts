import * as nodepath from 'path';
import * as mm from 'mingru-models';
import * as mfs from 'm-fs';
import * as assert from 'assert';
import * as mr from '../..';

const dialect = mr.mysql;
const DestDataDir = 'tests/csql/dest';

export async function testBuildAsync(table: mm.Table, path: string) {
  let content = '';
  if (path) {
    // eslint-disable-next-line no-param-reassign
    path = nodepath.resolve(nodepath.join(DestDataDir, `${path}.sql`));
    content = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.CSQLBuilder(table, dialect);
  const actual = builder.build(true);
  if (path) {
    assert.equal(actual, content);
  }
  return builder;
}
