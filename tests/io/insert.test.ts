import * as mm from 'mingru-models';
import { itThrows } from 'it-throws';
import * as mr from '../../dist/main.js';
import post from '../models/post.js';
import user from '../models/user.js';
import { commonIOOptions } from './common.js';
import { eq, ok } from '../assert-aliases.js';

it('Insert inputs', () => {
  class PostAG extends mm.ActionGroup {
    t = mm.unsafeInsert().setParams(post.title, post.user_id);
  }
  const postTA = mm.actionGroup(post, PostAG);
  const v = postTA.t;
  const io = mr.insertIO(v, commonIOOptions);

  ok(io instanceof mr.InsertIO);
  eq(io.getSQLCode(), '"INSERT INTO `db_post` (`title`, `user_id`) VALUES (?, ?)"');
});

it('Insert inputs and values', () => {
  class PostAG extends mm.ActionGroup {
    t = mm
      .unsafeInsert()
      .setParams(post.title, post.user_id)
      .set(post.datetime, mm.sql`NOW()`);
  }
  const postTA = mm.actionGroup(post, PostAG);
  const v = postTA.t;
  const io = mr.insertIO(v, commonIOOptions);

  ok(io instanceof mr.InsertIO);
  eq(
    io.getSQLCode(),
    '"INSERT INTO `db_post` (`title`, `user_id`, `datetime`) VALUES (?, ?, NOW())"',
  );
});

it('getInputs', () => {
  class UserAG extends mm.ActionGroup {
    t = mm
      .unsafeInsert()
      .setParams(user.sig, user.id)
      .set(user.url_name, user.url_name.toParam('b'));
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t;
  const io = mr.insertIO(v, commonIOOptions);
  eq(io.funcArgs.toString(), 'sig: *string, id: uint64, b: string');
  eq(io.execArgs.toString(), 'sig, id, b');
});

it('returnValues (insert)', () => {
  class UserAG extends mm.ActionGroup {
    t = mm
      .unsafeInsert()
      .setParams(user.sig, user.id)
      .set(user.url_name, user.url_name.toParam('b'));
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t;
  const io = mr.insertIO(v, commonIOOptions);
  eq(io.returnValues.toString(), '');
});

it('returnValues (insertOne)', () => {
  class UserAG extends mm.ActionGroup {
    t = mm
      .unsafeInsertOne()
      .setParams(user.sig, user.id)
      .set(user.url_name, user.url_name.toParam('b'));
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t;
  const io = mr.insertIO(v, commonIOOptions);
  eq(io.returnValues.toString(), '__insertedID: uint64');
});

it('Validate setters', () => {
  itThrows(() => {
    class PostAG extends mm.ActionGroup {
      t = mm.unsafeInsert().setParams(user.id);
    }
    const ta = mm.actionGroup(post, PostAG);
    mr.insertIO(ta.t, commonIOOptions);
  }, 'Source table assertion failed, expected "Post(post, db=db_post)", got "User(user)".');
});

it('setDefaults', () => {
  class Post extends mm.Table {
    id = mm.pk();
    title = mm.varChar(100);
    content = mm.varChar(100).default('');
    datetime = mm.datetime({ defaultToNow: 'utc' });
  }
  const post2 = mm.table(Post);

  class PostAG extends mm.ActionGroup {
    t = mm.insertOne().setDefaults().setParams();
  }
  const postTA = mm.actionGroup(post2, PostAG);
  const v = postTA.t;
  const io = mr.insertIO(v, commonIOOptions);

  eq(
    io.getSQLCode(),
    '"INSERT INTO `post` (`title`, `content`, `datetime`) VALUES (?, \'\', UTC_TIMESTAMP())"',
  );
});
