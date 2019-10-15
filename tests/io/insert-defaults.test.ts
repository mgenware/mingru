import * as mr from '../../';
import * as mm from 'mingru-models';
import cols from '../models/cols';
import * as assert from 'assert';

const dialect = mr.mysql;

it('dtDefault', () => {
  const { dt } = mm;
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
    assert.equal(mr.dtDefault(type), def);
  }
});

it('insertWithDefaults', () => {
  class ColsTA extends mm.TableActions {
    insertT = mm
      .insert()
      .setInputs(cols.fk)
      .setDefaults();
  }
  const ta = mm.ta(cols, ColsTA);
  const v = ta.insertT;
  const io = mr.insertIO(v, dialect);

  assert.equal(
    io.sql,
    "INSERT INTO `cols` (`fk`, `text`, `int`, `nullable`, `def_int`, `def_var_char`, `def_time`) VALUES (?, '', 0, NULL, -3, '一二', CURTIME())",
  );
});
