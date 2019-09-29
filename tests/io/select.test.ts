import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';
import cmt from '../models/cmt';
import rpl from '../models/postReply';
import * as assert from 'assert';

const expect = assert.equal;
const dialect = new mr.MySQL();

it('Select', () => {
  class UserTA extends dd.TA {
    t = dd.select(user.id, user.url_name);
  }
  const userTA = dd.ta(user, UserTA);
  const v = userTA.t;
  const io = mr.selectIO(v, dialect);

  assert.ok(io instanceof mr.SelectIO);
  expect(io.sql, 'SELECT `id`, `url_name` FROM `user`');
  expect(io.where, null);
});

it('Where', () => {
  class UserTA extends dd.TA {
    t = dd
      .select(user.id, user.url_name)
      .where(dd.sql`${user.id} = 1 ${user.id.toInput()} ${user.id.toInput()}`);
  }
  const userTA = dd.ta(user, UserTA);
  const v = userTA.t;
  const io = mr.selectIO(v, dialect);

  assert.ok(io.where instanceof mr.SQLIO);
  expect(io.sql, 'SELECT `id`, `url_name` FROM `user` WHERE `id` = 1 ? ?');
});

it('Where and inputs', () => {
  class UserTA extends dd.TA {
    t = dd
      .select(user.id, user.url_name)
      .where(
        dd.sql`${user.id} = ${dd.input(user.id)} && ${
          user.url_name
        } = ${dd.input('string', 'userName')}`,
      );
  }
  const userTA = dd.ta(user, UserTA);
  const v = userTA.t;
  const io = mr.selectIO(v, dialect);

  assert.ok(io.where instanceof mr.SQLIO);
  expect(
    io.sql,
    'SELECT `id`, `url_name` FROM `user` WHERE `id` = ? && `url_name` = ?',
  );
});

it('Basic join', () => {
  class PostTA extends dd.TA {
    t = dd.select(post.user_id.join(user).url_name, post.title);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.selectIO(v, dialect);

  expect(
    io.sql,
    'SELECT `join_1`.`url_name` AS `userUrlName`, `post`.`title` AS `title` FROM `post` AS `post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post`.`user_id`',
  );
});

it('Multiple cols join and custom table name', () => {
  class RplTA extends dd.TA {
    t = dd.select(
      rpl.user_id.join(user).url_name,
      rpl.user_id.join(user).id,
      rpl.to_user_id.join(user).url_name,
    );
  }
  const rplTA = dd.ta(rpl, RplTA);
  const v = rplTA.t;
  const io = mr.selectIO(v, dialect);

  expect(
    io.sql,
    'SELECT `join_1`.`url_name` AS `userUrlName`, `join_1`.`id` AS `userID`, `join_2`.`url_name` AS `toUserUrlName` FROM `post_cmt_rpl` AS `post_cmt_rpl` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post_cmt_rpl`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `post_cmt_rpl`.`to_user_id`',
  );
});

it('Join a table with custom table name', () => {
  class PostTA extends dd.TA {
    t = dd.select(post.user_id, post.user_id.join(rpl).to_user_id);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.selectIO(v, dialect);

  expect(
    io.sql,
    'SELECT `post`.`user_id` AS `userID`, `join_1`.`to_user_id` AS `userToUserID` FROM `post` AS `post` INNER JOIN `post_cmt_rpl` AS `join_1` ON `join_1`.`id` = `post`.`user_id`',
  );
});

it('Join a table with custom column name', () => {
  class PostTA extends dd.TA {
    t = dd.select(
      post.user_id,
      post.user_id.join(rpl, rpl.custom_id).to_user_id,
    );
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.selectIO(v, dialect);

  expect(
    io.sql,
    'SELECT `post`.`user_id` AS `userID`, `join_1`.`to_user_id` AS `userToUserID` FROM `post` AS `post` INNER JOIN `post_cmt_rpl` AS `join_1` ON `join_1`.`haha` = `post`.`user_id`',
  );
});

it('3-table joins and where', () => {
  class CmtTA extends dd.TA {
    t = dd
      .select(
        cmt.id,
        cmt.user_id,
        cmt.target_id.join(post).title,
        cmt.target_id.join(post).user_id,
        cmt.target_id.join(post).user_id.join(user).url_name,
        cmt.target_id
          .join(post)
          .user_id.join(user)
          .id.as('TUID2'),
      )
      .where(
        dd.sql`${cmt.user_id} = 1 AND ${
          cmt.target_id.join(post).title
        } = 2 AND ${cmt.target_id.join(post).user_id.join(user).url_name} = 3`,
      );
  }
  const cmtTA = dd.ta(cmt, CmtTA);
  const v = cmtTA.t;
  const io = mr.selectIO(v, dialect);

  expect(
    io.sql,
    'SELECT `post_cmt`.`id` AS `id`, `post_cmt`.`user_id` AS `userID`, `join_1`.`title` AS `targetTitle`, `join_1`.`user_id` AS `targetUserID`, `join_2`.`url_name` AS `targetUserUrlName`, `join_2`.`id` AS `TUID2` FROM `post_cmt` AS `post_cmt` INNER JOIN `post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `target`.`user_id` WHERE `post_cmt`.`user_id` = 1 AND `join_1`.`title` = 2 AND `join_2`.`url_name` = 3',
  );
});

it('AS', () => {
  class CmtTA extends dd.TA {
    t = dd.select(
      cmt.id,
      cmt.user_id.as('a'),
      cmt.target_id.join(post).title.as('b'),
      cmt.target_id.join(post).user_id.join(user).url_name,
      cmt.target_id
        .join(post)
        .user_id.join(user)
        .url_name.as('c'),
    );
  }
  const cmtTA = dd.ta(cmt, CmtTA);
  const v = cmtTA.t;
  const io = mr.selectIO(v, dialect);

  expect(
    io.sql,
    'SELECT `post_cmt`.`id` AS `id`, `post_cmt`.`user_id` AS `a`, `join_1`.`title` AS `b`, `join_2`.`url_name` AS `targetUserUrlName`, `join_2`.`url_name` AS `c` FROM `post_cmt` AS `post_cmt` INNER JOIN `post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `target`.`user_id`',
  );
});

it('Duplicate selected names', () => {
  class PostTA extends dd.TA {
    t = dd.select(
      post.title,
      post.title,
      post.title.as('a'),
      post.title,
      post.title.as('a'),
      post.user_id.as('a'),
      post.user_id.join(user).url_name,
      post.user_id.join(user).url_name,
      post.user_id.join(user).url_name.as('a'),
    );
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  assert.throws(() => mr.selectIO(v, dialect), 'already exists');
});

it('getInputs', () => {
  class UserTA extends dd.TA {
    t = dd
      .select(user.id, user.url_name)
      .where(
        dd.sql`${user.id.toInput()} ${user.url_name.toInput()} ${user.id.toInput()}`,
      );
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.selectIO(v, new mr.MySQL());
  expect(
    io.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, id: uint64, urlName: string',
  );
});

it('getInputs (no WHERE)', () => {
  class UserTA extends dd.TA {
    t = dd.select(user.id, user.url_name);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.selectIO(v, new mr.MySQL());
  expect(io.funcArgs.list.length, 1);
});

it('getInputs (with foreign tables)', () => {
  class UserTA extends dd.TA {
    t = dd
      .select(user.id, post.title)
      .where(
        dd.sql`${user.id.toInput()} ${post.title.toInput()} ${user.id.toInput()}`,
      );
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.selectIO(v, new mr.MySQL());
  expect(
    io.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, id: uint64, title: string',
  );
  expect(
    io.execArgs.toString(),
    'id: uint64, title: string, id: uint64 {id: uint64, title: string}',
  );
});

it('getReturns', () => {
  class UserTA extends dd.TA {
    t = dd
      .select(user.id, post.title)
      .where(
        dd.sql`${user.id.toInput()} ${post.title.toInput()} ${user.id.toInput()}`,
      );
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.selectIO(v, new mr.MySQL());
  assert.deepEqual(
    io.returnValues.toString(),
    'result: *UserTableTResult(UserTableTResult)',
  );
});

it('GROUP BY and HAVING', () => {
  const yearCol = dd.sel(dd.year(post.datetime), 'year');
  class PostTA extends dd.TA {
    t = dd
      .select(yearCol, dd.sel(dd.sum(post.cmtCount), 'total'))
      .byID()
      .groupBy(yearCol, 'total')
      .having(dd.and(dd.sql`$year > 2010`, dd.sql`total > 100`));
  }
  const ta = dd.ta(post, PostTA);
  const v = ta.t;
  const io = mr.selectIO(v, new mr.MySQL());
  expect(
    io.sql,
    'SELECT YEAR(`datetime`) AS `year`, SUM(`cmt_c`) AS `total` FROM `post` WHERE `id` = ? GROUP BY `year`, `total` HAVING `year` > 2010 AND `total` > 100',
  );
});
