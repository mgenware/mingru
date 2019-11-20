import * as mr from '../../';
import * as mm from 'mingru-models';
import user from '../models/user';
import * as assert from 'assert';
import { itThrows } from 'it-throws';

const expect = assert.equal;
const TimePkg = 'time';
const dialect = mr.mysql;

function testType(col: mm.Column, type: string, pkg?: string) {
  const info = dialect.colTypeToGoType(col.__type);
  expect(info.typeString, type);
  expect(info.moduleName || null, pkg || null);
}

it('encodeName', () => {
  expect(dialect.encodeName('abc'), '`abc`');
});

it('encodeColumnName', () => {
  expect(dialect.encodeColumnName(user.age), '`age`');
  expect(dialect.encodeColumnName(user.follower_count), '`follower_c`');
});

it('encodeTableName', () => {
  class Table extends mm.Table {}
  const t = mm.table(Table, 'haha');
  expect(dialect.encodeTableName(user), '`user`');
  expect(dialect.encodeTableName(t), '`haha`');
});

it('DT', () => {
  const tests: Array<[mm.Column, string, unknown]> = [
    // PK
    [mm.pk(), 'uint64', null],
    // Integer
    [mm.int(), 'int', null],
    [mm.uInt(), 'uint', null],
    [mm.bigInt(), 'int64', null],
    [mm.uBigInt(), 'uint64', null],
    [mm.smallInt(), 'int16', null],
    [mm.uSmallInt(), 'uint16', null],
    [mm.tinyInt(), 'int8', null],
    [mm.uTinyInt(), 'uint8', null],
    // String
    [mm.varChar(10), 'string', null],
    [mm.char(10), 'string', null],
    // Time
    [mm.datetime(), 'time.Time', TimePkg],
    [mm.date(), 'time.Time', TimePkg],
  ];

  for (const t of tests) {
    const column = t[0] as mm.Column;
    testType(column, t[1] as string, t[2] as string);
    if (!column.__type.pk) {
      column.__type.nullable = true;
      testType(column, ('*' + t[1]) as string, t[2] as string);
    }
  }
});

it('DT (not supported)', () => {
  const props = new mm.ColumnType(['type1', 'type2']);
  itThrows(
    () => dialect.colTypeToGoType(props),
    'Type not supported: [type1,type2]',
  );
});

it('as', () => {
  expect(dialect.as('abc', 'def'), 'abc AS `def`');
});

it('SQL calls', () => {
  const t = dialect.sqlCall;
  expect(t(mm.SQLCallType.dateNow), 'CURDATE');
  expect(t(mm.SQLCallType.timeNow), 'CURTIME');
  expect(t(mm.SQLCallType.datetimeNow), 'NOW');
  expect(t(mm.SQLCallType.count), 'COUNT');
  expect(t(mm.SQLCallType.coalesce), 'COALESCE');
  expect(t(mm.SQLCallType.avg), 'AVG');
  expect(t(mm.SQLCallType.sum), 'SUM');
  expect(t(mm.SQLCallType.min), 'MIN');
  expect(t(mm.SQLCallType.max), 'MAX');
  expect(t(mm.SQLCallType.year), 'YEAR');
  expect(t(mm.SQLCallType.month), 'MONTH');
  expect(t(mm.SQLCallType.day), 'DAY');
  expect(t(mm.SQLCallType.week), 'WEEK');
  expect(t(mm.SQLCallType.hour), 'HOUR');
  expect(t(mm.SQLCallType.minute), 'MINUTE');
  expect(t(mm.SQLCallType.second), 'SECOND');
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
  expect(dialect.objToSQL('a 123 🛋', user), "'a 123 🛋'");
  expect(dialect.objToSQL('', user), "''");
  expect(dialect.objToSQL('\'"\\', user), "'''\"\\'");
  // undefined
  itThrows(() => dialect.objToSQL(undefined, user), 'value is undefined');
  // Others
  itThrows(
    () => dialect.objToSQL([], user),
    'Unsupported type of object "Array"',
  );
});

it('colToSQLType', () => {
  // Integers
  expect(dialect.colToSQLType(mm.int()), 'INT NOT NULL');
  expect(dialect.colToSQLType(mm.bigInt()), 'BIGINT NOT NULL');
  expect(dialect.colToSQLType(mm.tinyInt()), 'TINYINT NOT NULL');
  expect(dialect.colToSQLType(mm.smallInt()), 'SMALLINT NOT NULL');
  expect(dialect.colToSQLType(mm.uInt()), 'INT UNSIGNED NOT NULL');
  // Chars
  expect(dialect.colToSQLType(mm.varChar(3)), 'VARCHAR(3) NOT NULL');
  expect(dialect.colToSQLType(mm.char(3)), 'CHAR(3) NOT NULL');
  expect(dialect.colToSQLType(mm.text()), 'TEXT NOT NULL');
  // DateTime
  expect(dialect.colToSQLType(mm.date()), 'DATE NOT NULL');
  expect(dialect.colToSQLType(mm.datetime()), 'DATETIME NOT NULL');
  expect(dialect.colToSQLType(mm.time()), 'TIME NOT NULL');
  // NULL
  expect(dialect.colToSQLType(mm.int().nullable), 'INT NULL DEFAULT NULL');
  // Default value
  expect(dialect.colToSQLType(mm.int(43).nullable), 'INT NULL DEFAULT 43');
  expect(
    dialect.colToSQLType(mm.varChar(23, 'oo').nullable),
    "VARCHAR(23) NULL DEFAULT 'oo'",
  );
});
