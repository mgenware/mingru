import * as mr from '../../';
import * as dd from 'mingru-models';
import post from '../models/post';
import user from '../models/user';
import * as assert from 'assert';

const expect = assert.equal;
const dialect = mr.mysql;

it('Update', () => {
  class PostTA extends dd.TA {
    t = dd
      .updateSome()
      .set(post.title, dd.sql`"haha"`)
      .set(post.content, dd.sql`${dd.input(post.content)}`)
      .set(post.cmtCount, dd.sql`${post.cmtCount} + 1`)
      .byID();
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.updateIO(v, dialect);

  assert.ok(io instanceof mr.UpdateIO);
  expect(
    io.sql,
    'UPDATE `db_post` SET `title` = "haha", `content` = ?, `cmt_c` = `cmt_c` + 1 WHERE `id` = ?',
  );
  expect(io.setters.length, 3);
  expect(io.setters[0].col, post.title);
  expect(io.setters[0].sql.sql.toString(), 'SQL(E("haha", type = 0))');
  expect(io.setters[1].col, post.content);
  expect(io.setters[2].col, post.cmtCount);
});

it('Update with where', () => {
  class PostTA extends dd.TA {
    t = dd
      .updateOne()
      .set(post.title, dd.sql`"haha"`)
      .where(dd.sql`${post.id} = 1`);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.updateIO(v, dialect);

  expect(io.sql, 'UPDATE `db_post` SET `title` = "haha" WHERE `id` = 1');
});

it('getInputs', () => {
  class UserTA extends dd.TA {
    t = dd
      .updateSome()
      .set(user.url_name, dd.sql`${dd.input(user.url_name)}`)
      .setInputs(user.sig)
      .set(user.follower_count, dd.sql`${user.follower_count} + 1`)
      .where(
        dd.sql`${user.url_name.toInput()} ${user.id.toInput()} ${user.url_name.toInput()}`,
      );
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.updateIO(v, mr.mysql);
  expect(io.setterArgs.toString(), 'urlName: string, sig: *string');
  expect(
    io.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64, urlName: string, sig: *string {queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64, sig: *string}',
  );
  expect(
    io.execArgs.toString(),
    'urlName: string, sig: *string, urlName: string, id: uint64, urlName: string {urlName: string, sig: *string, id: uint64}',
  );
});

it('getReturns', () => {
  class UserTA extends dd.TA {
    t = dd
      .updateSome()
      .set(user.url_name, dd.sql`${dd.input(user.url_name)}`)
      .setInputs(user.sig)
      .set(user.follower_count, dd.sql`${user.follower_count} + 1`)
      .where(dd.sql`${user.id.toInput()} ${user.url_name.toInput()}`);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.updateIO(v, mr.mysql);
  assert.deepEqual(io.returnValues.toString(), 'rowsAffected: int');
});
