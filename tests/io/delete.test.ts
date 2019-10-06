import * as mr from '../../';
import * as dd from 'mingru-models';
import post from '../models/post';
import user from '../models/user';
import * as assert from 'assert';

const expect = assert.equal;
const dialect = mr.mysql;

it('Delete', () => {
  class PostTA extends dd.TA {
    t = dd.unsafeDeleteAll().byID();
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.deleteIO(v, dialect);

  assert.ok(io instanceof mr.DeleteIO);
  expect(io.sql, 'DELETE FROM `post` WHERE `id` = ?');
});

it('Delete with where', () => {
  class PostTA extends dd.TA {
    t = dd.unsafeDeleteAll().where(dd.sql`${post.id} = 1`);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.deleteIO(v, dialect);

  expect(io.sql, 'DELETE FROM `post` WHERE `id` = 1');
});

it('getInputs', () => {
  class UserTA extends dd.TA {
    t = dd
      .deleteOne()
      .where(dd.sql`${user.id.toInput()} ${user.url_name.toInput()}`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, mr.mysql);
  expect(
    io.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, id: uint64, urlName: string',
  );
  expect(io.execArgs.toString(), 'id: uint64, urlName: string');
});

it('getReturns', () => {
  class UserTA extends dd.TA {
    t = dd
      .deleteOne()
      .where(dd.sql`${user.id.toInput()} ${user.url_name.toInput()}`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, mr.mysql);
  const returns = io.returnValues;
  expect(returns.toString(), '');
});

it('getInputs (no WHERE)', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeDeleteAll();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, mr.mysql);
  const inputs = io.funcArgs;
  expect(inputs.list.length, 1);
});

it('getReturns (no WHERE)', () => {
  class UserTA extends dd.TA {
    t = dd.unsafeDeleteAll();
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, mr.mysql);
  const returns = io.returnValues;
  assert.deepEqual(returns.toString(), 'rowsAffected: int');
});
