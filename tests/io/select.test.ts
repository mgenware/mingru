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
    'SELECT `_join_1`.`url_name` AS `postUserUrlName`, `_main`.`title` AS `postTitle` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id`',
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
    'SELECT `_join_1`.`url_name` AS `postCmtRplUserUrlName`, `_join_1`.`id` AS `postCmtRplUserID`, `_join_2`.`url_name` AS `postCmtRplToUserUrlName` FROM `post_cmt_rpl` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id` INNER JOIN `user` AS `_join_2` ON `_join_2`.`id` = `_main`.`to_user_id`',
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
    'SELECT `_main`.`id` AS `postCmtID`, `_main`.`user_id` AS `postCmtUserID`, `_join_1`.`title` AS `postCmtTargetTitle`, `_join_1`.`user_id` AS `postCmtTargetUser`, `_join_2`.`url_name` AS `postCmtTargetUserUrlName`, `_join_2`.`id` AS `postCmtTargetUserID` FROM `post_cmt` AS `_main` INNER JOIN `post` AS `_join_1` ON `_join_1`.`id` = `_main`.`target_id` INNER JOIN `user` AS `_join_2` ON `_join_2`.`id` = `_main`.`user_id`',
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
    'SELECT `_main`.`id` AS `postCmtID`, `_main`.`user_id` AS `a`, `_join_1`.`title` AS `b`, `_join_2`.`url_name` AS `postCmtTargetUserUrlName`, `_join_2`.`url_name` AS `c` FROM `post_cmt` AS `_main` INNER JOIN `post` AS `_join_1` ON `_join_1`.`id` = `_main`.`target_id` INNER JOIN `user` AS `_join_2` ON `_join_2`.`id` = `_main`.`user_id`',
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
  expect(cols[i++].varName).toBe('postTitle');
  expect(cols[i++].varName).toBe('postTitle2');
  expect(cols[i++].varName).toBe('a');
  expect(cols[i++].varName).toBe('postTitle3');
  expect(cols[i++].varName).toBe('a2');
  expect(cols[i++].varName).toBe('a3');
  expect(cols[i++].varName).toBe('postUserUrlName');
  expect(cols[i++].varName).toBe('postUserUrlName2');
  expect(cols[i++].varName).toBe('a4');
});
