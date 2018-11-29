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
    [dd.int().notNull, 'int'],
    [dd.unsignedInt().notNull, 'uint'],
    [dd.bigInt().notNull, 'int64'],
    [dd.unsignedBigInt().notNull, 'uint64'],
    [dd.pk().notNull, 'uint64'],
    [dd.smallInt().notNull, 'int16'],
    [dd.unsignedSmallInt().notNull, 'uint16'],
    [dd.tinyInt().notNull, 'int8'],
    [dd.unsignedTinyInt().notNull, 'uint8'],
    // String
    [dd.varChar(10).notNull, 'string'],
    [dd.char(10).notNull, 'string'],
  ];

  for (const t of tests) {
    testType(t[0] as dd.Column, t[1] as string);
  }
});

test('as', () => {
  expect(dialect.as('abc', 'def')).toBe('abc AS `def`');
});

test('goString', () => {
  expect(dialect.goString('abc')).toBe('"abc"');
  expect(dialect.goString('')).toBe('""');
  expect(dialect.goString('"\'')).toBe('"\\"\'"');
  expect(dialect.goString('\\/')).toBe('"\\\\/"');
});
