import * as mr from '../../';
import * as dd from 'dd-models';

// const NullBool = 'sql.NullBool';
// const NullFloat64 = 'sql.NullFloat64';
const NullInt64 = 'sql.NullInt64';
const NullString = 'sql.NullString';
const SqlPkg = '"database/sql"';
const MySqlPkg = '"github.com/go-sql-driver/mysql"';
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

test('DT (nullable)', () => {
  const tests: Array<Array<unknown>> = [
    // Integer
    [dd.int(), NullInt64, SqlPkg],
    [dd.unsignedInt(), NullInt64, SqlPkg],
    [dd.bigInt(), NullInt64, SqlPkg],
    [dd.unsignedBigInt(), NullInt64, SqlPkg],
    [dd.smallInt(), NullInt64, SqlPkg],
    [dd.unsignedSmallInt(), NullInt64, SqlPkg],
    [dd.tinyInt(), NullInt64, SqlPkg],
    [dd.unsignedTinyInt(), NullInt64, SqlPkg],
    // String
    [dd.varChar(10), NullString, SqlPkg],
    [dd.char(10), NullString, SqlPkg],
    // Time
    [dd.datetime(), 'mysql.NullTime', MySqlPkg],
    [dd.date(), 'mysql.NullTime', MySqlPkg],
  ];

  for (const t of tests) {
    testType(t[0] as dd.Column, t[1] as string, t[2] as string | null);
  }
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
    [dd.pk().notNull, 'uint64', null],
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
    testType(t[0] as dd.Column, t[1] as string, t[2] as string | null);
  }
});

test('DT (not supported)', () => {
  expect(() => dialect.goType(new dd.Column('_HAHA_'))).toThrow('"_HAHA_"');
});

test('as', () => {
  expect(dialect.as('abc', 'def')).toBe('abc AS `def`');
});
