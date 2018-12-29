import * as mr from '../../';
import * as dd from 'dd-models';
import post from '../models/post';

const dialect = new mr.MySQL();

test('Insert inputs', () => {
  const actions = dd.actions(post);
  const v = actions.insert('t').setInputs(post.title, post.user_id);
  const io = mr.io.toInsertIO(v, dialect);

  expect(io).toBeInstanceOf(mr.io.InsertIO);
  expect(io.sql).toBe('INSERT INTO `post` (`title`, `user_id`) VALUES (?, ?)');
  expect(io.table).toBeInstanceOf(mr.io.TableIO);
});

test('Insert inputs and values', () => {
  const actions = dd.actions(post);
  const v = actions
    .insert('t')
    .setInputs(post.title, post.user_id)
    .set(post.datetime, dd.sql`NOW()`);
  const io = mr.io.toInsertIO(v, dialect);

  expect(io).toBeInstanceOf(mr.io.InsertIO);
  expect(io.sql).toBe(
    'INSERT INTO `post` (`title`, `user_id`, `datetime`) VALUES (?, ?, NOW())',
  );
  expect(io.table).toBeInstanceOf(mr.io.TableIO);
});

test('No setters', () => {
  const actions = dd.actions(post);
  expect(() => mr.io.toInsertIO(actions.insert('t'), dialect)).toThrow(
    'setter',
  );
});
