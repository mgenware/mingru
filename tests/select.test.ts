import { MySQL, select } from '..';
import * as dd from 'dd-models';
import user from './models/user';
import post from './models/post';

const dialect = new MySQL();

test('Basic', () => {
  const v = dd.action('t')
    .select(user.id, user.nick)
    .from(user);
  const io = select(v, dialect);

  expect(io.sql).toBe('SELECT `id`, `nick` FROM `user`');
});

test('Basic join', () => {
  const v = dd.action('t')
  .select(post.user_id.join(user).nick, post.title)
  .from(post);
  const io = select(v, dialect);

  expect(io.sql).toBe('SELECT `_join_1`.`nick`, `_main`.`title` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id`');
});

test('Same table, multiple cols join', () => {
  const v = dd.action('t')
    .select(
      post.user_id.join(user).nick,
      post.user_id.join(user).id,
      post.reviewer_id.join(user).nick,
    )
    .from(post);
  const io = select(v, dialect);

  expect(io.sql).toBe('SELECT `_join_1`.`nick`, `_join_1`.`id`, `_join_2`.`nick` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id` INNER JOIN `user` AS `_join_2` ON `_join_2`.`id` = `_main`.`reviewer_id`');
});
