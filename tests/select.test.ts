import { MySQL, Select } from '..';
import user from './models/user';

test('Raw col names', () => {
  const v = new Select(['id', 'name'], user, new MySQL());
  expect(v.toString()).toBe('SELECT id, name FROM `user`');
});

test('*', () => {
  const v = new Select(['*'], user, new MySQL());
  expect(v.toString()).toBe('SELECT * FROM `user`');
});

test('Col names', () => {
  const v = new Select([user.id, user.name], user, new MySQL());
  expect(v.toString()).toBe('SELECT `id`, `name` FROM `user`');
});
