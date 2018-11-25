import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';
import cmt from '../models/cmt';
import rpl from '../models/cmtReply';

const dialect = new mr.MySQL();

test('Basic', () => {
  const actions = dd.actions(user);
  const v = actions.select('t', user.id, user.url_name);
  const io = mr.select(v, dialect);

  expect(io.sql).toBe('SELECT `id`, `url_name` FROM `user`');
  expect(io.from).toBeInstanceOf(mr.TableIO);
  expect(io.where).toBeNull();
});

test('Where', () => {
  const actions = dd.actions(user);
  const v = actions.select('t', user.id, user.url_name)
    .where(dd.sql`${user.id} = 1`);
  const io = mr.select(v, dialect);

  expect(io.where).toBeInstanceOf(mr.SQLIO);
  expect(io.sql).toBe('SELECT `id`, `url_name` FROM `user` WHERE `id` = 1');
});

test('Where and inputs', () => {
  const actions = dd.actions(user);
  const v = actions.select('t', user.id, user.url_name)
    .where(dd.sql`${user.id} = ${dd.input(user.id)} && ${user.url_name} = ${dd.input('string', 'userName')}`);
  const io = mr.select(v, dialect);

  expect(io.where).toBeInstanceOf(mr.SQLIO);
  expect(io.sql).toBe('SELECT `id`, `url_name` FROM `user` WHERE `id` = ? && `url_name` = ?');
});

test('Basic join', () => {
  const actions = dd.actions(post);
  const v = actions.select('t', post.user_id.join(user).url_name, post.title);
  const io = mr.select(v, dialect);

  expect(io.sql).toBe('SELECT `_join_1`.`url_name` AS `postUserUrlName`, `_main`.`title` AS `postTitle` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id`');
});

test('Same table, multiple cols join', () => {
  const actions = dd.actions(rpl);
  const v = actions.select(
      't',
      rpl.user_id.join(user).url_name,
      rpl.user_id.join(user).id,
      rpl.to_user_id.join(user).url_name,
    );
  const io = mr.select(v, dialect);

  expect(io.sql).toBe('SELECT `_join_1`.`url_name` AS `postCmtRplUserUrlName`, `_join_1`.`id` AS `postCmtRplUserID`, `_join_2`.`url_name` AS `postCmtRplToUserUrlName` FROM `post_cmt_rpl` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id` INNER JOIN `user` AS `_join_2` ON `_join_2`.`id` = `_main`.`to_user_id`');
});

test('3-table joins', () => {
  const actions = dd.actions(cmt);
  const v = actions.select(
      't',
      cmt.id,
      cmt.user_id,
      cmt.target_id.join(post).user_id,
      cmt.target_id.join(post).title,
    );
  const io = mr.select(v, dialect);

  expect(io.sql).toBe('SELECT `_main`.`id` AS `post_cmtID`, `_main`.`user_id` AS `post_cmtUserID`, `_join_1`.`user_id` AS `postCmtTargetUser`, `_join_1`.`title` AS `postCmtTargetTitle` FROM `post_cmt` AS `_main` INNER JOIN `post` AS `_join_1` ON `_join_1`.`id` = `_main`.`target_id`');
});
