import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';

const dialect = new mr.MySQL();

test('Columns and escape strings', () => {
  const sql = dd.sql`abc "aaa" ${post.user_id} ${
    post.user_id.join(user).url_name
  }`;
  const io = new mr.SQLIO(sql);
  expect(io).toBeInstanceOf(mr.SQLIO);
  expect(io.toSQL(dialect)).toBe('abc "aaa" `user_id` `url_name`');
});

test('SQL calls', () => {
  const sql = dd.sql`${post.datetime} = ${dd.datetimeNow()}`;
  const io = new mr.SQLIO(sql);
  expect(io.toSQL(dialect)).toBe('`datetime` = NOW()');
});

test('Inputs', () => {
  const i1 = dd.input(user.id);
  const i2 = user.url_name.toInput();
  const sql1 = dd.sql`${user.url_name} = ${i2} ${dd.input('a', 'b')}`;
  const i3 = dd.input(user.sig);
  const sql2 = dd.sql`_${user.id} = ${i1} AND ${sql1}`;
  const i4 = dd.input('a', 'b');
  const sql = dd.sql`START${sql2} OR ${user.sig} = ${i3} = ${dd.input(
    user.sig,
  )} ${i4}`;

  const io = mr.sqlIO(sql);
  expect(io.inputs.list).toEqual([i1, i2, i4, i3]);
  expect(io.inputs.sealed).toBe(true);
});

test('Inputs (conflicting names)', () => {
  expect(() => {
    const sql = dd.sql`START${dd.sql`${user.id.toInput()}`} OR ${
      user.sig
    } = ${dd.sql`${post.id.toInput()}`}`;
    mr.sqlIO(sql);
  }).toThrow('id');
  expect(() => {
    const sql = dd.sql`${user.id.toInput()}${dd.input('b', 'id')}`;
    mr.sqlIO(sql);
  }).toThrow('id');
  expect(() => {
    const sql = dd.sql`${dd.input('a', 'v1')}${dd.input('b', 'v1')}`;
    mr.sqlIO(sql);
  }).toThrow('v1');
});
