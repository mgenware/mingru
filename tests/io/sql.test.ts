import * as mm from 'mingru-models';
import { itThrows } from 'it-throws';
import * as mr from '../../dist/main.js';
import user from '../models/user.js';
import post from '../models/post.js';
import { eq, ok } from '../assert-aliases.js';

const dialect = mr.mysql;

it('Columns and escape strings', () => {
  const sql = mm.sql`abc "aaa" ${post.user_id} ${post.user_id.join(user).url_name}`;
  const io = mr.sqlIO(sql, dialect, post);
  ok(io instanceof mr.SQLIO);
  eq(io.getCodeString(), '"abc \\"aaa\\" `user_id` `url_name`"');
});

it('SQL calls', () => {
  const sql = mm.sql`${post.datetime} = ${mm.localDatetimeNow()}`;
  const io = mr.sqlIO(sql, dialect, post);
  eq(io.getCodeString(), '"`datetime` = NOW()"');
});

it('toSQL(sourceTable)', () => {
  itThrows(() => {
    const sql = mm.sql`${post.datetime} = ${mm.localDatetimeNow()}`;
    const io = mr.sqlIO(sql, dialect, user);
    io.getCodeString();
  }, 'Source table assertion failed, expected "User(user)", got "Post(post, db=db_post)".');

  itThrows(() => {
    const sql = mm.sql`${post.datetime} = ${mm.localDatetimeNow()} ${user.id}`;
    const io = mr.sqlIO(sql, dialect, post);
    io.getCodeString();
  }, 'Source table assertion failed, expected "Post(post, db=db_post)", got "User(user)".');
});

it('Nested SQLs', () => {
  const i1 = mm.input(user.id);
  const i2 = user.url_name.toInput();
  const sql1 = mm.sql`${user.url_name} = ${i2} ${mm.input({ type: 'a', defaultValue: null }, 'b')}`;
  const i3 = mm.input(user.sig);
  const sql2 = mm.sql`_${user.id} = ${i1} AND ${sql1}`;
  const i4 = mm.input({ type: 'a', defaultValue: null }, 'b');
  const sql = mm.sql`START${sql2} OR ${user.sig} = ${i3} = ${mm.input(user.sig)} ${i4}`;

  const io = mr.sqlIO(sql, dialect, null);
  eq(
    io.vars.toString(),
    'id: uint64, urlName: string, b: a, sig: *string, sig: *string, b: a {id: uint64, urlName: string, b: a, sig: *string}',
  );
});

it('list and distinctList', () => {
  const i1 = mm.input(user.id);
  const i2 = mm.sql`${i1} ${i1}`;
  const sql = mm.sql`${i1} ${i2} ${user.age.toInput()}`;

  const io = mr.sqlIO(sql, dialect, null);
  eq(io.vars.toString(), 'id: uint64, id: uint64, id: uint64, age: int {id: uint64, age: int}');
});

it('Conflicting names', () => {
  itThrows(() => {
    const sql = mm.sql`${user.id.toInput()}${mm.input({ type: 'b', defaultValue: null }, 'id')}`;
    mr.sqlIO(sql, dialect, null);
  }, 'Cannot handle two variables with the same name "id" but different types ("uint64" and "b") in "Expression `VAR(Column(id, t=User(user)))VAR({"type":"b","defaultValue":null}, name=id)`"');

  itThrows(() => {
    const sql = mm.sql`${mm.input({ type: 'a', defaultValue: null }, 'v1')}${mm.input(
      { type: 'b', defaultValue: null },
      'v1',
    )}`;
    mr.sqlIO(sql, dialect, null);
  }, 'Cannot handle two variables with the same name "v1" but different types ("a" and "b") in "Expression `VAR({"type":"a","defaultValue":null}, name=v1)VAR({"type":"b","defaultValue":null}, name=v1)`"');
});
