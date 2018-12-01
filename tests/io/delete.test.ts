import * as mr from '../../';
import * as dd from 'dd-models';
import post from '../models/post';

const dialect = new mr.MySQL();

test('Delete', () => {
  const actions = dd.actions(post);
  const v = actions.delete('t');
  const io = mr.io.toDeleteIO(v, dialect);

  expect(io).toBeInstanceOf(mr.io.DeleteIO);
  expect(io.sql).toBe('DELETE FROM `post`');
  expect(io.table).toBeInstanceOf(mr.io.TableIO);
});

test('Delete with where', () => {
  const actions = dd.actions(post);
  const v = actions.update('t').where(dd.sql`${post.id} = 1`);
  const io = mr.io.toDeleteIO(v, dialect);

  expect(io.sql).toBe('DELETE FROM `post` WHERE `id` = 1');
});
