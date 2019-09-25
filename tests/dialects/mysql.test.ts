import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';
import * as assert from 'assert';

const expect = assert.equal;
const TimePkg = 'time';
const dialect = new mr.MySQL();

function testType(col: dd.Column, type: string, pkg?: string) {
  const info = dialect.colTypeToGoType(col.type);
  expect(info.typeName, type);
  expect(info.namespace || null, pkg || null);
}

it('encodeName', () => {
  expect(dialect.encodeName('abc'), '`abc`');
});

it('encodeColumnName', () => {
  expect(dialect.encodeColumnName(user.age), '`age`');
  expect(dialect.encodeColumnName(user.follower_count), '`follower_c`');
});

it('encodeTableName', () => {
  class Table extends dd.Table {}
  const t = dd.table(Table, 'haha');
  expect(dialect.encodeTableName(user), '`user`');
  expect(dialect.encodeTableName(t), '`haha`');
});

it('DT', () => {
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

it('DT (not supported)', () => {
  const props = new dd.ColumnType(['type1', 'type2']);
  assert.throws(() => dialect.colTypeToGoType(props), 'type2');
});

it('as', () => {
  expect(dialect.as('abc', 'def'), 'abc AS `def`');
});

it('SQL calls', () => {
  const t = dialect.sqlCall;
  expect(t(dd.SQLCallType.dateNow), 'CURDATE');
  expect(t(dd.SQLCallType.timeNow), 'CURTIME');
  expect(t(dd.SQLCallType.datetimeNow), 'NOW');
  expect(t(dd.SQLCallType.count), 'COUNT');
  expect(t(dd.SQLCallType.coalesce), 'COALESCE');
});

it('objToSQL', () => {
  // null
  expect(dialect.objToSQL(null, user), 'NULL');
  // number
  expect(dialect.objToSQL(-32, user), '-32');
  // boolean
  expect(dialect.objToSQL(true, user), '1');
  expect(dialect.objToSQL(false, user), '0');
  // string
  expect(dialect.objToSQL('a 123 🛋', user), "'a 123 🛋'"); // tslint:disable-line
  expect(dialect.objToSQL('', user), "''"); // tslint:disable-line
  expect(dialect.objToSQL('\'"\\', user), "'''\"\\'"); // tslint:disable-line
  // undefined
  assert.throws(() => dialect.objToSQL(undefined, user));
  // Others
  assert.throws(() => dialect.objToSQL([], user));
});

it('colToSQLType', () => {
  // Integers
  expect(dialect.colToSQLType(dd.int()), 'INT NOT NULL');
  expect(dialect.colToSQLType(dd.bigInt()), 'BIGINT NOT NULL');
  expect(dialect.colToSQLType(dd.tinyInt()), 'TINYINT NOT NULL');
  expect(dialect.colToSQLType(dd.smallInt()), 'SMALLINT NOT NULL');
  expect(dialect.colToSQLType(dd.uInt()), 'INT UNSIGNED NOT NULL');
  // Chars
  expect(dialect.colToSQLType(dd.varChar(3)), 'VARCHAR(3) NOT NULL');
  expect(dialect.colToSQLType(dd.char(3)), 'CHAR(3) NOT NULL');
  expect(dialect.colToSQLType(dd.text()), 'TEXT NOT NULL');
  // DateTime
  expect(dialect.colToSQLType(dd.date()), 'DATE NOT NULL');
  expect(dialect.colToSQLType(dd.datetime()), 'DATETIME NOT NULL');
  expect(dialect.colToSQLType(dd.time()), 'TIME NOT NULL');
  // NULL
  expect(dialect.colToSQLType(dd.int().nullable), 'INT NULL DEFAULT NULL');
  // Default value
  expect(dialect.colToSQLType(dd.int(43).nullable), 'INT NULL DEFAULT 43');
  expect(
    dialect.colToSQLType(dd.varChar(23, 'oo').nullable),
    "VARCHAR(23) NULL DEFAULT 'oo'",
  );
});
