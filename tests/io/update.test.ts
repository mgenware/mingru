/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as mm from 'mingru-models';
import { itThrows } from 'it-throws';
import * as mr from '../../dist/main.js';
import post from '../models/post.js';
import user from '../models/user.js';
import { commonIOOptions } from './common.js';
import { eq, ok } from '../assert-aliases.js';

it('Update', () => {
  class PostAG extends mm.ActionGroup {
    t = mm
      .updateSome()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, mm.sql`${mm.param(post.content)}`)
      .set(post.cmtCount, mm.sql`${post.cmtCount} + 1`)
      .by(post.id);
  }
  const postTA = mm.actionGroup(post, PostAG);
  const v = postTA.t;
  const io = mr.updateIO(v, commonIOOptions);

  ok(io instanceof mr.UpdateIO);
  eq(
    io.getSQLCode(),
    '"UPDATE `db_post` SET `title` = \\"haha\\", `content` = ?, `cmt_c` = `cmt_c` + 1 WHERE `id` = ?"',
  );
  eq(io.setters.length, 3);
  eq(io.setters[0]!.col, post.title);
  eq(io.setters[0]!.sql.sql.toString(), '`"haha"`');
  eq(io.setters[1]!.col, post.content);
  eq(io.setters[2]!.col, post.cmtCount);
});

it('Update with WHERE', () => {
  class PostAG extends mm.ActionGroup {
    t = mm
      .updateOne()
      .set(post.title, mm.sql`"haha"`)
      .whereSQL(mm.sql`${post.id} = 1`);
  }
  const postTA = mm.actionGroup(post, PostAG);
  const v = postTA.t;
  const io = mr.updateIO(v, commonIOOptions);

  eq(io.getSQLCode(), '"UPDATE `db_post` SET `title` = \\"haha\\" WHERE `id` = 1"');
});

it('getInputs', () => {
  class UserAG extends mm.ActionGroup {
    t = mm
      .updateSome()
      .set(user.url_name, mm.sql`${mm.param(user.url_name)}`)
      .setParams(user.sig)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`)
      .whereSQL(mm.sql`${user.url_name.toParam()} ${user.id.toParam()} ${user.url_name.toParam()}`);
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t;
  const io = mr.updateIO(v, commonIOOptions);
  eq(io.setterArgs.toString(), 'urlName: string, sig: *string');
  eq(io.funcArgs.toString(), 'urlName: string, id: uint64, sig: *string');
  eq(io.execArgs.toString(), 'urlName, sig, urlName, id, urlName');
});

it('returnValues', () => {
  class UserAG extends mm.ActionGroup {
    t = mm
      .updateSome()
      .set(user.url_name, mm.sql`${mm.param(user.url_name)}`)
      .setParams(user.sig)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`)
      .whereSQL(mm.sql`${user.id.toParam()} ${user.url_name.toParam()}`);
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t;
  const io = mr.updateIO(v, commonIOOptions);
  eq(io.returnValues.toString(), '__rowsAffected: int');
});

it('Validate setters', () => {
  itThrows(() => {
    class PostAG extends mm.ActionGroup {
      t = mm.unsafeUpdateAll().setParams(user.id).setParams();
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
    t = mm.unsafeUpdateAll().setDefaults(post2.datetime);
  }
  const postTA = mm.actionGroup(post2, PostAG);
  const v = postTA.t;
  const io = mr.updateIO(v, commonIOOptions);

  eq(io.getSQLCode(), '"UPDATE `post` SET `datetime` = UTC_TIMESTAMP()"');
});

it('Input order in funcArgs and execArgs', () => {
  class PostAG extends mm.ActionGroup {
    t = mm
      .updateOne()
      .setParams(post.title, post.id)
      .whereSQL(mm.sql`${post.id} = ${post.id.toParam()}`);
  }
  const postTA = mm.actionGroup(post, PostAG);
  const v = postTA.t;
  const io = mr.updateIO(v, commonIOOptions);

  eq(io.setterArgs.toString(), 'title: string, id: uint64');
  eq(io.funcArgs.toString(), 'id: uint64, title: string');
  eq(io.execArgs.toString(), 'title, id, id');
});
