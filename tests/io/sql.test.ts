import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';

const dialect = new mr.MySQL();

test('Columns and escape strings', () => {
  const sql = dd.sql`abc "aaa" ${post.user_id} ${post.user_id.join(user).url_name}`;
  const io = new mr.io.SQLIO(sql);
  expect(io).toBeInstanceOf(mr.io.SQLIO);
  expect(io.toSQL(dialect)).toBe('abc "aaa" `user_id` `url_name`');
});
