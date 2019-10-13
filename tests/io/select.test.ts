import * as mr from '../../';
import * as dd from 'mingru-models';
import user from '../models/user';
import post from '../models/post';
import cmt from '../models/cmt';
import rpl from '../models/postReply';
import * as assert from 'assert';
import postCmt from '../models/postCmt';
import cmt2 from '../models/cmt2';

const expect = assert.equal;
const dialect = mr.mysql;

it('Select', () => {
  class UserTA extends dd.TableActions {
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
  class UserTA extends dd.TableActions {
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
  class UserTA extends dd.TableActions {
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
  class PostTA extends dd.TableActions {
    t = dd.select(post.user_id.join(user).url_name, post.title);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.selectIO(v, dialect);

  expect(
    io.sql,
    'SELECT `join_1`.`url_name` AS `userUrlName`, `db_post`.`title` AS `title` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`',
  );
});

it('Multiple cols join and custom table name', () => {
  class RplTA extends dd.TableActions {
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
  class PostTA extends dd.TableActions {
    t = dd.select(post.user_id, post.user_id.join(rpl).to_user_id);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.selectIO(v, dialect);

  expect(
    io.sql,
    'SELECT `db_post`.`user_id` AS `userID`, `join_1`.`to_user_id` AS `userToUserID` FROM `db_post` AS `db_post` INNER JOIN `post_cmt_rpl` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`',
  );
});

it('Join a table with custom column name', () => {
  class PostTA extends dd.TableActions {
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
    'SELECT `db_post`.`user_id` AS `userID`, `join_1`.`to_user_id` AS `userToUserID` FROM `db_post` AS `db_post` INNER JOIN `post_cmt_rpl` AS `join_1` ON `join_1`.`haha` = `db_post`.`user_id`',
  );
});

it('3-table joins and where', () => {
  class CmtTA extends dd.TableActions {
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
    'SELECT `post_cmt`.`id` AS `id`, `post_cmt`.`user_id` AS `userID`, `join_1`.`title` AS `targetTitle`, `join_1`.`user_id` AS `targetUserID`, `join_2`.`url_name` AS `targetUserUrlName`, `join_2`.`id` AS `TUID2` FROM `post_cmt` AS `post_cmt` INNER JOIN `db_post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `target`.`user_id` WHERE `post_cmt`.`user_id` = 1 AND `join_1`.`title` = 2 AND `join_2`.`url_name` = 3',
  );
});

it('Join and from', () => {
  const jCmt = postCmt.cmt_id.join(cmt2);
  class PostTA extends dd.TableActions {
    selectT = dd
      .select(
        jCmt.content,
        jCmt.created_at,
        jCmt.modified_at,
        jCmt.rpl_count,
        jCmt.user_id,
        jCmt.user_id.join(user).url_name,
      )
      .from(postCmt)
      .by(postCmt.post_id);
  }
  const ta = dd.ta(post, PostTA);
  const io = mr.selectIO(ta.selectT, dialect);

  expect(ta.__table, post);
  expect(ta.selectT.__table, postCmt);
  expect(
    io.sql,
    'SELECT `join_1`.`content` AS `cmtContent`, `join_1`.`created_at` AS `cmtCreatedAt`, `join_1`.`modified_at` AS `cmtModifiedAt`, `join_1`.`rpl_count` AS `cmtRplCount`, `join_1`.`user_id` AS `cmtUserID`, `join_2`.`url_name` AS `cmtUserUrlName` FROM `post_cmt` AS `post_cmt` INNER JOIN `cmt` AS `join_1` ON `join_1`.`id` = `post_cmt`.`cmt_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `cmt`.`user_id` WHERE `post_cmt`.`post_id` = ?',
  );
});

it('AS', () => {
  class CmtTA extends dd.TableActions {
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
    'SELECT `post_cmt`.`id` AS `id`, `post_cmt`.`user_id` AS `a`, `join_1`.`title` AS `b`, `join_2`.`url_name` AS `targetUserUrlName`, `join_2`.`url_name` AS `c` FROM `post_cmt` AS `post_cmt` INNER JOIN `db_post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `target`.`user_id`',
  );
});

it('Duplicate selected names', () => {
  class PostTA extends dd.TableActions {
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
  class UserTA extends dd.TableActions {
    t = dd
      .select(user.id, user.url_name)
      .where(
        dd.sql`${user.id.toInput()} ${user.url_name.toInput()} ${user.id.toInput()}`,
      );
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.selectIO(v, mr.mysql);
  expect(
    io.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, id: uint64, urlName: string',
  );
});

it('getInputs (no WHERE)', () => {
  class UserTA extends dd.TableActions {
    t = dd.select(user.id, user.url_name);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.selectIO(v, mr.mysql);
  expect(io.funcArgs.list.length, 1);
});

it('getReturns', () => {
  class UserTA extends dd.TableActions {
    t = dd
      .select(user.id)
      .where(
        dd.sql`${user.id.toInput()} ${post.title.toInput()} ${user.id.toInput()}`,
      );
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.selectIO(v, mr.mysql);
  expect(
    io.returnValues.toString(),
    'result: *UserTableTResult(UserTableTResult)',
  );
});

it('GROUP BY and HAVING', () => {
  const yearCol = dd.sel(dd.year(post.datetime), 'year');
  class PostTA extends dd.TableActions {
    t = dd
      .select(yearCol, dd.sel(dd.sum(post.cmtCount), 'total'))
      .byID()
      .groupBy(yearCol, 'total')
      .having(dd.and(dd.sql`${yearCol} > 2010`, dd.sql`\`total\` > 100`));
  }
  const ta = dd.ta(post, PostTA);
  const v = ta.t;
  const io = mr.selectIO(v, mr.mysql);
  expect(
    io.sql,
    'SELECT YEAR(`datetime`) AS `year`, SUM(`cmt_c`) AS `total` FROM `db_post` WHERE `id` = ? GROUP BY `year`, `total` HAVING `year` > 2010 AND `total` > 100',
  );
});

it('Unrelated cols', () => {
  class UserTA extends dd.TableActions {
    t = dd.select(post.user_id);
  }
  assert.throws(() => {
    const ta = dd.ta(user, UserTA);
    const v = ta.t;
    mr.selectIO(v, mr.mysql);
  });
});
