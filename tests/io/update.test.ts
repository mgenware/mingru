import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';

const dialect = new mr.MySQL();

test('Basic', () => {
  const actions = dd.actions(user);
  const v = actions.update('t')
    .set(user.name, dd.sql`haha`)
    .set(user.age, dd.sql`${user.age} + 1`);
  const io = mr.update(v, dialect);

  expect(io.sql).toBe('UPDATE `user` SET `name` = haha SET `age` = `age` + 1');
  expect(io.table).toBeInstanceOf(mr.TableIO);
});
