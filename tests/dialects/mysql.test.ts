import * as mr from '../../';
import * as dd from 'dd-models';

// const NullBool = 'sql.NullBool';
// const NullFloat64 = 'sql.NullFloat64';
const NullInt64 = 'sql.NullInt64';
const NullString = 'sql.NullString';
const SqlPackage = 'database/sql';

const dialect = new mr.MySQL();

function testNullableType(col: dd.Column, type: string) {
  const tb = dialect.goType(col);
  expect(tb.type).toBe(type);
  expect(tb.importPath).toBe(SqlPackage);
}

function testType(col: dd.Column, type: string) {
  const tb = dialect.goType(col);
  expect(tb.type).toBe(type);
}

test('escape', () => {
  expect(dialect.escape('abc')).toBe('`abc`');
});

test('DT (nullable)', () => {
  const tests: Array<Array<unknown>> = [
    // Integer
    [dd.int(), NullInt64],
    [dd.unsignedInt(), NullInt64],
    [dd.bigInt(), NullInt64],
    [dd.unsignedBigInt(), NullInt64],
    [dd.smallInt(), NullInt64],
    [dd.unsignedSmallInt(), NullInt64],
    [dd.tinyInt(), NullInt64],
    [dd.unsignedTinyInt(), NullInt64],
    // String
    [dd.varChar(10), NullString],
    [dd.char(10), NullString],
  ];

  for (const t of tests) {
    testNullableType(t[0] as dd.Column, t[1] as string);
  }
});

test('DT', () => {
  const tests: Array<Array<unknown>> = [
    // PK
    [dd.pk(), 'uint64'],
    // Integer
    [dd.notNull(dd.int()), 'int'],
    [dd.notNull(dd.unsignedInt()), 'uint'],
    [dd.notNull(dd.bigInt()), 'int64'],
    [dd.notNull(dd.unsignedBigInt()), 'uint64'],
    [dd.notNull(dd.pk()), 'uint64'],
    [dd.notNull(dd.smallInt()), 'int16'],
    [dd.notNull(dd.unsignedSmallInt()), 'uint16'],
    [dd.notNull(dd.tinyInt()), 'int8'],
    [dd.notNull(dd.unsignedTinyInt()), 'uint8'],
    // String
    [dd.notNull(dd.varChar(10)), 'string'],
    [dd.notNull(dd.char(10)), 'string'],
  ];

  for (const t of tests) {
    testType(t[0] as dd.Column, t[1] as string);
  }
});

test('as', () => {
  expect(dialect.as('abc', 'def')).toBe('abc AS `def`');
});
