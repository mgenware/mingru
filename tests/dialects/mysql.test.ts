import * as mm from 'mingru-models';
import * as assert from 'assert';
import { itThrows } from 'it-throws';
import user from '../models/user';
import * as mr from '../..';

const eq = assert.equal;
const TimePkg = 'time';
const dialect = mr.mysql;

function testType(col: mm.Column, type: string, pkg?: string) {
  // `VarInfo` is not exported, we'll use `any` here to bypass type validation.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeInfo = dialect.colTypeToGoType(col.__type) as any;
  const atomicInfo = typeInfo.core ? typeInfo.core : typeInfo;
  eq(atomicInfo.typeString, type);
  eq(atomicInfo.moduleName || null, pkg || null);
}

it('encodeName', () => {
  eq(dialect.encodeName('abc'), '`abc`');
});

it('encodeColumnName', () => {
  eq(dialect.encodeColumnName(user.age), '`age`');
  eq(dialect.encodeColumnName(user.follower_count), '`follower_c`');
});

it('encodeTableName', () => {
  class Table extends mm.Table {}
  const t = mm.table(Table, 'haha');
  eq(dialect.encodeTableName(user), '`user`');
  eq(dialect.encodeTableName(t), '`haha`');
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
    [mm.bool(), 'bool', null],
    // String
    [mm.varChar(10), 'string', null],
    [mm.char(10), 'string', null],
    // Time
    [mm.datetime(), 'time.Time', TimePkg],
    [mm.date(), 'time.Time', TimePkg],
    [mm.timestamp(), 'time.Time', TimePkg],
  ];

  for (const t of tests) {
    const column = t[0] as mm.Column;
    testType(column, t[1] as string, t[2] as string);
    if (!column.__type.pk) {
      column.__type.nullable = true;
      testType(column, `*${t[1]}` as string, t[2] as string);
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
  eq(dialect.as('abc', 'def'), 'abc AS `def`');
});

it('SQL calls', () => {
  const t = dialect.sqlCall;
  eq(t(mm.SQLCallType.localDateNow), 'CURDATE');
  eq(t(mm.SQLCallType.localTimeNow), 'CURTIME');
  eq(t(mm.SQLCallType.localDatetimeNow), 'NOW');
  eq(t(mm.SQLCallType.utcDateNow), 'UTC_DATE');
  eq(t(mm.SQLCallType.utcTimeNow), 'UTC_TIME');
  eq(t(mm.SQLCallType.utcDatetimeNow), 'UTC_TIMESTAMP');
  eq(t(mm.SQLCallType.count), 'COUNT');
  eq(t(mm.SQLCallType.coalesce), 'COALESCE');
  eq(t(mm.SQLCallType.avg), 'AVG');
  eq(t(mm.SQLCallType.sum), 'SUM');
  eq(t(mm.SQLCallType.min), 'MIN');
  eq(t(mm.SQLCallType.max), 'MAX');
  eq(t(mm.SQLCallType.year), 'YEAR');
  eq(t(mm.SQLCallType.month), 'MONTH');
  eq(t(mm.SQLCallType.day), 'DAY');
  eq(t(mm.SQLCallType.week), 'WEEK');
  eq(t(mm.SQLCallType.hour), 'HOUR');
  eq(t(mm.SQLCallType.minute), 'MINUTE');
  eq(t(mm.SQLCallType.second), 'SECOND');
  eq(t(mm.SQLCallType.timestampNow), 'NOW');
});

it('objToSQL', () => {
  // null
  eq(dialect.objToSQL(null, user), 'NULL');
  // number
  eq(dialect.objToSQL(-32, user), '-32');
  // boolean
  eq(dialect.objToSQL(true, user), '1');
  eq(dialect.objToSQL(false, user), '0');
  // string
  eq(dialect.objToSQL('a 123 🛋', user), "'a 123 🛋'");
  eq(dialect.objToSQL('', user), "''");
  eq(dialect.objToSQL('\'"\\', user), "'''\"\\'");
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
  eq(dialect.colToSQLType(mm.int()), 'INT NOT NULL');
  eq(dialect.colToSQLType(mm.bigInt()), 'BIGINT NOT NULL');
  eq(dialect.colToSQLType(mm.tinyInt()), 'TINYINT NOT NULL');
  eq(dialect.colToSQLType(mm.smallInt()), 'SMALLINT NOT NULL');
  eq(dialect.colToSQLType(mm.uInt()), 'INT UNSIGNED NOT NULL');
  eq(dialect.colToSQLType(mm.uBigInt()), 'BIGINT UNSIGNED NOT NULL');
  eq(dialect.colToSQLType(mm.uTinyInt()), 'TINYINT UNSIGNED NOT NULL');
  eq(dialect.colToSQLType(mm.uSmallInt()), 'SMALLINT UNSIGNED NOT NULL');
  eq(dialect.colToSQLType(mm.bool()), 'TINYINT NOT NULL');
  // Chars
  eq(dialect.colToSQLType(mm.varChar(3)), 'VARCHAR(3) NOT NULL');
  eq(dialect.colToSQLType(mm.char(3)), 'CHAR(3) NOT NULL');
  eq(dialect.colToSQLType(mm.text()), 'TEXT NOT NULL');
  // DateTime
  eq(dialect.colToSQLType(mm.date()), 'DATE NOT NULL');
  eq(dialect.colToSQLType(mm.datetime()), 'DATETIME NOT NULL');
  eq(dialect.colToSQLType(mm.time()), 'TIME NOT NULL');
  // NULL
  eq(dialect.colToSQLType(mm.int().nullable), 'INT NULL DEFAULT NULL');
  // Default value
  eq(
    dialect.colToSQLType(mm.int().default(43).nullable),
    'INT NULL DEFAULT 43',
  );
  eq(
    dialect.colToSQLType(mm.varChar(23).default('oo').nullable),
    "VARCHAR(23) NULL DEFAULT 'oo'",
  );
});
