/* eslint-disable no-param-reassign */
import * as nodepath from 'path';
import * as mm from 'mingru-models';
import tempy from 'tempy';
import * as mfs from 'm-fs';
import * as mr from '../../dist/main.js';
import { commonIOOptions } from '../io/common.js';
import { eq } from '../assert-aliases.js';

const dialect = mr.mysql;
const destDataDir = 'tests/go/dest';
const buildDir = 'build';
const tableSQLFile = 'table_sql';
const migrationSQLFile = 'migration_sql';
export const migrationUpFile = '__mig_up__.sql';
export const migrationDownFile = '__mig_down__.sql';

function defaultOptions() {
  const defOpts: mr.BuildOptions = {};
  defOpts.goFileHeader = '';
  return defOpts;
}

function getTAIOOption(_: mr.BuildOptions | undefined): mr.ActionToIOOptions {
  const ioOpt = { ...commonIOOptions };
  return ioOpt;
}

export async function testBuildAsync(
  ta: mm.TableActions,
  path: string,
  opts?: mr.BuildOptions,
  ctx?: mr.GoBuilderContext,
) {
  let content = '';
  if (path) {
    path = nodepath.resolve(nodepath.join(destDataDir, `${path}.go`));
    content = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.GoTABuilder(
    new mr.TAIO(ta, getTAIOOption(opts)),
    opts ?? defaultOptions(),
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
    path = nodepath.resolve(nodepath.join(destDataDir, `${path}.go`));
    content = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.GoTABuilder(
    new mr.TAIO(ta, getTAIOOption(opts)),
    opts ?? defaultOptions(),
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
  expectedDirName: string,
  opts?: mr.BuildOptions,
  buildCSQL = false,
) {
  opts = opts ?? {};
  opts.goFileHeader = '';
  opts.sqlFileHeader = '';
  opts.noOutput = true;
  const tmpDir = tempy.directory();

  const builder = new mr.Builder(dialect, tmpDir, opts);
  await builder.buildAsync(async () => {
    await builder.buildActionsAsync(actions);
    if (buildCSQL) {
      await builder.buildCreateTableSQLFilesAsync(actions.map((a) => a.__getData().table));
    }
  });

  const promises: Promise<void>[] = [];
  const expectedDirPath = nodepath.resolve(nodepath.join(destDataDir, buildDir, expectedDirName));
  for (let file of files) {
    let actual = '';
    let expected = '';
    expected = nodepath.join(expectedDirPath, file);
    if (file.startsWith('#')) {
      file = file.substr(1);
      actual = nodepath.join(tmpDir, file);
      // `file` has changed here, we need to re-generate the expected file.
      expected = nodepath.join(expectedDirPath, file);
    } else if (file === migrationUpFile) {
      actual = nodepath.join(tmpDir, migrationSQLFile, 'up.sql');
      expected = nodepath.join(expectedDirPath, migrationUpFile);
    } else if (file === migrationDownFile) {
      actual = nodepath.join(tmpDir, migrationSQLFile, 'down.sql');
      expected = nodepath.join(expectedDirPath, migrationDownFile);
    } else if (nodepath.extname(file)) {
      // An SQL file
      actual = nodepath.join(tmpDir, tableSQLFile, file);
    } else {
      // A go file
      actual = nodepath.join(tmpDir, `${file}_ta.go`);
      expected = nodepath.join(expectedDirPath, `${file}_ta.go`);
    }
    promises.push(testFilesAsync(actual, expected));
  }
  await Promise.all(promises);
}
