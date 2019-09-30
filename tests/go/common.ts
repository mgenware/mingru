import * as nodepath from 'path';
import * as mr from '../../';
import * as dd from 'dd-models';
import * as tempy from 'tempy';
import * as mfs from 'm-fs';
import * as assert from 'assert';

const dialect = mr.mysql;
const DestDataDir = 'tests/go/dest';

export async function testBuildAsync(ta: dd.TA, path: string) {
  let content = '';
  if (path) {
    path = nodepath.resolve(nodepath.join(DestDataDir, path + '.go'));
    content = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.GoBuilder(new mr.TAIO(ta, dialect));
  const actual = builder.build(true);
  if (path) {
    assert.equal(actual, content);
  }
  return builder;
}

export async function testBuildFullAsync(ta: dd.TA, path: string) {
  let content = '';
  if (path) {
    path = nodepath.resolve(nodepath.join(DestDataDir, path + '.go'));
    content = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.GoBuilder(new mr.TAIO(ta, dialect));
  const actual = builder.build(true);
  if (path) {
    assert.equal(actual, content);
  }
}

export async function testFilesAsync(a: string, b: string) {
  const aContent = await mfs.readFileAsync(a, 'utf8');
  const bContent = await mfs.readFileAsync(b, 'utf8');
  assert.equal(aContent, bContent);
}

export async function testBuildToDirAsync(
  taList: dd.TA[],
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
    let actual = '';
    let expected = '';
    if (nodepath.extname(file)) {
      // An SQL file
      actual = await nodepath.join(tmpDir, file);
      expected = await nodepath.join(
        nodepath.resolve(nodepath.join(DestDataDir, 'build', expectedDir)),
        file,
      );
    } else {
      // A go file
      actual = await nodepath.join(tmpDir, file + '_ta.go');
      expected = await nodepath.join(
        nodepath.resolve(nodepath.join(DestDataDir, 'build', expectedDir)),
        file + '_ta.go',
      );
    }
    await testFilesAsync(actual, expected);
  }
}
