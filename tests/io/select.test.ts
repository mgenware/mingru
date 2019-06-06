import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';
import cmt from '../models/cmt';
import rpl from '../models/postReply';

const dialect = new mr.MySQL();

test('Select', () => {
  class UserTA extends dd.TA {
    t = dd.select(user.id, user.url_name);
  }
  const userTA = dd.ta(user, UserTA);
  const v = userTA.t;
  const io = mr.selectIO(v, dialect);

  expect(io).toBeInstanceOf(mr.SelectIO);
  expect(io.sql).toBe('SELECT `id`, `url_name` FROM `user`');
  expect(io.from).toBeInstanceOf(mr.TableIO);
  expect(io.where).toBeNull();
});

test('Where', () => {
  class UserTA extends dd.TA {
    t = dd.select(user.id, user.url_name).where(dd.sql`${user.id} = 1`);
  }
  const userTA = dd.ta(user, UserTA);
  const v = userTA.t;
  const io = mr.selectIO(v, dialect);

  expect(io.where).toBeInstanceOf(mr.SQLIO);
  expect(io.sql).toBe('SELECT `id`, `url_name` FROM `user` WHERE `id` = 1');
});

test('Where and inputs', () => {
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

  expect(io.where).toBeInstanceOf(mr.SQLIO);
  expect(io.sql).toBe(
    'SELECT `id`, `url_name` FROM `user` WHERE `id` = ? && `url_name` = ?',
  );
});

test('Basic join', () => {
  class PostTA extends dd.TA {
    t = dd.select(post.user_id.join(user).url_name, post.title);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.selectIO(v, dialect);

  expect(io.sql).toBe(
    'SELECT `join_1`.`url_name` AS `userUrlName`, `post`.`title` AS `title` FROM `post` AS `post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post`.`user_id`',
  );
});

test('Multiple cols join and custom table name', () => {
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

  expect(io.sql).toBe(
    'SELECT `join_1`.`url_name` AS `userUrlName`, `join_1`.`id` AS `userID`, `join_2`.`url_name` AS `toUserUrlName` FROM `post_cmt_rpl` AS `post_cmt_rpl` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post_cmt_rpl`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `post_cmt_rpl`.`to_user_id`',
  );
});

test('Join a table with custom table name', () => {
  class PostTA extends dd.TA {
    t = dd.select(post.user_id, post.user_id.join(rpl).to_user_id);
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.selectIO(v, dialect);

  expect(io.sql).toBe(
    'SELECT `post`.`user_id` AS `userID`, `join_1`.`to_user_id` AS `userToUserID` FROM `post` AS `post` INNER JOIN `post_cmt_rpl` AS `join_1` ON `join_1`.`id` = `post`.`user_id`',
  );
});

test('Join a table with custom column name', () => {
  class PostTA extends dd.TA {
    t = dd.select(
      post.user_id,
      post.user_id.join(rpl, rpl.custom_id).to_user_id,
    );
  }
  const postTA = dd.ta(post, PostTA);
  const v = postTA.t;
  const io = mr.selectIO(v, dialect);

  expect(io.sql).toBe(
    'SELECT `post`.`user_id` AS `userID`, `join_1`.`to_user_id` AS `userToUserID` FROM `post` AS `post` INNER JOIN `post_cmt_rpl` AS `join_1` ON `join_1`.`haha` = `post`.`user_id`',
  );
});

test('3-table joins and where', () => {
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

  expect(io.sql).toBe(
    'SELECT `post_cmt`.`id` AS `id`, `post_cmt`.`user_id` AS `userID`, `join_1`.`title` AS `targetTitle`, `join_1`.`user_id` AS `targetUserID`, `join_2`.`url_name` AS `targetUserUrlName`, `join_2`.`id` AS `TUID2` FROM `post_cmt` AS `post_cmt` INNER JOIN `post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `target`.`user_id` WHERE `post_cmt`.`user_id` = 1 AND `join_1`.`title` = 2 AND `join_2`.`url_name` = 3',
  );
});

test('AS', () => {
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

  expect(io.sql).toBe(
    'SELECT `post_cmt`.`id` AS `id`, `post_cmt`.`user_id` AS `a`, `join_1`.`title` AS `b`, `join_2`.`url_name` AS `targetUserUrlName`, `join_2`.`url_name` AS `c` FROM `post_cmt` AS `post_cmt` INNER JOIN `post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `target`.`user_id`',
  );
});

test('Duplicate selected names', () => {
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
  expect(() => mr.selectIO(v, dialect)).toThrow('already exists');
});

test('Select nothing', () => {
  expect(() => {
    class UserTA extends dd.TA {
      t = dd.select();
    }
    dd.ta(user, UserTA);
  }).toThrow('empty');
});

test('getInputs', () => {
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
  const inputs = io.getInputs();
  expect(inputs.list).toEqual([user.id.toInput(), user.url_name.toInput()]);
  expect(inputs.sealed).toBe(true);
});

test('getInputs (no WHERE)', () => {
  class UserTA extends dd.TA {
    t = dd.select(user.id, user.url_name);
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t;
  const io = mr.selectIO(v, new mr.MySQL());
  const inputs = io.getInputs();
  expect(inputs.list.length).toBe(0);
});

test('getInputs (with foreign tables)', () => {
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
  const inputs = io.getInputs();
  expect(inputs.list).toEqual([user.id.toInput(), post.title.toInput()]);
  expect(inputs.sealed).toBe(true);
});

test('getReturns', () => {
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
  const returns = io.getReturns();
  expect(returns.list).toEqual([
    new dd.SQLVariable('<Result>', mr.SelectedResultKey),
  ]);
  expect(returns.sealed).toBe(true);
});
