/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as mm from 'mingru-models';
import { itThrows } from 'it-throws';
import * as mr from '../../dist/main.js';
import post from '../models/post.js';
import user from '../models/user.js';
import { commonIOOptions } from './common.js';
import { eq, ok } from '../assert-aliases.js';

it('Update', () => {
  class PostTA extends mm.TableActions {
    t = mm
      .updateSome()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, mm.sql`${mm.input(post.content)}`)
      .set(post.cmtCount, mm.sql`${post.cmtCount} + 1`)
      .by(post.id);
  }
  const postTA = mm.tableActions(post, PostTA);
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
  class PostTA extends mm.TableActions {
    t = mm
      .updateOne()
      .set(post.title, mm.sql`"haha"`)
      .whereSQL(mm.sql`${post.id} = 1`);
  }
  const postTA = mm.tableActions(post, PostTA);
  const v = postTA.t;
  const io = mr.updateIO(v, commonIOOptions);

  eq(io.getSQLCode(), '"UPDATE `db_post` SET `title` = \\"haha\\" WHERE `id` = 1"');
});

it('getInputs', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .updateSome()
      .set(user.url_name, mm.sql`${mm.input(user.url_name)}`)
      .setInputs(user.sig)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`)
      .whereSQL(mm.sql`${user.url_name.toInput()} ${user.id.toInput()} ${user.url_name.toInput()}`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const io = mr.updateIO(v, commonIOOptions);
  eq(io.setterArgs.toString(), 'urlName: string, sig: *string');
  eq(io.funcArgs.toString(), 'urlName: string, sig: *string, id: uint64');
  eq(io.execArgs.toString(), 'urlName, sig, urlName, id, urlName');
});

it('returnValues', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .updateSome()
      .set(user.url_name, mm.sql`${mm.input(user.url_name)}`)
      .setInputs(user.sig)
      .set(user.follower_count, mm.sql`${user.follower_count} + 1`)
      .whereSQL(mm.sql`${user.id.toInput()} ${user.url_name.toInput()}`);
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const io = mr.updateIO(v, commonIOOptions);
  eq(io.returnValues.toString(), '__rowsAffected: int');
});

it('Validate setters', () => {
  itThrows(() => {
    class PostTA extends mm.TableActions {
      t = mm.unsafeUpdateAll().setInputs(user.id).setInputs();
    }
    const ta = mm.tableActions(post, PostTA);
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

  class PostTA extends mm.TableActions {
    t = mm.unsafeUpdateAll().setDefaults(post2.datetime);
  }
  const postTA = mm.tableActions(post2, PostTA);
  const v = postTA.t;
  const io = mr.updateIO(v, commonIOOptions);

  eq(io.getSQLCode(), '"UPDATE `post` SET `datetime` = UTC_TIMESTAMP()"');
});

it('Input order in funcArgs and execArgs', () => {
  class PostTA extends mm.TableActions {
    t = mm
      .updateOne()
      .setInputs(post.title, post.id)
      .whereSQL(mm.sql`${post.id} = ${post.id.toInput()}`);
  }
  const postTA = mm.tableActions(post, PostTA);
  const v = postTA.t;
  const io = mr.updateIO(v, commonIOOptions);

  eq(io.setterArgs.toString(), 'title: string, id: uint64');
  eq(io.funcArgs.toString(), 'title: string, id: uint64');
  eq(io.execArgs.toString(), 'title, id, id');
});
