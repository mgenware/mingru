import * as mr from '../../';
import * as dd from 'dd-models';

const TimePkg = '"time"';

const dialect = new mr.MySQL();

function testType(col: dd.Column, type: string, pkg: string | null) {
  const tb = dialect.goType(col);
  expect(tb.type).toBe(type);
  expect(tb.importPath).toBe(pkg);
}

test('escape', () => {
  expect(dialect.escape('abc')).toBe('`abc`');
});

test('DT', () => {
  const tests: Array<Array<unknown>> = [
    // PK
    [dd.pk(), 'uint64', null],
    // Integer
    [dd.int().notNull, 'int', null],
    [dd.unsignedInt().notNull, 'uint', null],
    [dd.bigInt().notNull, 'int64', null],
    [dd.unsignedBigInt().notNull, 'uint64', null],
    [dd.smallInt().notNull, 'int16', null],
    [dd.unsignedSmallInt().notNull, 'uint16', null],
    [dd.tinyInt().notNull, 'int8', null],
    [dd.unsignedTinyInt().notNull, 'uint8', null],
    // String
    [dd.varChar(10).notNull, 'string', null],
    [dd.char(10).notNull, 'string', null],
    // Time
    [dd.datetime().notNull, 'time.Time', TimePkg],
    [dd.date().notNull, 'time.Time', TimePkg],
  ];

  for (const t of tests) {
    const column = t[0] as dd.Column;
    testType(column, t[1] as string, t[2] as string | null);
    if (!column.props.pk) {
      column.props.notNull = false;
      testType(column, ('*' + t[1]) as string, t[2] as string | null);
    }
  }
});

test('DT (not supported)', () => {
  expect(() => dialect.goType(new dd.Column('_HAHA_'))).toThrow('"_HAHA_"');
});

test('as', () => {
  expect(dialect.as('abc', 'def')).toBe('abc AS `def`');
});

test('Current date/time', () => {
  expect(dialect.currentDate()).toBe('CURDATE()');
  expect(dialect.currentTime()).toBe('CURTIME()');
  expect(dialect.currentDateTime()).toBe('NOW()');
  expect(dialect.currentTimestamp()).toBe('NOW()');
});
