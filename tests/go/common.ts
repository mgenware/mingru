import { promisify } from 'util';
import { readFile } from 'fs';
import * as nodepath from 'path';
import * as mr from '../../';
import * as dd from 'dd-models';
const readFileAsync = promisify(readFile);

const dialect = new mr.MySQL();

export async function testBuilderAsync(ta: dd.TableActionCollection, path: string) {
  path = nodepath.resolve(nodepath.join('tests/go/dest', path + '.go'));
  const content = await readFileAsync(path, 'utf8');
  const builder = new mr.Builder(ta, dialect);
  let actual = builder.build(true);
  actual = `import "github.com/mgenware/go-packagex/database/sqlx"\n\n${actual}`;
  expect(actual).toBe(content);
}
