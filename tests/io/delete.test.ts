import * as mm from 'mingru-models';
import * as mr from '../../dist/main.js';
import post from '../models/post.js';
import user from '../models/user.js';
import { commonIOOptions } from './common.js';
import { ok, eq } from '../assert-aliases.js';

it('Delete', () => {
  class PostAG extends mm.ActionGroup {
    t = mm.unsafeDeleteAll().by(post.id);
  }
  const postTA = mm.actionGroup(post, PostAG);
  const v = postTA.t;
  const io = mr.deleteIO(v, commonIOOptions);

  ok(io instanceof mr.DeleteIO);
  eq(io.getSQLCode(), '"DELETE FROM `db_post` WHERE `id` = ?"');
});

it('Delete with where', () => {
  class PostAG extends mm.ActionGroup {
    t = mm.unsafeDeleteAll().whereSQL(mm.sql`${post.id} = 1`);
  }
  const postTA = mm.actionGroup(post, PostAG);
  const v = postTA.t;
  const io = mr.deleteIO(v, commonIOOptions);

  eq(io.getSQLCode(), '"DELETE FROM `db_post` WHERE `id` = 1"');
});

it('getInputs', () => {
  class UserAG extends mm.ActionGroup {
    t = mm.deleteOne().whereSQL(mm.sql`${user.id.toParam()} ${user.url_name.toParam()}`);
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t;
  const io = mr.deleteIO(v, commonIOOptions);
  eq(io.funcArgs.toString(), 'id: uint64, urlName: string');
  eq(io.execArgs.toString(), 'id, urlName');
});

it('returnValues', () => {
  class UserAG extends mm.ActionGroup {
    t = mm.deleteOne().whereSQL(mm.sql`${user.id.toParam()} ${user.url_name.toParam()}`);
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t;
  const io = mr.deleteIO(v, commonIOOptions);
  const { returnValues } = io;
  eq(returnValues.toString(), '');
});

it('getInputs (no WHERE)', () => {
  class UserAG extends mm.ActionGroup {
    t = mm.unsafeDeleteAll();
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t;
  const io = mr.deleteIO(v, commonIOOptions);
  const inputs = io.funcArgs;
  eq(inputs.list.length, 0);
});

it('returnValues (no WHERE)', () => {
  class UserAG extends mm.ActionGroup {
    t = mm.unsafeDeleteAll();
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t;
  const io = mr.deleteIO(v, commonIOOptions);
  const { returnValues } = io;
  eq(returnValues.toString(), '__rowsAffected: int');
});
