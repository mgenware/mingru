import * as mr from '../../';
import * as dd from 'dd-models';
import post from '../models/post';
import user from '../models/user';

const dialect = new mr.MySQL();

test('Update', () => {
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

  expect(io).toBeInstanceOf(mr.UpdateIO);
  expect(io.sql).toBe(
    'UPDATE `post` SET `title` = "haha", `content` = ?, `cmt_c` = `cmt_c` + 1 WHERE `id` = ?',
  );
  expect(io.setters.length).toBe(3);
  expect(io.setters[0].col).toBe(post.title);
  expect(io.setters[0].sql.sql.toString()).toBe('"haha"');
  expect(io.setters[1].col).toBe(post.content);
  expect(io.setters[2].col).toBe(post.cmtCount);
});

test('Update with where', () => {
  class PostTA extends dd.TA {
    t = dd
      .updateOne()
      .set(post.title, dd.sql`"haha"`)
      .where(dd.sql`${post.id} = 1`);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.updateIO(v, dialect);

  expect(io.sql).toBe('UPDATE `post` SET `title` = "haha" WHERE `id` = 1');
});

test('getInputs', () => {
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
  const io = mr.updateIO(v, new mr.MySQL());
  expect(io.setterArgs.toString()).toEqual('urlName: string, sig: *string');
  expect(io.funcArgs.toString()).toEqual(
    'id: uint64, urlName: string, sig: *string',
  );
});

test('getReturns', () => {
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
  const io = mr.updateIO(v, new mr.MySQL());
  expect(io.returnValues.toString()).toEqual('rows_affected: int');
});
