import { MySQL, Select } from '..';
import user from './models/user';
import post from './models/post';

const mysql = new MySQL();

test('Basic', () => {
  const v = new Select('t', [user.id, user.nick], user);
  expect(v.name).toBe('t');
  expect(v.convert(mysql).sql).toBe('SELECT `id`, `name` FROM `user`');
});

test('Basic join', () => {
  const v = new Select('t', [post.user_id.join(user).nick, post.title], post);
  expect(v.convert(mysql).sql).toBe('SELECT `_join_1`.`nick`, _main.`title` FROM `post` AS _main INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id`');
});
