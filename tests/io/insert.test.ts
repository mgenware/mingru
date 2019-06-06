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
  expect(io.table).toBeInstanceOf(mr.TableIO);
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
  expect(io.table).toBeInstanceOf(mr.TableIO);
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
  const inputs = io.getInputs();
  expect(inputs.list).toEqual([
    user.sig.toInput(),
    user.id.toInput(),
    user.url_name.toInput('b'),
  ]);
  expect(inputs.sealed).toBe(true);
});

test('getReturns', () => {
  class UserTA extends dd.TA {
    t = dd
      .insert()
      .setInputs(user.sig, user.id)
      .set(user.url_name, user.url_name.toInput('b'));
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.insertIO(v, new mr.MySQL());
  const returns = io.getReturns();
  expect(returns.list).toEqual([
    new dd.SQLVariable(dd.int(), mr.InsertedIDKey),
  ]);
  expect(returns.sealed).toBe(true);
});
