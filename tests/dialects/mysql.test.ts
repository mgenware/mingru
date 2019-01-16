import * as mr from '../../';
import * as dd from 'dd-models';

const TimePkg = '"time"';

const dialect = new mr.MySQL();

function testType(col: dd.Column, type: string, pkg: string | null) {
  const tb = dialect.goType(col.props);
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
    [dd.int(), 'int', null],
    [dd.unsignedInt(), 'uint', null],
    [dd.bigInt(), 'int64', null],
    [dd.unsignedBigInt(), 'uint64', null],
    [dd.smallInt(), 'int16', null],
    [dd.unsignedSmallInt(), 'uint16', null],
    [dd.tinyInt(), 'int8', null],
    [dd.unsignedTinyInt(), 'uint8', null],
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
    if (!column.props.pk) {
      column.props.nullable = true;
      testType(column, ('*' + t[1]) as string, t[2] as string | null);
    }
  }
});

test('DT (not supported)', () => {
  const props = new dd.ColumnProps(new Set<string>(['_HAHA_']));
  expect(() => dialect.goType(props)).toThrow('"_HAHA_"');
});

test('as', () => {
  expect(dialect.as('abc', 'def')).toBe('abc AS `def`');
});

test('SQL calls', () => {
  expect(dialect.sqlCall(new dd.SQLCall(dd.SQLCallType.dateNow))).toBe(
    'CURDATE()',
  );
  expect(dialect.sqlCall(new dd.SQLCall(dd.SQLCallType.timeNow))).toBe(
    'CURTIME()',
  );
  expect(dialect.sqlCall(new dd.SQLCall(dd.SQLCallType.datetimeNow))).toBe(
    'NOW()',
  );
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
