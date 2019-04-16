import * as nodepath from 'path';
import * as mr from '../../';
import * as dd from 'dd-models';
import * as tempy from 'tempy';
import * as mfs from 'm-fs';

const dialect = new mr.MySQL();
const DestDataDir = 'tests/go/dest';

export async function testBuildAsync(
  ta: dd.TableActionCollection<dd.Table>,
  path: string,
) {
  path = nodepath.resolve(nodepath.join(DestDataDir, path + '.go'));
  const content = await mfs.readFileAsync(path, 'utf8');
  const logger = new mr.Logger(false);
  const builder = new mr.Builder(ta, dialect, logger);
  let actual = builder.build(true, true);
  actual = `import "github.com/mgenware/go-packagex/v5/dbx"\n${actual}`;
  expect(actual).toBe(content);
  return builder;
}

export async function testBuildFullAsync(
  ta: dd.TableActionCollection<dd.Table>,
  path: string,
) {
  path = nodepath.resolve(nodepath.join(DestDataDir, path + '.go'));
  const content = await mfs.readFileAsync(path, 'utf8');
  const logger = new mr.Logger(false);
  const builder = new mr.Builder(ta, dialect, logger);
  const actual = builder.build(false, true);
  expect(actual).toBe(content);
}

export async function testFilesAsync(a: string, b: string) {
  const aContent = await mfs.readFileAsync(a, 'utf8');
  const bContent = await mfs.readFileAsync(b, 'utf8');
  expect(aContent).toBe(bContent);
}

export async function testBuildToDirAsync(
  taList: Array<dd.TableActionCollection<dd.Table>>,
  files: string[],
  expectedDir: string,
  option?: mr.IBuildOption,
) {
  const opt = option || {};
  opt.noFileHeader = true;
  opt.noOutput = true;
  const tmpDir = tempy.directory();
  await mr.build(taList, dialect, tmpDir, opt);
  for (const file of files) {
    const actual = await nodepath.join(tmpDir, file + '_ta.go');
    const expected = await nodepath.join(
      nodepath.resolve(nodepath.join(DestDataDir, 'build', expectedDir)),
      file + '_ta.go',
    );
    await testFilesAsync(actual, expected);
  }
}

export function newTA(table: dd.Table): dd.TableActionCollection<dd.Table> {
  return dd.actions(table);
}
