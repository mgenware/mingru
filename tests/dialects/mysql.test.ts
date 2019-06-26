import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';

const TimePkg = 'time';

const dialect = new mr.MySQL();

function testType(col: dd.Column, type: string, pkg?: string) {
  const info = dialect.colTypeToGoType(col.type);
  expect(info.typeName).toBe(type);
  expect(info.namespace || null).toBe(pkg || null);
}

test('encodeName', () => {
  expect(dialect.encodeName('abc')).toBe('`abc`');
});

test('encodeColumnName', () => {
  expect(dialect.encodeColumnName(user.age)).toBe('`age`');
  expect(dialect.encodeColumnName(user.follower_count)).toBe('`follower_c`');
});

test('encodeTableName', () => {
  class Table extends dd.Table {}
  const t = dd.table(Table, 'haha');
  expect(dialect.encodeTableName(user)).toBe('`user`');
  expect(dialect.encodeTableName(t)).toBe('`haha`');
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
    testType(column, t[1] as string, t[2] as string);
    if (!column.type.pk) {
      column.type.nullable = true;
      testType(column, ('*' + t[1]) as string, t[2] as string);
    }
  }
});

test('DT (not supported)', () => {
  const props = new dd.ColumnType(['type1', 'type2']);
  expect(() => dialect.colTypeToGoType(props)).toThrow('type2');
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

test('objToSQL', () => {
  // null
  expect(dialect.objToSQL(null)).toBe('NULL');
  // number
  expect(dialect.objToSQL(-32)).toBe('-32');
  // boolean
  expect(dialect.objToSQL(true)).toBe('1');
  expect(dialect.objToSQL(false)).toBe('0');
  // string
  expect(dialect.objToSQL('a 123 🛋')).toBe("'a 123 🛋'"); // tslint:disable-line
  expect(dialect.objToSQL('')).toBe("''"); // tslint:disable-line
  expect(dialect.objToSQL('\'"\\')).toBe("'''\"\\'"); // tslint:disable-line
  // undefined
  expect(() => dialect.objToSQL(undefined)).toThrow();
  // Others
  expect(() => dialect.objToSQL([])).toThrow();
});

test('colToSQLType', () => {
  // Integers
  expect(dialect.colToSQLType(dd.int())).toBe('INT NOT NULL');
  expect(dialect.colToSQLType(dd.bigInt())).toBe('BIGINT NOT NULL');
  expect(dialect.colToSQLType(dd.tinyInt())).toBe('TINYINT NOT NULL');
  expect(dialect.colToSQLType(dd.smallInt())).toBe('SMALLINT NOT NULL');
  expect(dialect.colToSQLType(dd.uInt())).toBe('INT UNSIGNED NOT NULL');
  // Chars
  expect(dialect.colToSQLType(dd.varChar(3))).toBe('VARCHAR(3) NOT NULL');
  expect(dialect.colToSQLType(dd.char(3))).toBe('CHAR(3) NOT NULL');
  expect(dialect.colToSQLType(dd.text())).toBe('TEXT NOT NULL');
  // DateTime
  expect(dialect.colToSQLType(dd.date())).toBe('DATE NOT NULL');
  expect(dialect.colToSQLType(dd.datetime())).toBe('DATETIME NOT NULL');
  expect(dialect.colToSQLType(dd.time())).toBe('TIME NOT NULL');
  // NULL
  expect(dialect.colToSQLType(dd.int().nullable)).toBe('INT NULL DEFAULT NULL');
  // Default value
  expect(dialect.colToSQLType(dd.int(43).nullable)).toBe('INT NULL DEFAULT 43');
  expect(dialect.colToSQLType(dd.varChar(23, 'oo').nullable)).toBe(
    "VARCHAR(23) NULL DEFAULT 'oo'",
  );
});
