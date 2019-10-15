import * as mr from '../../';
import * as mm from 'mingru-models';
import user from '../models/user';
import post from '../models/post';
import * as assert from 'assert';

const expect = assert.equal;
const dialect = mr.mysql;

it('Columns and escape strings', () => {
  const sql = mm.sql`abc "aaa" ${post.user_id} ${
    post.user_id.join(user).url_name
  }`;
  const io = mr.sqlIO(sql, dialect);
  assert.ok(io instanceof mr.SQLIO);
  expect(io.toSQL(post), 'abc "aaa" `user_id` `url_name`');
});

it('SQL calls', () => {
  const sql = mm.sql`${post.datetime} = ${mm.datetimeNow()}`;
  const io = mr.sqlIO(sql, dialect);
  expect(io.toSQL(post), '`datetime` = NOW()');
});

it('toSQL(sourceTable)', () => {
  assert.throws(() => {
    const sql = mm.sql`${post.datetime} = ${mm.datetimeNow()}`;
    const io = mr.sqlIO(sql, dialect);
    io.toSQL(user);
  }, 'expedcted "post"');
  assert.throws(() => {
    const sql = mm.sql`${post.datetime} = ${mm.datetimeNow()} ${user.id}`;
    const io = mr.sqlIO(sql, dialect);
    io.toSQL(post);
  }, 'expedcted "user"');
});

it('Nested SQLs', () => {
  const i1 = mm.input(user.id);
  const i2 = user.url_name.toInput();
  const sql1 = mm.sql`${user.url_name} = ${i2} ${mm.input('a', 'b')}`;
  const i3 = mm.input(user.sig);
  const sql2 = mm.sql`_${user.id} = ${i1} AND ${sql1}`;
  const i4 = mm.input('a', 'b');
  const sql = mm.sql`START${sql2} OR ${user.sig} = ${i3} = ${mm.input(
    user.sig,
  )} ${i4}`;

  const io = mr.sqlIO(sql, dialect);
  assert.deepEqual(
    io.varList.toString(),
    'id: uint64, urlName: string, b: a, sig: *string, sig: *string, b: a {id: uint64, urlName: string, b: a, sig: *string}',
  );
});

it('list and distinctList', () => {
  const i1 = mm.input(user.id);
  const i2 = mm.sql`${i1} ${i1}`;
  const sql = mm.sql`${i1} ${i2} ${user.age.toInput()}`;

  const io = mr.sqlIO(sql, dialect);
  assert.deepEqual(
    io.varList.toString(),
    'id: uint64, id: uint64, id: uint64, age: int {id: uint64, age: int}',
  );
});

it('Conflicting names', () => {
  assert.throws(() => {
    const sql = mm.sql`${user.id.toInput()}${mm.input('b', 'id')}`;
    mr.sqlIO(sql, dialect);
  }, 'id');
  assert.throws(() => {
    const sql = mm.sql`${mm.input('a', 'v1')}${mm.input('b', 'v1')}`;
    mr.sqlIO(sql, dialect);
  }, 'v1');
});
