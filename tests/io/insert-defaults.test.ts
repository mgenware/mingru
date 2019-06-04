import * as mr from '../../';
import * as dd from 'dd-models';
import cols from '../models/cols';

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

test('insertWithDefaults', () => {
  class ColsTA extends dd.TA {
    insertT = dd.insertWithDefaults().setInputs(cols.fk);
  }
  const ta = dd.ta(cols, ColsTA);
  const v = ta.insertT;
  const io = mr.insertIO(v, dialect);

  expect(io.sql).toBe(
    "INSERT INTO `cols` (`fk`, `text`, `int`, `nullable`, `def_int`, `def_var_char`, `def_time`) VALUES (?, '', 0, NULL, -3, '一二', CURTIME())",
  );
});
