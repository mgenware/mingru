import * as mr from '../../';
import * as dd from 'dd-models';
import post from '../models/post';
import user from '../models/user';

const dialect = new mr.MySQL();

test('Delete', () => {
  class PostTA extends dd.TA {
    t = dd.unsafeDeleteAll().byID();
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.io.toDeleteIO(v, dialect);

  expect(io).toBeInstanceOf(mr.io.DeleteIO);
  expect(io.sql).toBe('DELETE FROM `post` WHERE `id` = ?');
  expect(io.table).toBeInstanceOf(mr.io.TableIO);
});

test('Delete with where', () => {
  class PostTA extends dd.TA {
    t = dd.unsafeDeleteAll().where(dd.sql`${post.id} = 1`);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.io.toDeleteIO(v, dialect);

  expect(io.sql).toBe('DELETE FROM `post` WHERE `id` = 1');
});

test('getInputs', () => {
  class UserTA extends dd.TA {
    t = dd
      .deleteOne()
      .where(dd.sql`${user.id.toInput()} ${user.name.toInput()}`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.getInputs().list).toEqual([user.id.toInput(), user.name.toInput()]);
  expect(v.getInputs().sealed).toBe(true);
});

test('getInputs (no WHERE)', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeDeleteAll();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  expect(v.getInputs().list.length).toBe(0);
});
