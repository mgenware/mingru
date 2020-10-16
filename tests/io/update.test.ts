import * as mm from 'mingru-models';
import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mr from '../..';
import post from '../models/post';
import user from '../models/user';
import { ioOpt } from './common';

const eq = assert.equal;

it('Update', () => {
  class PostTA extends mm.TableActions {
    t = mm
      .updateSome()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, mm.sql`${mm.input(post.content)}`)
      .set(post.cmtCount, mm.sql`${post.cmtCount} + 1`)
      .byID();
  }
  const postTA = mm.tableActions(post, PostTA);
  const v = postTA.t;
  const io = mr.updateIO(v, ioOpt);

  assert.ok(io instanceof mr.UpdateIO);
  eq(
    io.getSQLCode(),
    '"UPDATE `db_post` SET `title` = \\"haha\\", `content` = ?, `cmt_c` = `cmt_c` + 1 WHERE `id` = ?"',
  );
  eq(io.setters.length, 3);
  eq(io.setters[0].col, post.title);
  eq(io.setters[0].sql.sql.toString(), 'SQL(E("haha", type = 0))');
  eq(io.setters[1].col, post.content);
  eq(io.setters[2].col, post.cmtCount);
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
  const io = mr.updateIO(v, ioOpt);

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
  const io = mr.updateIO(v, ioOpt);
  eq(io.setterArgs.toString(), 'urlName: string, sig: *string');
  eq(
    io.funcArgs.toString(),
    'queryable: mingru.Queryable|github.com/mgenware/mingru-go-lib, urlName: string, id: uint64, urlName: string, sig: *string {queryable: mingru.Queryable|github.com/mgenware/mingru-go-lib, urlName: string, id: uint64, sig: *string}',
  );
  eq(
    io.execArgs.toString(),
    'urlName: string, sig: *string, urlName: string, id: uint64, urlName: string {urlName: string, sig: *string, id: uint64}',
  );
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
  const io = mr.updateIO(v, ioOpt);
  assert.deepEqual(io.returnValues.toString(), '__rowsAffected: int');
});

it('Validate setters', () => {
  itThrows(() => {
    class PostTA extends mm.TableActions {
      t = mm.unsafeUpdateAll().setInputs(user.id).setInputs();
    }
    const ta = mm.tableActions(post, PostTA);
    mr.insertIO(ta.t, ioOpt);
  }, 'Source table assertion failed, expected "Table(post|db_post)", got "Table(user)".');
});

it('setDefaults', () => {
  class Post extends mm.Table {
    id = mm.pk();
    title = mm.varChar(100);
    content = mm.varChar(100).default('');
    datetime = mm.datetime('utc');
  }
  const post2 = mm.table(Post);

  class PostTA extends mm.TableActions {
    t = mm.unsafeUpdateAll().setDefaults(post2.datetime);
  }
  const postTA = mm.tableActions(post2, PostTA);
  const v = postTA.t;
  const io = mr.updateIO(v, ioOpt);

  eq(io.getSQLCode(), '"UPDATE `post` SET `datetime` = UTC_TIMESTAMP()"');
});
