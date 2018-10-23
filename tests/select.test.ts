import { MySQL, Select } from '..';
import user from './models/user';
import post from './models/post';

const mysql = new MySQL();

test('Raw col names', () => {
  const v = new Select(['id', 'name'], user, mysql);
  expect(v.toString()).toBe('SELECT id, name FROM `user`');
});

test('*', () => {
  const v = new Select(['*'], user, mysql);
  expect(v.toString()).toBe('SELECT * FROM `user`');
});

test('Col names', () => {
  const v = new Select([user.id, user.name], user, mysql);
  expect(v.toString()).toBe('SELECT `id`, `name` FROM `user`');
});
