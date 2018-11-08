import * as mr from '../..';
import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';

const dialect = new mr.MySQL();

test('Basic', () => {
  const v = dd.action('t')
    .select(user.id, user.name)
    .from(user);
  const io = mr.select(v, dialect);

  expect(io.sql).toBe('SELECT `id`, `name` FROM `user`');
  expect(io.from).toBeInstanceOf(mr.TableIO);
});

test('Basic join', () => {
  const v = dd.action('t')
  .select(post.user_id.join(user).name, post.title)
  .from(post);
  const io = mr.select(v, dialect);

  expect(io.sql).toBe('SELECT `_join_1`.`name`, `_main`.`title` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id`');
});

test('Same table, multiple cols join', () => {
  const v = dd.action('t')
    .select(
      post.user_id.join(user).name,
      post.user_id.join(user).id,
      post.reviewer_id.join(user).name,
    )
    .from(post);
  const io = mr.select(v, dialect);

  expect(io.sql).toBe('SELECT `_join_1`.`name`, `_join_1`.`id`, `_join_2`.`name` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id` INNER JOIN `user` AS `_join_2` ON `_join_2`.`id` = `_main`.`reviewer_id`');
});
