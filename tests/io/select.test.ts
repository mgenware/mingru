import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';
import cmt from '../models/cmt';
import rpl from '../models/postReply';

const dialect = new mr.MySQL();

test('Select', () => {
  const actions = dd.actions(user);
  const v = actions.select('t', user.id, user.url_name);
  const io = mr.io.toSelectIO(v, dialect);

  expect(io).toBeInstanceOf(mr.io.SelectIO);
  expect(io.sql).toBe('SELECT `id`, `url_name` FROM `user`');
  expect(io.from).toBeInstanceOf(mr.io.TableIO);
  expect(io.where).toBeNull();
});

test('Where', () => {
  const actions = dd.actions(user);
  const v = actions
    .select('t', user.id, user.url_name)
    .where(dd.sql`${user.id} = 1`);
  const io = mr.io.toSelectIO(v, dialect);

  expect(io.where).toBeInstanceOf(mr.io.SQLIO);
  expect(io.sql).toBe('SELECT `id`, `url_name` FROM `user` WHERE `id` = 1');
});

test('Where and inputs', () => {
  const actions = dd.actions(user);
  const v = actions
    .select('t', user.id, user.url_name)
    .where(
      dd.sql`${user.id} = ${dd.input(user.id)} && ${user.url_name} = ${dd.input(
        'string',
        'userName',
      )}`,
    );
  const io = mr.io.toSelectIO(v, dialect);

  expect(io.where).toBeInstanceOf(mr.io.SQLIO);
  expect(io.sql).toBe(
    'SELECT `id`, `url_name` FROM `user` WHERE `id` = ? && `url_name` = ?',
  );
});

test('Basic join', () => {
  const actions = dd.actions(post);
  const v = actions.select('t', post.user_id.join(user).url_name, post.title);
  const io = mr.io.toSelectIO(v, dialect);

  expect(io.sql).toBe(
    'SELECT `join_1`.`url_name` AS `userUrlName`, `post`.`title` AS `title` FROM `post` AS `post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post`.`user_id`',
  );
});

test('Multiple cols join', () => {
  const actions = dd.actions(rpl);
  const v = actions.select(
    't',
    rpl.user_id.join(user).url_name,
    rpl.user_id.join(user).id,
    rpl.to_user_id.join(user).url_name,
  );
  const io = mr.io.toSelectIO(v, dialect);

  expect(io.sql).toBe(
    'SELECT `join_1`.`url_name` AS `userUrlName`, `join_1`.`id` AS `userID`, `join_2`.`url_name` AS `toUserUrlName` FROM `post_cmt_rpl` AS `post_cmt_rpl` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post_cmt_rpl`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `post_cmt_rpl`.`to_user_id`',
  );
});

test('3-table joins', () => {
  const actions = dd.actions(cmt);
  const v = actions.select(
    't',
    cmt.id,
    cmt.user_id,
    cmt.target_id.join(post).title,
    cmt.target_id.join(post).user_id,
    cmt.target_id.join(post).user_id.join(user).url_name,
    cmt.target_id.join(post).user_id.join(user).id,
  );
  const io = mr.io.toSelectIO(v, dialect);

  expect(io.sql).toBe(
    'SELECT `post_cmt`.`id` AS `id`, `post_cmt`.`user_id` AS `userID`, `join_1`.`title` AS `targetTitle`, `join_1`.`user_id` AS `targetUserID`, `join_2`.`url_name` AS `targetUserUrlName`, `join_2`.`id` AS `targetUserID2` FROM `post_cmt` AS `post_cmt` INNER JOIN `post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `target`.`user_id`',
  );
});

test('AS', () => {
  const actions = dd.actions(cmt);
  const v = actions.select(
    't',
    cmt.id,
    cmt.user_id.as('a'),
    cmt.target_id.join(post).title.as('b'),
    cmt.target_id.join(post).user_id.join(user).url_name,
    cmt.target_id
      .join(post)
      .user_id.join(user)
      .url_name.as('c'),
  );
  const io = mr.io.toSelectIO(v, dialect);

  expect(io.sql).toBe(
    'SELECT `post_cmt`.`id` AS `id`, `post_cmt`.`user_id` AS `a`, `join_1`.`title` AS `b`, `join_2`.`url_name` AS `targetUserUrlName`, `join_2`.`url_name` AS `c` FROM `post_cmt` AS `post_cmt` INNER JOIN `post` AS `join_1` ON `join_1`.`id` = `post_cmt`.`target_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `target`.`user_id`',
  );
});

test('Duplicate selected names', () => {
  const actions = dd.actions(post);
  const v = actions.select(
    't',
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
  const io = mr.io.toSelectIO(v, dialect);
  const { cols } = io;
  let i = 0;
  expect(cols[i++].inputName).toBe('title');
  expect(cols[i++].inputName).toBe('title2');
  expect(cols[i++].alias).toBe('a');
  expect(cols[i++].inputName).toBe('title3');
  expect(cols[i++].alias).toBe('a');
  expect(cols[i++].alias).toBe('a');
  expect(cols[i++].inputName).toBe('userUrlName');
  expect(cols[i++].inputName).toBe('userUrlName2');
  expect(cols[i++].alias).toBe('a');
});

test('Select nothing', () => {
  const actions = dd.actions(user);
  expect(() => actions.select('t')).toThrow('empty');
});
