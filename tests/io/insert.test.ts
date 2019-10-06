import * as mr from '../../';
import * as dd from 'mingru-models';
import post from '../models/post';
import user from '../models/user';
import * as assert from 'assert';

const expect = assert.equal;
const dialect = mr.mysql;

it('Insert inputs', () => {
  class PostTA extends dd.TA {
    t = dd.unsafeInsert().setInputs(post.title, post.user_id);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.insertIO(v, dialect);

  assert.ok(io instanceof mr.InsertIO);
  expect(io.sql, 'INSERT INTO `db_post` (`title`, `user_id`) VALUES (?, ?)');
});

it('Insert inputs and values', () => {
  class PostTA extends dd.TA {
    t = dd
      .unsafeInsert()
      .setInputs(post.title, post.user_id)
      .set(post.datetime, dd.sql`NOW()`);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.insertIO(v, dialect);

  assert.ok(io instanceof mr.InsertIO);
  expect(
    io.sql,
    'INSERT INTO `db_post` (`title`, `user_id`, `datetime`) VALUES (?, ?, NOW())',
  );
});

it('getInputs', () => {
  class UserTA extends dd.TA {
    t = dd
      .unsafeInsert()
      .setInputs(user.sig, user.id)
      .set(user.url_name, user.url_name.toInput('b'));
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.insertIO(v, mr.mysql);
  expect(
    io.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, sig: *string, id: uint64, b: string',
  );
  expect(io.execArgs.toString(), 'sig: *string, id: uint64, b: string');
});

it('getReturns (isnert)', () => {
  class UserTA extends dd.TA {
    t = dd
      .unsafeInsert()
      .setInputs(user.sig, user.id)
      .set(user.url_name, user.url_name.toInput('b'));
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.insertIO(v, mr.mysql);
  expect(io.returnValues.toString(), '');
});

it('getReturns (insertOne)', () => {
  class UserTA extends dd.TA {
    t = dd
      .unsafeInsertOne()
      .setInputs(user.sig, user.id)
      .set(user.url_name, user.url_name.toInput('b'));
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.insertIO(v, mr.mysql);
  expect(io.returnValues.toString(), 'insertedID: uint64');
});
