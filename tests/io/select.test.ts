import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';

const dialect = new mr.MySQL();

test('Basic', () => {
  const actions = dd.actions(user);
  const v = actions.select('t', user.id, user.name);
  const io = mr.select(v, dialect);

  expect(io.sql).toBe('SELECT `id`, `name` FROM `user`');
  expect(io.from).toBeInstanceOf(mr.TableIO);
  expect(io.where).toBeNull();
});

test('Where', () => {
  const actions = dd.actions(user);
  const v = actions.select('t', user.id, user.name)
    .where(dd.sql`${user.id} = 1`);
  const io = mr.select(v, dialect);

  expect(io.where).toBeInstanceOf(mr.SQLIO);
  expect(io.sql).toBe('SELECT `id`, `name` FROM `user` WHERE `id` = 1');
});

test('Basic join', () => {
  const actions = dd.actions(post);
  const v = actions.select('t', post.user_id.join(user).name, post.title);
  const io = mr.select(v, dialect);

  expect(io.sql).toBe('SELECT `_join_1`.`name`, `_main`.`title` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id`');
});

test('Same table, multiple cols join', () => {
  const actions = dd.actions(post);
  const v = actions.select(
      't',
      post.user_id.join(user).name,
      post.user_id.join(user).id,
      post.reviewer_id.join(user).name,
    );
  const io = mr.select(v, dialect);

  expect(io.sql).toBe('SELECT `_join_1`.`name`, `_join_1`.`id`, `_join_2`.`name` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id` INNER JOIN `user` AS `_join_2` ON `_join_2`.`id` = `_main`.`reviewer_id`');
});
