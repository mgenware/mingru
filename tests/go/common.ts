import * as nodepath from 'path';
import * as mr from '../../';
import * as mm from 'mingru-models';
import * as tempy from 'tempy';
import * as mfs from 'm-fs';
import * as assert from 'assert';

const dialect = mr.mysql;
const DestDataDir = 'tests/go/dest';

function defaultOptions(opts?: mr.BuildOption) {
  if (opts) {
    return opts;
  }
  const defOpts: mr.BuildOption = {};
  defOpts.noFileHeader = true;
  return defOpts;
}

export async function testBuildAsync(
  ta: mm.TableActions,
  path: string,
  opts?: mr.BuildOption,
  ctx?: mr.GoBuilderContext,
) {
  let content = '';
  if (path) {
    path = nodepath.resolve(nodepath.join(DestDataDir, path + '.go'));
    content = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.GoTABuilder(
    new mr.TAIO(ta, dialect),
    defaultOptions(opts),
    ctx || new mr.GoBuilderContext(),
  );
  const actual = builder.build();
  if (path) {
    assert.equal(actual, content);
  }
  return builder;
}

export async function testBuildFullAsync(
  ta: mm.TableActions,
  path: string,
  opts?: mr.BuildOption,
  ctx?: mr.GoBuilderContext,
) {
  let content = '';
  if (path) {
    path = nodepath.resolve(nodepath.join(DestDataDir, path + '.go'));
    content = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.GoTABuilder(
    new mr.TAIO(ta, dialect),
    defaultOptions(opts),
    ctx || new mr.GoBuilderContext(),
  );
  const actual = builder.build();
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
  actions: mm.TableActions[],
  files: string[],
  expectedDir: string,
  opts?: mr.BuildOption,
  buildCSQL = false,
) {
  opts = opts || {};
  opts.noFileHeader = true;
  opts.noOutput = true;
  const tmpDir = tempy.directory();

  const builder = new mr.Builder(dialect, tmpDir, opts);
  await builder.build(async () => {
    await builder.buildActionsAsync(actions);
    if (buildCSQL) {
      await builder.buildCreateTableSQLFilesAsync(
        actions.map(a => a.__table as mm.Table),
      );
    }
  });
  for (const file of files) {
    let actual = '';
    let expected = '';
    if (nodepath.extname(file)) {
      // An SQL file
      actual = await nodepath.join(tmpDir, 'create_sql', file);
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
