import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';

const dialect = new mr.MySQL();

test('Columns and escape strings', () => {
  const sql = dd.sql`abc "aaa" ${post.user_id} ${
    post.user_id.join(user).url_name
  }`;
  const io = mr.sqlIO(sql, dialect);
  expect(io).toBeInstanceOf(mr.SQLIO);
  expect(io.toSQL()).toBe('abc "aaa" `user_id` `url_name`');
});

test('SQL calls', () => {
  const sql = dd.sql`${post.datetime} = ${dd.datetimeNow()}`;
  const io = mr.sqlIO(sql, dialect);
  expect(io.toSQL()).toBe('`datetime` = NOW()');
});

test('Nested SQLs', () => {
  const i1 = dd.input(user.id);
  const i2 = user.url_name.toInput();
  const sql1 = dd.sql`${user.url_name} = ${i2} ${dd.input('a', 'b')}`;
  const i3 = dd.input(user.sig);
  const sql2 = dd.sql`_${user.id} = ${i1} AND ${sql1}`;
  const i4 = dd.input('a', 'b');
  const sql = dd.sql`START${sql2} OR ${user.sig} = ${i3} = ${dd.input(
    user.sig,
  )} ${i4}`;

  const io = mr.sqlIO(sql, dialect);
  expect(io.varList.toString()).toEqual(
    'id: uint64, urlName: string, b: a, sig: *string, sig: *string, b: a {id: uint64, urlName: string, b: a, sig: *string}',
  );
});

test('list and distinctList', () => {
  const i1 = dd.input(user.id);
  const i2 = dd.sql`${i1} ${i1}`;
  const sql = dd.sql`${i1} ${i2} ${user.age.toInput()}`;

  const io = mr.sqlIO(sql, dialect);
  expect(io.varList.toString()).toEqual(
    'id: uint64, id: uint64, id: uint64, age: int {id: uint64, age: int}',
  );
});

test('Conflicting names', () => {
  expect(() => {
    const sql = dd.sql`${user.id.toInput()}${dd.input('b', 'id')}`;
    mr.sqlIO(sql, dialect);
  }).toThrow('id');
  expect(() => {
    const sql = dd.sql`${dd.input('a', 'v1')}${dd.input('b', 'v1')}`;
    mr.sqlIO(sql, dialect);
  }).toThrow('v1');
});
