import * as nodepath from 'path';
import * as mr from '../../';
import * as dd from 'dd-models';
import * as tempy from 'tempy';
import * as mfs from 'm-fs';

const dialect = new mr.MySQL();
const DestDataDir = 'tests/go/dest';

export async function testBuildAsync(
  ta: dd.TableActionCollection,
  path: string,
) {
  path = nodepath.resolve(nodepath.join(DestDataDir, path + '.go'));
  const content = await mfs.readFileAsync(path, 'utf8');
  const builder = new mr.Builder(ta, dialect);
  let actual = builder.build(true);
  actual = `import "github.com/mgenware/go-packagex/database/sqlx"\n${actual}`;
  expect(actual).toBe(content);
}

export async function testBuildFullAsync(
  ta: dd.TableActionCollection,
  path: string,
) {
  path = nodepath.resolve(nodepath.join(DestDataDir, path + '.go'));
  const content = await mfs.readFileAsync(path, 'utf8');
  const builder = new mr.Builder(ta, dialect);
  const actual = builder.build();
  expect(actual).toBe(content);
}

export async function testFilesAsync(a: string, b: string) {
  const aContent = await mfs.readFileAsync(a, 'utf8');
  const bContent = await mfs.readFileAsync(b, 'utf8');
  expect(aContent).toBe(bContent);
}

export async function testBuildToDirAsync(
  taList: dd.TableActionCollection[],
  files: string[],
  expectedDir: string,
  option?: mr.IBuildOption,
) {
  const tmpDir = tempy.directory();
  await mr.build(taList, dialect, tmpDir, option);
  for (const file of files) {
    const actual = await nodepath.join(tmpDir, file + '.go');
    const expected = await nodepath.join(
      nodepath.resolve(nodepath.join(DestDataDir, 'build', expectedDir)),
      file + '.go',
    );
    await testFilesAsync(actual, expected);
  }
}

export function newTA(table: dd.Table): dd.TableActionCollection {
  return dd.actions(table);
}
