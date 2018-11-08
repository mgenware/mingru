import { MySQL, update } from '../..';
import * as dd from 'dd-models';
import user from '../models/user';

const dialect = new MySQL();

test('Basic', () => {
  const v = dd.action('t')
    .update(user)
    .set(user.name, dd.sql`haha`)
    .set(user.age, dd.sql`${user.age} + 1`);
  const io = update(v, dialect);

  expect(io.sql).toBe('SELECT `id`, `nick` FROM `user`');
});
