import * as mm from 'mingru-models';
import { sniffSQLType } from '../../dist/lib/sqlHelper.js';
import user from '../models/user.js';
import post from '../models/post.js';
import { eq } from '../assert-aliases.js';

function tSniffSQLType(sql: mm.SQL, expected: string) {
  eq(sniffSQLType(sql)?.toString(), expected);
}

it('sniffType', () => {
  // Column
  tSniffSQLType(mm.sql`${user.id}`, 'SQL.BIGINT[pk][unsigned][ai]');
  tSniffSQLType(mm.sql`haha${user.id}`, 'SQL.BIGINT[pk][unsigned][ai]');
  // Call
  tSniffSQLType(mm.sql`${mm.max(mm.sql``)}`, 'SQL.INT');
  // Call with a index-based return type from one of its params.
  tSniffSQLType(mm.sql`${mm.ifNull(post.title, post.id)}`, 'SQL.VARCHAR(100)');
  // RawColumn
  tSniffSQLType(mm.sql`haha${user.id.as('abc')}`, 'SQL.BIGINT[pk][unsigned][ai]');
  tSniffSQLType(mm.sql`haha${mm.sel(mm.sql`abc`, 'name', mm.int().__type())}`, 'SQL.INT');
});
