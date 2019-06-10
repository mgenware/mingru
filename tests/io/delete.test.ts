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
  const inputs = io.inputVarList;
  expect(inputs.toString()).toEqual(
    '[user.id.toInput(), user.url_name.toInput()]',
  );
});

test('getInputs (no WHERE)', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeDeleteAll();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, new mr.MySQL());
  const inputs = io.inputVarList;
  expect(inputs.list.length).toBe(0);
});

test('getInputs (no WHERE)', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeDeleteAll();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, new mr.MySQL());
  const returns = io.returnVarList;
  expect(returns.toString()).toEqual([
    new dd.SQLVariable(dd.int(), mr.RowsAffectedKey),
  ]);
});
