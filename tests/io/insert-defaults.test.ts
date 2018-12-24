import * as mr from '../../';
import * as dd from 'dd-models';
import post from '../models/post';

const dialect = new mr.MySQL();

test('dtDefault', () => {
  const { dt } = dd;
  const defaults: Array<[string, unknown]> = [
    [dt.bigInt, 0],
    [dt.int, 0],
    [dt.smallInt, 0],
    [dt.tinyInt, 0],
    [dt.bool, 0],
    [dt.varChar, ''],
    [dt.char, ''],
    [dt.text, ''],
    [dt.float, 0.0],
    [dt.double, 0.0],
    [dt.datetime, null],
    [dt.date, null],
    [dt.time, null],
  ];

  for (const [type, def] of defaults) {
    expect(mr.dtDefault(type)).toBe(def);
  }
});

test('', () => {
  const actions = dd.actions(post);
  const v = actions.insert('t').setInputs(post.title, post.user_id);
  const io = mr.io.toInsertIO(v, dialect);

  expect(io).toBeInstanceOf(mr.io.InsertIO);
  expect(io.sql).toBe('INSERT INTO `post` (`title`, `user_id`) VALUES (?, ?)');
  expect(io.table).toBeInstanceOf(mr.io.TableIO);
});
