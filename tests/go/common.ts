/* eslint-disable no-param-reassign */
import * as np from 'path';
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
const tsOutDirName = '__ts';

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
  ctx?: mr.CoreBuilderContext,
) {
  let expected = '';
  if (path) {
    path = np.resolve(np.join(destDataDir, `${path}.go`));
    expected = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.CoreBuilder(
    new mr.TAIO(ta, getTAIOOption(opts)),
    opts ?? defaultOptions(),
    ctx ?? new mr.CoreBuilderContext(),
  );
  const actual = builder.build();
  if (path) {
    eq(actual, expected);
  }
  return builder;
}

export async function testBuildFullAsync(
  ta: mm.TableActions,
  path: string,
  opts?: mr.BuildOptions,
  ctx?: mr.CoreBuilderContext,
) {
  let content = '';
  if (path) {
    path = np.resolve(np.join(destDataDir, `${path}.go`));
    content = await mfs.readFileAsync(path, 'utf8');
  }
  mr.logger.enabled = false;
  const builder = new mr.CoreBuilder(
    new mr.TAIO(ta, getTAIOOption(opts)),
    opts ?? defaultOptions(),
    ctx ?? new mr.CoreBuilderContext(),
  );
  const actual = builder.build();
  if (path) {
    eq(actual, content);
  }
}

export async function testFilesAsync(actualFile: string, expectedFile: string) {
  const actualContent = await mfs.readFileAsync(actualFile, 'utf8');
  const expectedContent = await mfs.readFileAsync(expectedFile, 'utf8');
  eq(actualContent, expectedContent);
}

export interface TestOptions {
  buildCSQL?: boolean;
  testTSTypes?: boolean;
}

export async function testBuildToDirAsync(
  actions: mm.TableActions[],
  files: string[],
  expectedDirName: string,
  buildOpts?: mr.BuildOptions,
  testOpts?: TestOptions,
) {
  buildOpts ??= {};
  buildOpts.goFileHeader = '';
  buildOpts.sqlFileHeader = '';
  buildOpts.noOutput = true;
  const tmpDir = tempy.directory();
  const tsOutDir = np.join(tmpDir, tsOutDirName);
  buildOpts.tsOutDir = tsOutDir;

  const builder = new mr.Builder(dialect, tmpDir, buildOpts);
  await builder.buildAsync(async () => {
    await builder.buildActionsAsync(actions);
    if (testOpts?.buildCSQL) {
      await builder.buildCreateTableSQLFilesAsync(actions.map((a) => a.__getData().table));
    }
  });

  const promises: Promise<void>[] = [];
  const expectedDirPath = np.resolve(np.join(destDataDir, buildDir, expectedDirName));
  for (let file of files) {
    let actual = '';
    let expected = '';
    expected = np.join(expectedDirPath, file);
    if (file.startsWith('#')) {
      file = file.substr(1);
      actual = np.join(tmpDir, file);
      // `file` has changed here, we need to re-generate the expected file.
      expected = np.join(expectedDirPath, file);
    } else if (file === migrationUpFile) {
      actual = np.join(tmpDir, migrationSQLFile, 'up.sql');
      expected = np.join(expectedDirPath, migrationUpFile);
    } else if (file === migrationDownFile) {
      actual = np.join(tmpDir, migrationSQLFile, 'down.sql');
      expected = np.join(expectedDirPath, migrationDownFile);
    } else if (np.extname(file)) {
      actual = np.join(tmpDir, tableSQLFile, file);
    } else {
      // A go file
      actual = np.join(tmpDir, `${file}_ta.go`);
      expected = np.join(expectedDirPath, `${file}_ta.go`);
    }
    promises.push(testFilesAsync(actual, expected));
  }

  // Test TS interfaces.
  if (testOpts?.testTSTypes) {
    const tsFiles = await mfs.subFiles(tsOutDir);
    for (const tsFile of tsFiles) {
      promises.push(
        testFilesAsync(np.join(tsOutDir, tsFile), np.join(expectedDirPath, tsOutDirName, tsFile)),
      );
    }
  }

  await Promise.all(promises);
}
