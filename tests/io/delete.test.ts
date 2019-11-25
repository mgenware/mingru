import * as mr from '../../';
import * as mm from 'mingru-models';
import post from '../models/post';
import user from '../models/user';
import * as assert from 'assert';

const expect = assert.equal;
const dialect = mr.mysql;

it('Delete', () => {
  class PostTA extends mm.TableActions {
    t = mm.unsafeDeleteAll().byID();
  }
  const postTA = mm.tableActions(post, PostTA);
  const v = postTA.t;
  const io = mr.deleteIO(v, dialect);

  assert.ok(io instanceof mr.DeleteIO);
  expect(io.sql, 'DELETE FROM `db_post` WHERE `id` = ?');
});

it('Delete with where', () => {
  class PostTA extends mm.TableActions {
    t = mm.unsafeDeleteAll().where(mm.sql`${post.id} = 1`);
  }
  const postTA = mm.tableActions(post, PostTA);
  const v = postTA.t;
  const io = mr.deleteIO(v, dialect);

  expect(io.sql, 'DELETE FROM `db_post` WHERE `id` = 1');
});

it('getInputs', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .deleteOne()
      .where(mm.sql`${user.id.toInput()} ${user.url_name.toInput()}`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, mr.mysql);
  expect(
    io.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, id: uint64, urlName: string',
  );
  expect(io.execArgs.toString(), 'id: uint64, urlName: string');
});

it('getReturns', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .deleteOne()
      .where(mm.sql`${user.id.toInput()} ${user.url_name.toInput()}`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, mr.mysql);
  const returns = io.returnValues;
  expect(returns.toString(), '');
});

it('getInputs (no WHERE)', () => {
  class UserTA extends mm.TableActions {
    t = mm.unsafeDeleteAll();
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, mr.mysql);
  const inputs = io.funcArgs;
  expect(inputs.list.length, 1);
});

it('getReturns (no WHERE)', () => {
  class UserTA extends mm.TableActions {
    t = mm.unsafeDeleteAll();
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, mr.mysql);
  const returns = io.returnValues;
  assert.deepEqual(returns.toString(), '__rowsAffected: int');
});
