/* eslint-disable no-param-reassign */
import * as nodepath from 'path';
import * as mm from 'mingru-models';
import * as tempy from 'tempy';
import * as mfs from 'm-fs';
import * as mr from '../..';
import { ioOpt } from '../io/common';
import { eq } from '../assert-aliases';

const dialect = mr.mysql;
const DestDataDir = 'tests/go/dest';

function defaultOptions(opts?: mr.BuildOptions) {
  if (opts !== undefined) {
    return opts;
  }
  const defOpts: mr.BuildOptions = {};
  defOpts.fileHeader = '';
  return defOpts;
}

export async function testBuildAsync(
  ta: mm.TableActions,
  path: string,
  opts?: mr.BuildOptions,
  ctx?: mr.GoBuilderContext,
) {
  let content = '';
  if (path) {
    path = nodepath.resolve(nodepath.join(DestDataDir, `${path}.go`));
    content = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.GoTABuilder(
    new mr.TAIO(ta, ioOpt),
    defaultOptions(opts),
    ctx ?? new mr.GoBuilderContext(),
  );
  const actual = builder.build();
  if (path) {
    eq(actual, content);
  }
  return builder;
}

export async function testBuildFullAsync(
  ta: mm.TableActions,
  path: string,
  opts?: mr.BuildOptions,
  ctx?: mr.GoBuilderContext,
) {
  let content = '';
  if (path) {
    path = nodepath.resolve(nodepath.join(DestDataDir, `${path}.go`));
    content = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.GoTABuilder(
    new mr.TAIO(ta, ioOpt),
    defaultOptions(opts),
    ctx ?? new mr.GoBuilderContext(),
  );
  const actual = builder.build();
  if (path) {
    eq(actual, content);
  }
}

export async function testFilesAsync(a: string, b: string) {
  const aContent = await mfs.readFileAsync(a, 'utf8');
  const bContent = await mfs.readFileAsync(b, 'utf8');
  eq(aContent, bContent);
}

export async function testBuildToDirAsync(
  actions: mm.TableActions[],
  files: string[],
  expectedDir: string,
  opts?: mr.BuildOptions,
  buildCSQL = false,
) {
  opts = opts ?? {};
  opts.fileHeader = '';
  opts.noOutput = true;
  const tmpDir = tempy.directory();

  const builder = new mr.Builder(dialect, tmpDir, opts);
  await builder.buildAsync(async () => {
    await builder.buildActionsAsync(actions);
    if (buildCSQL) {
      await builder.buildCreateTableSQLFilesAsync(
        actions.map((a) => a.__getData().table as mm.Table),
      );
    }
  });

  const promises: Promise<void>[] = [];
  for (let file of files) {
    let actual = '';
    let expected = '';
    if (file.startsWith('#')) {
      file = file.substr(1);
      actual = nodepath.join(tmpDir, file);
      expected = nodepath.join(
        nodepath.resolve(nodepath.join(DestDataDir, 'build', expectedDir)),
        file,
      );
    } else if (nodepath.extname(file)) {
      // An SQL file
      actual = nodepath.join(tmpDir, 'create_sql', file);
      expected = nodepath.join(
        nodepath.resolve(nodepath.join(DestDataDir, 'build', expectedDir)),
        file,
      );
    } else {
      // A go file
      actual = nodepath.join(tmpDir, `${file}_ta.go`);
      expected = nodepath.join(
        nodepath.resolve(nodepath.join(DestDataDir, 'build', expectedDir)),
        `${file}_ta.go`,
      );
    }
    promises.push(testFilesAsync(actual, expected));
  }
  await Promise.all(promises);
}
