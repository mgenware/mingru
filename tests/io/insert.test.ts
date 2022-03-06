import * as mm from 'mingru-models';
import { itThrows } from 'it-throws';
import * as mr from '../../dist/main.js';
import post from '../models/post.js';
import user from '../models/user.js';
import { commonIOOptions } from './common.js';
import { eq, ok } from '../assert-aliases.js';

it('Insert inputs', () => {
  class PostTA extends mm.TableActions {
    t = mm.unsafeInsert().setInputs(post.title, post.user_id);
  }
  const postTA = mm.tableActions(post, PostTA);
  const v = postTA.t;
  const io = mr.insertIO(v, commonIOOptions);

  ok(io instanceof mr.InsertIO);
  eq(io.getSQLCode(), '"INSERT INTO `db_post` (`title`, `user_id`) VALUES (?, ?)"');
});

it('Insert inputs and values', () => {
  class PostTA extends mm.TableActions {
    t = mm
      .unsafeInsert()
      .setInputs(post.title, post.user_id)
      .set(post.datetime, mm.sql`NOW()`);
  }
  const postTA = mm.tableActions(post, PostTA);
  const v = postTA.t;
  const io = mr.insertIO(v, commonIOOptions);

  ok(io instanceof mr.InsertIO);
  eq(
    io.getSQLCode(),
    '"INSERT INTO `db_post` (`title`, `user_id`, `datetime`) VALUES (?, ?, NOW())"',
  );
});

it('getInputs', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .unsafeInsert()
      .setInputs(user.sig, user.id)
      .set(user.url_name, user.url_name.toInput('b'));
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const io = mr.insertIO(v, commonIOOptions);
  eq(
    io.funcArgs.toString(),
    'mrQueryable: mingru.Queryable|github.com/mgenware/mingru-go-lib, sig: *string, id: uint64, b: string',
  );
  eq(io.execArgs.toString(), 'sig: *string, id: uint64, b: string');
});

it('returnValues (insert)', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .unsafeInsert()
      .setInputs(user.sig, user.id)
      .set(user.url_name, user.url_name.toInput('b'));
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const io = mr.insertIO(v, commonIOOptions);
  eq(io.returnValues.toString(), '');
});

it('returnValues (insertOne)', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .unsafeInsertOne()
      .setInputs(user.sig, user.id)
      .set(user.url_name, user.url_name.toInput('b'));
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t;
  const io = mr.insertIO(v, commonIOOptions);
  eq(io.returnValues.toString(), '__insertedID: uint64');
});

it('Validate setters', () => {
  itThrows(() => {
    class PostTA extends mm.TableActions {
      t = mm.unsafeInsert().setInputs(user.id);
    }
    const ta = mm.tableActions(post, PostTA);
    mr.insertIO(ta.t, commonIOOptions);
  }, 'Source table assertion failed, expected "Table(post|db_post)", got "Table(user)".');
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
    t = mm.insertOne().setDefaults().setInputs();
  }
  const postTA = mm.tableActions(post2, PostTA);
  const v = postTA.t;
  const io = mr.insertIO(v, commonIOOptions);

  eq(
    io.getSQLCode(),
    '"INSERT INTO `post` (`title`, `content`, `datetime`) VALUES (?, \'\', UTC_TIMESTAMP())"',
  );
});
