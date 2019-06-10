import * as mr from '../../';
import * as dd from 'dd-models';
import post from '../models/post';
import user from '../models/user';

const dialect = new mr.MySQL();

test('Insert inputs', () => {
  class PostTA extends dd.TA {
    t = dd.insert().setInputs(post.title, post.user_id);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.insertIO(v, dialect);

  expect(io).toBeInstanceOf(mr.InsertIO);
  expect(io.sql).toBe('INSERT INTO `post` (`title`, `user_id`) VALUES (?, ?)');
});

test('Insert inputs and values', () => {
  class PostTA extends dd.TA {
    t = dd
      .insert()
      .setInputs(post.title, post.user_id)
      .set(post.datetime, dd.sql`NOW()`);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.insertIO(v, dialect);

  expect(io).toBeInstanceOf(mr.InsertIO);
  expect(io.sql).toBe(
    'INSERT INTO `post` (`title`, `user_id`, `datetime`) VALUES (?, ?, NOW())',
  );
});

test('getInputs', () => {
  class UserTA extends dd.TA {
    t = dd
      .insert()
      .setInputs(user.sig, user.id)
      .set(user.url_name, user.url_name.toInput('b'));
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.insertIO(v, new mr.MySQL());
  expect(io.inputVarList.toString()).toEqual(
    'sig: *string, id: uint64, b: string',
  );
});

test('getReturns (isnert)', () => {
  class UserTA extends dd.TA {
    t = dd
      .insert()
      .setInputs(user.sig, user.id)
      .set(user.url_name, user.url_name.toInput('b'));
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.insertIO(v, new mr.MySQL());
  expect(io.returnVarList.toString()).toEqual('');
});

test('getReturns (insertOne)', () => {
  class UserTA extends dd.TA {
    t = dd
      .insertOne()
      .setInputs(user.sig, user.id)
      .set(user.url_name, user.url_name.toInput('b'));
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.insertIO(v, new mr.MySQL());
  expect(io.returnVarList.toString()).toEqual('inserted_id: uint64');
});
