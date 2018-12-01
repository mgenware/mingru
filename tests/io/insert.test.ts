import * as mr from '../../';
import * as dd from 'dd-models';
import post from '../models/post';

const dialect = new mr.MySQL();

test('Basic', () => {
  const actions = dd.actions(post);
  const v = actions.insert('t', post.title, post.user_id);
  const io = mr.io.toInsertIO(v, dialect);

  expect(io).toBeInstanceOf(mr.io.InsertIO);
  expect(io.sql).toBe('INSERT INTO `post` (`title`, `user_id`) VALUES (?, ?)');
  expect(io.table).toBeInstanceOf(mr.io.TableIO);
});
