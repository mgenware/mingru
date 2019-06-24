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
  const io = mr.deleteIO(v, dialect);

  expect(io).toBeInstanceOf(mr.DeleteIO);
  expect(io.sql).toBe('DELETE FROM `post` WHERE `id` = ?');
});

test('Delete with where', () => {
  class PostTA extends dd.TA {
    t = dd.unsafeDeleteAll().where(dd.sql`${post.id} = 1`);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.deleteIO(v, dialect);

  expect(io.sql).toBe('DELETE FROM `post` WHERE `id` = 1');
});

test('getInputs', () => {
  class UserTA extends dd.TA {
    t = dd
      .deleteOne()
      .where(dd.sql`${user.id.toInput()} ${user.url_name.toInput()}`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, new mr.MySQL());
  expect(io.funcArgs.toString()).toBe(
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, id: uint64, urlName: string',
  );
  expect(io.execArgs.toString()).toBe('id: uint64, urlName: string');
});

test('getReturns', () => {
  class UserTA extends dd.TA {
    t = dd
      .deleteOne()
      .where(dd.sql`${user.id.toInput()} ${user.url_name.toInput()}`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, new mr.MySQL());
  const returns = io.returnValues;
  expect(returns.toString()).toBe('');
});

test('getInputs (no WHERE)', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeDeleteAll();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, new mr.MySQL());
  const inputs = io.funcArgs;
  expect(inputs.list.length).toBe(1);
});

test('getReturns (no WHERE)', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeDeleteAll();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, new mr.MySQL());
  const returns = io.returnValues;
  expect(returns.toString()).toEqual('rowsAffected: int');
});
