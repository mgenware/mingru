import * as mm from 'mingru-models';
import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mr from '../../dist/main.js';
import user from '../models/user.js';
import post from '../models/post.js';
import cmt from '../models/cmt.js';
import rpl from '../models/postReply.js';
import postCmt from '../models/postCmt.js';
import cmt2 from '../models/cmt2.js';
import { commonIOOptions } from './common.js';
import { eq, ok } from '../assert-aliases.js';

it('Select', () => {
  class UserAG extends mm.ActionGroup {
    t = mm.selectRow(user.id, user.url_name);
  }
  const userTA = mm.actionGroup(user, UserAG);
  const v = userTA.t;
  const io = mr.selectIO(v, commonIOOptions);

  ok(io instanceof mr.SelectIO);
  eq(io.getSQLCode(), '"SELECT `id`, `url_name` FROM `user`"');
  eq(io.whereIO, null);
});

it('Where', () => {
  class UserAG extends mm.ActionGroup {
    t = mm
      .selectRow(user.id, user.url_name)
      .whereSQL(mm.sql`${user.id} = 1 ${user.id.toParam()} ${user.id.toParam()}`);
  }
  const userTA = mm.actionGroup(user, UserAG);
  const v = userTA.t;
  const io = mr.selectIO(v, commonIOOptions);

  ok(io.whereIO instanceof mr.SQLIO);
  eq(io.getSQLCode(), '"SELECT `id`, `url_name` FROM `user` WHERE `id` = 1 ? ?"');
});

it('Where and inputs', () => {
  class UserAG extends mm.ActionGroup {
    t = mm
      .selectRow(user.id, user.url_name)
      .whereSQL(
        mm.sql`${user.id} = ${mm.param(user.id)} && ${user.url_name} = ${mm.param(
          { type: 'string', defaultValue: null },
          'userName',
        )}`,
      );
  }
  const userTA = mm.actionGroup(user, UserAG);
  const v = userTA.t;
  const io = mr.selectIO(v, commonIOOptions);

  ok(io.whereIO instanceof mr.SQLIO);
  eq(io.getSQLCode(), '"SELECT `id`, `url_name` FROM `user` WHERE `id` = ? && `url_name` = ?"');
});

it('Basic join', () => {
  class PostAG extends mm.ActionGroup {
    t = mm.selectRow(post.user_id.join(user).url_name, post.title);
  }
  const postTA = mm.actionGroup(post, PostAG);
  const v = postTA.t;
  const io = mr.selectIO(v, commonIOOptions);

  eq(
    io.getSQLCode(),
    '"SELECT `join_1`.`url_name`, `db_post`.`title` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`"',
  );
});

it('Multiple cols join and custom table name', () => {
  class RplAG extends mm.ActionGroup {
    t = mm.selectRow(
      rpl.user_id.join(user).url_name,
      rpl.user_id.join(user).id,
      rpl.to_user_id.join(user).url_name,
    );
  }
  const rplTA = mm.actionGroup(rpl, RplAG);
  const v = rplTA.t;
  const io = mr.selectIO(v, commonIOOptions);

  eq(
    io.getSQLCode(),
    '"SELECT `join_1`.`url_name`, `join_1`.`id`, `join_2`.`url_name` FROM `post_cmt_rpl` AS `post_cmt_rpl` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post_cmt_rpl`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `post_cmt_rpl`.`to_user_id`"',
  );
});

it('Join a table with custom table name', () => {
  class PostAG extends mm.ActionGroup {
    t = mm.selectRow(post.user_id, post.user_id.join(rpl).to_user_id);
  }
  const postTA = mm.actionGroup(post, PostAG);
  const v = postTA.t;
  const io = mr.selectIO(v, commonIOOptions);

  eq(
    io.getSQLCode(),
    '"SELECT `db_post`.`user_id`, `join_1`.`to_user_id` FROM `db_post` AS `db_post` INNER JOIN `post_cmt_rpl` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`"',
  );
});

it('Join a table with custom column name', () => {
  class PostAG extends mm.ActionGroup {
    t = mm.selectRow(post.user_id, post.user_id.join(rpl, rpl.custom_id).to_user_id);
  }
  const postTA = mm.actionGroup(post, PostAG);
  const v = postTA.t;
  const io = mr.selectIO(v, commonIOOptions);

  eq(
    io.getSQLCode(),
    '"SELECT `db_post`.`user_id`, `join_1`.`to_user_id` FROM `db_post` AS `db_post` INNER JOIN `post_cmt_rpl` AS `join_1` ON `join_1`.`haha` = `db_post`.`user_id`"',
  );
});

it('3-table joins and WHERE', () => {
  class CmtAG extends mm.ActionGroup {
    t = mm
      .selectRow(
        cmt.id,
        cmt.user_id,
        cmt.target_id.join(post).title,
        cmt.target_id.join(post).user_id,
        cmt.target_id.join(post).user_id.join(user).url_name,
        cmt.target_id.join(post).user_id.join(user).id.as('TUID2'),
      )
      .whereSQL(
        mm.sql`${cmt.user_id} = 1 AND ${cmt.target_id.join(post).title} = 2 | ${cmt.target_id
          .join(post)
          .user_id.join(user)
          .url_name.isEqualToParam()} | ${cmt.id.isEqualToParam()} | ${cmt.target_id.isEqualToParam()}`,
      );
  }
  const cmtTA = mm.actionGroup(cmt, CmtAG);
  const v = cmtTA.t;
  const io = mr.selectIO(v, commonIOOptions);

  eq(
    io.getSQLCode(),
    '"SELECT `post_cmt`.`id`, `post_cmt`.`user_id`, `join_1`.`title`, `join_1`.`user_id`, `join_2`.`url_name`, `join_2`.`id` AS `tuid2` FROM `post_cmt` AS `post_cmt` INNER JOIN `db_post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `join_1`.`user_id` WHERE `post_cmt`.`user_id` = 1 AND `join_1`.`title` = 2 | `join_2`.`url_name` = ? | `post_cmt`.`id` = ? | `post_cmt`.`target_id` = ?"',
  );
});

it('Join and from', () => {
  const jCmt = postCmt.cmt_id.join(cmt2);
  class PostAG extends mm.ActionGroup {
    selectT = mm
      .selectRow(
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
  const ta = mm.actionGroup(post, PostAG);
  const io = mr.selectIO(ta.selectT, commonIOOptions);

  eq(ta.__getData().groupTable, post);
  eq(ta.selectT.__getData().sqlTable, postCmt);
  eq(
    io.getSQLCode(),
    '"SELECT `join_1`.`content`, `join_1`.`created_at`, `join_1`.`modified_at`, `join_1`.`rpl_count`, `join_1`.`user_id`, `join_2`.`url_name` FROM `post_cmt` AS `post_cmt` INNER JOIN `cmt` AS `join_1` ON `join_1`.`id` = `post_cmt`.`cmt_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `join_1`.`user_id` WHERE `post_cmt`.`post_id` = ?"',
  );
});

it('AS', () => {
  class CmtAG extends mm.ActionGroup {
    t = mm.selectRow(
      cmt.id,
      cmt.user_id.as('a'),
      cmt.target_id.join(post).title.as('b'),
      cmt.target_id.join(post).user_id.join(user).url_name,
      cmt.target_id.join(post).user_id.join(user).url_name.as('c'),
    );
  }
  const cmtTA = mm.actionGroup(cmt, CmtAG);
  const v = cmtTA.t;
  const io = mr.selectIO(v, commonIOOptions);

  eq(
    io.getSQLCode(),
    '"SELECT `post_cmt`.`id`, `post_cmt`.`user_id` AS `a`, `join_1`.`title` AS `b`, `join_2`.`url_name`, `join_2`.`url_name` AS `c` FROM `post_cmt` AS `post_cmt` INNER JOIN `db_post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `join_1`.`user_id`"',
  );
});

it('Duplicate selected names', () => {
  class PostAG extends mm.ActionGroup {
    t = mm.selectRow(
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
  const postTA = mm.actionGroup(post, PostAG);
  const v = postTA.t;
  itThrows(
    () => mr.selectIO(v, commonIOOptions),
    'The selected column name "title" already exists',
  );
});

it('getInputs', () => {
  class UserAG extends mm.ActionGroup {
    t = mm
      .selectRow(user.id, user.url_name)
      .whereSQL(mm.sql`${user.id.toParam()} ${user.url_name.toParam()} ${user.id.toParam()}`);
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t;
  const io = mr.selectIO(v, commonIOOptions);
  eq(io.funcArgs.toString(), 'id: uint64, urlName: string');
});

it('getInputs (no WHERE)', () => {
  class UserAG extends mm.ActionGroup {
    t = mm.selectRow(user.id, user.url_name);
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t;
  const io = mr.selectIO(v, commonIOOptions);
  eq(io.funcArgs.list.length, 0);
});

it('returnValues', () => {
  class UserAG extends mm.ActionGroup {
    t = mm
      .selectRow(user.id)
      .whereSQL(mm.sql`${user.id.toParam()} ${post.title.toParam()} ${user.id.toParam()}`);
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t;
  const io = mr.selectIO(v, commonIOOptions);
  eq(io.returnValues.toString(), '__result: UserTableTResult');
});

it('GROUP BY and HAVING', () => {
  const yearCol = mm.sel(mm.sql`${mm.year(post.datetime)}`, 'year');
  class PostAG extends mm.ActionGroup {
    t = mm
      .selectRow(yearCol, mm.sel(mm.sql`${mm.sum(post.cmtCount)}`, 'total'))
      .by(post.id)
      .groupBy(yearCol, 'total')
      .havingSQL(mm.and(mm.sql`${yearCol} > 2010`, mm.sql`\`total\` > 100`));
  }
  const ta = mm.actionGroup(post, PostAG);
  const v = ta.t;
  const io = mr.selectIO(v, commonIOOptions);
  eq(
    io.getSQLCode(),
    '"SELECT YEAR(`datetime`) AS `year`, SUM(`cmt_c`) AS `total` FROM `db_post` WHERE `id` = ? GROUP BY `year`, `total` HAVING (`year` > 2010 AND `total` > 100)"',
  );
});

it('Unrelated cols', () => {
  // Selected cols
  itThrows(() => {
    class UserAG extends mm.ActionGroup {
      t = mm.selectRow(post.user_id);
    }
    const ta = mm.actionGroup(user, UserAG);
    const v = ta.t;
    mr.selectIO(v, commonIOOptions);
  }, 'Source table assertion failed, expected "User(user)", got "Post(post, db=db_post)". [Validating source of column Column(user_id, t=Post(post, db=db_post))]');

  // WHERE col
  itThrows(() => {
    class UserAG extends mm.ActionGroup {
      t = mm.selectRow(user.id).whereSQL(mm.sql`${post.id}`);
    }
    const ta = mm.actionGroup(user, UserAG);
    const v = ta.t;
    mr.selectIO(v, commonIOOptions);
  }, 'Source table assertion failed, expected "User(user)", got "Post(post, db=db_post)". [Handling WHERE of SelectAction(t, t=User(user))]');

  // Do NOT throws on inputs
  assert.doesNotThrow(() => {
    class UserAG extends mm.ActionGroup {
      t = mm.selectRow(user.id).whereSQL(mm.sql`${post.id.toParam()}`);
    }
    const ta = mm.actionGroup(user, UserAG);
    const v = ta.t;
    mr.selectIO(v, commonIOOptions);
  });
});

it('Select DISTINCT', () => {
  class UserAG extends mm.ActionGroup {
    t = mm.selectRow(user.id, user.url_name).distinct();
  }
  const userTA = mm.actionGroup(user, UserAG);
  const v = userTA.t;
  const io = mr.selectIO(v, commonIOOptions);

  ok(io instanceof mr.SelectIO);
  eq(io.getSQLCode(), '"SELECT DISTINCT `id`, `url_name` FROM `user`"');
  eq(io.whereIO, null);
});

it('Join types', () => {
  class PostAG extends mm.ActionGroup {
    left = mm.selectRow(post.user_id.leftJoin(user).url_name);
    right = mm.selectRow(post.user_id.rightJoin(user).url_name);
    full = mm.selectRow(post.user_id.fullJoin(user).url_name);
  }
  const postTA = mm.actionGroup(post, PostAG);
  eq(
    mr.selectIO(postTA.left, commonIOOptions).getSQLCode(),
    '"SELECT `join_1`.`url_name` FROM `db_post` AS `db_post` LEFT JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`"',
  );
  eq(
    mr.selectIO(postTA.right, commonIOOptions).getSQLCode(),
    '"SELECT `join_1`.`url_name` FROM `db_post` AS `db_post` RIGHT JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`"',
  );
  eq(
    mr.selectIO(postTA.full, commonIOOptions).getSQLCode(),
    '"SELECT `join_1`.`url_name` FROM `db_post` AS `db_post` FULL JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`"',
  );
});
