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
  class ColsAG extends mm.ActionGroup {
    insertT = mm.insert().setParams(cols.fk).setDefaults();
  }
  const ag = mm.actionGroup(cols, ColsAG);
  const v = ag.insertT;
  const io = mr.insertIO(v, commonIOOptions);

  eq(
    io.getSQLCode(),
    "\"INSERT INTO `cols` (`text`, `int`, `nullable`, `def_int`, `def_var_char`, `def_time`, `fk`) VALUES ('', 0, NULL, -3, '一二', CURTIME(), ?)\"",
  );
});

it('insertWithDefaults (FSP)', () => {
  class T extends mm.Table {
    dt = mm.datetime({ defaultToNow: 'server', fsp: 3 });
    dtUtc = mm.datetime({ defaultToNow: 'utc', fsp: 3 });
    d = mm.date({ defaultToNow: 'server', fsp: 3 });
    t = mm.time({ defaultToNow: 'server', fsp: 3 });
    ts = mm.timestamp({ defaultToNow: 'utc', fsp: 3 });
  }
  const t = mm.table(T);
  class TAG extends mm.ActionGroup {
    insertT = mm.insert().setDefaults();
  }
  const ag = mm.actionGroup(t, TAG);
  const v = ag.insertT;
  const io = mr.insertIO(v, commonIOOptions);

  eq(
    io.getSQLCode(),
    '"INSERT INTO `t` (`dt`, `dt_utc`, `d`, `t`, `ts`) VALUES (NOW(3), UTC_TIMESTAMP(3), CURDATE(3), CURTIME(3), NOW(3))"',
  );
});
