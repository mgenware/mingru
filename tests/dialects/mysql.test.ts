import * as mr from '../../';
import * as dd from 'dd-models';

const TimePkg = '"time"';

const dialect = new mr.MySQL();

function testType(col: dd.Column, type: string, pkg: string | null) {
  const tb = dialect.convertColumnType(col.type);
  let s = type;
  if (pkg) {
    s += `|${pkg}`;
  }
  expect(tb).toBe(s);
}

test('escape', () => {
  expect(dialect.escape('abc')).toBe('`abc`');
});

test('DT', () => {
  const tests: Array<[dd.Column, string, unknown]> = [
    // PK
    [dd.pk(), 'uint64', null],
    // Integer
    [dd.int(), 'int', null],
    [dd.uInt(), 'uint', null],
    [dd.bigInt(), 'int64', null],
    [dd.uBigInt(), 'uint64', null],
    [dd.smallInt(), 'int16', null],
    [dd.uSmallInt(), 'uint16', null],
    [dd.tinyInt(), 'int8', null],
    [dd.uTinyInt(), 'uint8', null],
    // String
    [dd.varChar(10), 'string', null],
    [dd.char(10), 'string', null],
    // Time
    [dd.datetime(), 'time.Time', TimePkg],
    [dd.date(), 'time.Time', TimePkg],
  ];

  for (const t of tests) {
    const column = t[0] as dd.Column;
    testType(column, t[1] as string, t[2] as string | null);
    if (!column.type.pk) {
      column.type.nullable = true;
      testType(column, ('*' + t[1]) as string, t[2] as string | null);
    }
  }
});

test('DT (not supported)', () => {
  const props = new dd.ColumnType(['type1', 'type2']);
  expect(() => dialect.convertColumnType(props)).toThrow('type2');
});

test('as', () => {
  expect(dialect.as('abc', 'def')).toBe('abc AS `def`');
});

test('SQL calls', () => {
  const t = dialect.sqlCall;
  expect(t(dd.SQLCallType.dateNow)).toBe('CURDATE');
  expect(t(dd.SQLCallType.timeNow)).toBe('CURTIME');
  expect(t(dd.SQLCallType.datetimeNow)).toBe('NOW');
  expect(t(dd.SQLCallType.count)).toBe('COUNT');
  expect(t(dd.SQLCallType.coalesce)).toBe('COALESCE');
});

test('translate', () => {
  // null
  expect(dialect.translate(null)).toBe('NULL');
  // number
  expect(dialect.translate(-32)).toBe('-32');
  // boolean
  expect(dialect.translate(true)).toBe('1');
  expect(dialect.translate(false)).toBe('0');
  // string
  expect(dialect.translate('a 123 🛋')).toBe("'a 123 🛋'"); // tslint:disable-line
  expect(dialect.translate('')).toBe("''"); // tslint:disable-line
  expect(dialect.translate('\'"\\')).toBe("'''\"\\'"); // tslint:disable-line
  // undefined
  expect(() => dialect.translate(undefined)).toThrow();
  // Others
  expect(() => dialect.translate([])).toThrow();
});
