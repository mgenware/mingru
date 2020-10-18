import * as mm from 'mingru-models';
import * as assert from 'assert';
import { sniffSQLType } from '../../dist/lib/sqlHelper';
import user from '../models/user';
import post from '../models/post';

it('sniffType', () => {
  // Column
  assert.deepStrictEqual(sniffSQLType(mm.sql`${user.id}`), 'ColType(SQL.BIGINT)');
  assert.deepStrictEqual(sniffSQLType(mm.sql`haha${user.id}`), 'ColType(SQL.BIGINT)');
  // Call
  assert.deepStrictEqual(sniffSQLType(mm.sql`${mm.max(mm.sql``)}`), 'ColType(SQL.INT)');
  // Call with a index-based return type from one of its params.
  assert.deepStrictEqual(
    sniffSQLType(mm.sql`${mm.ifNull(post.title, post.id)}`),
    'ColType(SQL.VARCHAR)',
  );
  // RawColumn
  assert.deepStrictEqual(sniffSQLType(mm.sql`haha${user.id.as('abc')}`), 'ColType(SQL.BIGINT)');
  assert.deepStrictEqual(
    sniffSQLType(mm.sql`haha${mm.sel(mm.sql`abc`, 'name', mm.int().__type)}`),
    'ColType(SQL.INT)',
  );
});
