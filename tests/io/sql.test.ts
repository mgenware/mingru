import * as mm from 'mingru-models';
import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mr from '../..';
import user from '../models/user';
import post from '../models/post';

const eq = assert.equal;
const dialect = mr.mysql;

it('Columns and escape strings', () => {
  const sql = mm.sql`abc "aaa" ${post.user_id} ${post.user_id.join(user).url_name}`;
  const io = mr.sqlIO(sql, dialect, post);
  assert.ok(io instanceof mr.SQLIO);
  eq(io.getCodeString(), 'abc "aaa" `user_id` `url_name`');
});

it('SQL calls', () => {
  const sql = mm.sql`${post.datetime} = ${mm.localDatetimeNow()}`;
  const io = mr.sqlIO(sql, dialect, post);
  eq(io.getCodeString(), '`datetime` = NOW()');
});

it('toSQL(sourceTable)', () => {
  itThrows(() => {
    const sql = mm.sql`${post.datetime} = ${mm.localDatetimeNow()}`;
    const io = mr.sqlIO(sql, dialect, user);
    io.getCodeString();
  }, 'Source table assertion failed, expected "Table(user)", got "Table(post|db_post)".');

  itThrows(() => {
    const sql = mm.sql`${post.datetime} = ${mm.localDatetimeNow()} ${user.id}`;
    const io = mr.sqlIO(sql, dialect, post);
    io.getCodeString();
  }, 'Source table assertion failed, expected "Table(post|db_post)", got "Table(user)".');
});

it('Nested SQLs', () => {
  const i1 = mm.input(user.id);
  const i2 = user.url_name.toInput();
  const sql1 = mm.sql`${user.url_name} = ${i2} ${mm.input({ name: 'a', defaultValue: null }, 'b')}`;
  const i3 = mm.input(user.sig);
  const sql2 = mm.sql`_${user.id} = ${i1} AND ${sql1}`;
  const i4 = mm.input({ name: 'a', defaultValue: null }, 'b');
  const sql = mm.sql`START${sql2} OR ${user.sig} = ${i3} = ${mm.input(user.sig)} ${i4}`;

  const io = mr.sqlIO(sql, dialect, null);
  assert.deepEqual(
    io.varList.toString(),
    'id: uint64, urlName: string, b: a, sig: *string, sig: *string, b: a {id: uint64, urlName: string, b: a, sig: *string}',
  );
});

it('list and distinctList', () => {
  const i1 = mm.input(user.id);
  const i2 = mm.sql`${i1} ${i1}`;
  const sql = mm.sql`${i1} ${i2} ${user.age.toInput()}`;

  const io = mr.sqlIO(sql, dialect, null);
  assert.deepEqual(
    io.varList.toString(),
    'id: uint64, id: uint64, id: uint64, age: int {id: uint64, age: int}',
  );
});

it('Conflicting names', () => {
  itThrows(() => {
    const sql = mm.sql`${user.id.toInput()}${mm.input({ name: 'b', defaultValue: null }, 'id')}`;
    mr.sqlIO(sql, dialect, null);
  }, 'Cannot handle two variables with same names "id" but different types ("uint64" and "b") in "Expression SQL(E(SQLVar(id, desc = Column(id, Table(user))), type = 2), E(SQLVar(id, desc = String(b)), type = 2))"');

  itThrows(() => {
    const sql = mm.sql`${mm.input({ name: 'a', defaultValue: null }, 'v1')}${mm.input(
      { name: 'b', defaultValue: null },
      'v1',
    )}`;
    mr.sqlIO(sql, dialect, null);
  }, 'Cannot handle two variables with same names "v1" but different types ("a" and "b") in "Expression SQL(E(SQLVar(v1, desc = String(a)), type = 2), E(SQLVar(v1, desc = String(b)), type = 2))"');
});
