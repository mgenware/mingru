import * as mm from 'mingru-models';
import * as mr from '../../dist/main.js';
import cols from '../models/cols.js';
import { commonIOOptions } from './common.js';
import { eq } from '../assert-aliases.js';

it('dtDefault', () => {
  const { dt } = mm;
  const defaults: Array<[string, unknown]> = [
    [dt.bigInt, 0],
    [dt.int, 0],
    [dt.smallInt, 0],
    [dt.tinyInt, 0],
    [dt.bool, false],
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
    eq(mr.dtDefault(type), def);
  }
});

it('insertWithDefaults', () => {
  class ColsTA extends mm.ActionGroup {
    insertT = mm.insert().setInputs(cols.fk).setDefaults();
  }
  const ta = mm.actionGroup(cols, ColsTA);
  const v = ta.insertT;
  const io = mr.insertIO(v, commonIOOptions);

  eq(
    io.getSQLCode(),
    "\"INSERT INTO `cols` (`fk`, `text`, `int`, `nullable`, `def_int`, `def_var_char`, `def_time`) VALUES (?, '', 0, NULL, -3, '一二', CURTIME())\"",
  );
});
