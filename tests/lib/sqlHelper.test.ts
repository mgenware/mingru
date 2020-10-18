import * as mm from 'mingru-models';
import * as assert from 'assert';
import { sniffSQLType } from '../../dist/lib/sqlHelper';
import user from '../models/user';
import post from '../models/post';

function tSniffSQLType(sql: mm.SQL, expected: string) {
  assert.strictEqual(sniffSQLType(sql)?.toString(), expected);
}

it('sniffType', () => {
  // Column
  tSniffSQLType(mm.sql`${user.id}`, 'ColType(SQL.BIGINT)');
  tSniffSQLType(mm.sql`haha${user.id}`, 'ColType(SQL.BIGINT)');
  // Call
  tSniffSQLType(mm.sql`${mm.max(mm.sql``)}`, 'ColType(SQL.INT)');
  // Call with a index-based return type from one of its params.
  tSniffSQLType(mm.sql`${mm.ifNull(post.title, post.id)}`, 'ColType(SQL.VARCHAR)');
  // RawColumn
  tSniffSQLType(mm.sql`haha${user.id.as('abc')}`, 'ColType(SQL.BIGINT)');
  tSniffSQLType(mm.sql`haha${mm.sel(mm.sql`abc`, 'name', mm.int().__type)}`, 'ColType(SQL.INT)');
});
