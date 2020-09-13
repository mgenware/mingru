import * as mm from 'mingru-models';
import * as assert from 'assert';
import * as mr from '../..';
import post from '../models/post';
import user from '../models/user';

const eq = assert.equal;
const dialect = mr.mysql;

it('Delete', () => {
  class PostTA extends mm.TableActions {
    t = mm.unsafeDeleteAll().byID();
  }
  const postTA = mm.tableActions(post, PostTA);
  const v = postTA.t;
  const io = mr.deleteIO(v, dialect);

  assert.ok(io instanceof mr.DeleteIO);
  eq(io.sql, 'DELETE FROM `db_post` WHERE `id` = ?');
});

it('Delete with where', () => {
  class PostTA extends mm.TableActions {
    t = mm.unsafeDeleteAll().whereSQL(mm.sql`${post.id} = 1`);
  }
  const postTA = mm.tableActions(post, PostTA);
  const v = postTA.t;
  const io = mr.deleteIO(v, dialect);

  eq(io.sql, 'DELETE FROM `db_post` WHERE `id` = 1');
});

it('getInputs', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .deleteOne()
      .whereSQL(mm.sql`${user.id.toInput()} ${user.url_name.toInput()}`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, mr.mysql);
  eq(
    io.funcArgs.toString(),
    'queryable: mingru.Queryable|github.com/mgenware/mingru-go-lib, id: uint64, urlName: string',
  );
  eq(io.execArgs.toString(), 'id: uint64, urlName: string');
});

it('getReturns', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .deleteOne()
      .whereSQL(mm.sql`${user.id.toInput()} ${user.url_name.toInput()}`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, mr.mysql);
  const returns = io.returnValues;
  eq(returns.toString(), '');
});

it('getInputs (no WHERE)', () => {
  class UserTA extends mm.TableActions {
    t = mm.unsafeDeleteAll();
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const io = mr.deleteIO(v, mr.mysql);
  const inputs = io.funcArgs;
  eq(inputs.list.length, 1);
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
