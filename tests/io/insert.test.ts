import * as mr from '../../';
import * as dd from 'dd-models';
import post from '../models/post';

const dialect = new mr.MySQL();

test('Insert inputs', () => {
  class PostTA extends dd.TA {
    t = dd.insert().setInputs(post.title, post.user_id);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.io.toInsertIO(v, dialect);

  expect(io).toBeInstanceOf(mr.io.InsertIO);
  expect(io.sql).toBe('INSERT INTO `post` (`title`, `user_id`) VALUES (?, ?)');
  expect(io.table).toBeInstanceOf(mr.io.TableIO);
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
  const io = mr.io.toInsertIO(v, dialect);

  expect(io).toBeInstanceOf(mr.io.InsertIO);
  expect(io.sql).toBe(
    'INSERT INTO `post` (`title`, `user_id`, `datetime`) VALUES (?, ?, NOW())',
  );
  expect(io.table).toBeInstanceOf(mr.io.TableIO);
});
