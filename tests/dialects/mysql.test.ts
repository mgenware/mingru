import * as mm from 'mingru-models';
import { itThrows } from 'it-throws';
import user from '../models/user.js';
import * as mr from '../../dist/main.js';
import { eq } from '../assert-aliases.js';

const TimePkg = 'time';
const dialect = mr.mysql;

function sqlEq(sql: mm.SQL, value: string) {
  eq(mr.sqlIO(sql, dialect, null, 'sqlEq').getCodeString(), `"${value}"`);
}

function testDTToGoType(col: mm.Column, type: string, pkg?: string) {
  const typeInfo = dialect.colTypeToGoType(col.__type());
  eq(typeInfo.fullTypeName, type);

  const atomicInfo = mr.getAtomicTypeInfo(typeInfo);
  eq(atomicInfo.moduleName, pkg ?? '');
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
  const t = mm.table(Table, { dbName: 'haha' });
  eq(dialect.encodeTableName(user), '`user`');
  eq(dialect.encodeTableName(t), '`haha`');
});

it('DT to go type', () => {
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
    const column = t[0];
    testDTToGoType(column, t[1], t[2] as string);
    if (!column.__type().pk) {
      column.__type().nullable = true;
      testDTToGoType(column, `*${t[1]}`, t[2] as string);
    }
  }
});

it('DT (not supported)', () => {
  const props = new mm.ColumnType(['type1', 'type2']);
  itThrows(() => dialect.colTypeToGoType(props), 'Type not supported: [type1,type2]');
});

it('as', () => {
  sqlEq(dialect.as(mm.sql`abc`, 'def'), 'abc AS `def`');
});

it('SQL calls', () => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
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
  sqlEq(dialect.objToSQL(null, user), 'NULL');
  // number
  sqlEq(dialect.objToSQL(-32, user), '-32');
  // boolean
  sqlEq(dialect.objToSQL(true, user), '1');
  sqlEq(dialect.objToSQL(false, user), '0');
  // string
  sqlEq(dialect.objToSQL('a 123 🛋', user), "'a 123 🛋'");
  sqlEq(dialect.objToSQL('', user), "''");
  sqlEq(dialect.objToSQL('\'"\\', user), "'''\\\"\\\\'");
  // undefined
  itThrows(() => dialect.objToSQL(undefined, user), 'Value is undefined');
  // Others
  itThrows(() => dialect.objToSQL([], user), 'Unsupported type of object "Array"');
});

it('colToSQLType', () => {
  // Integers
  sqlEq(dialect.colToSQLType(mm.int()), 'INT NOT NULL');
  sqlEq(dialect.colToSQLType(mm.int(3)), 'INT(3) NOT NULL');
  sqlEq(dialect.colToSQLType(mm.bigInt()), 'BIGINT NOT NULL');
  sqlEq(dialect.colToSQLType(mm.bigInt(3)), 'BIGINT(3) NOT NULL');
  sqlEq(dialect.colToSQLType(mm.tinyInt()), 'TINYINT NOT NULL');
  sqlEq(dialect.colToSQLType(mm.tinyInt(1)), 'TINYINT(1) NOT NULL');
  sqlEq(dialect.colToSQLType(mm.smallInt()), 'SMALLINT NOT NULL');
  sqlEq(dialect.colToSQLType(mm.smallInt(3)), 'SMALLINT(3) NOT NULL');
  sqlEq(dialect.colToSQLType(mm.uInt()), 'INT UNSIGNED NOT NULL');
  sqlEq(dialect.colToSQLType(mm.uInt(3)), 'INT(3) UNSIGNED NOT NULL');
  sqlEq(dialect.colToSQLType(mm.uBigInt()), 'BIGINT UNSIGNED NOT NULL');
  sqlEq(dialect.colToSQLType(mm.uBigInt(3)), 'BIGINT(3) UNSIGNED NOT NULL');
  sqlEq(dialect.colToSQLType(mm.uTinyInt()), 'TINYINT UNSIGNED NOT NULL');
  sqlEq(dialect.colToSQLType(mm.uTinyInt(1)), 'TINYINT(1) UNSIGNED NOT NULL');
  sqlEq(dialect.colToSQLType(mm.uSmallInt()), 'SMALLINT UNSIGNED NOT NULL');
  sqlEq(dialect.colToSQLType(mm.uSmallInt(3)), 'SMALLINT(3) UNSIGNED NOT NULL');
  sqlEq(dialect.colToSQLType(mm.bool()), 'TINYINT NOT NULL');
  // Chars
  sqlEq(dialect.colToSQLType(mm.varChar(3)), 'VARCHAR(3) NOT NULL');
  sqlEq(dialect.colToSQLType(mm.char(3)), 'CHAR(3) NOT NULL');
  sqlEq(dialect.colToSQLType(mm.text()), 'TEXT NOT NULL');
  // DateTime
  sqlEq(dialect.colToSQLType(mm.date()), 'DATE NOT NULL');
  sqlEq(dialect.colToSQLType(mm.date({ defaultToNow: 'utc' })), 'DATE NOT NULL');
  sqlEq(dialect.colToSQLType(mm.date({ fsp: 3 })), 'DATE(3) NOT NULL');
  sqlEq(dialect.colToSQLType(mm.datetime()), 'DATETIME NOT NULL');
  sqlEq(dialect.colToSQLType(mm.datetime({ defaultToNow: 'utc' })), 'DATETIME NOT NULL');
  sqlEq(dialect.colToSQLType(mm.datetime({ fsp: 3 })), 'DATETIME(3) NOT NULL');
  sqlEq(dialect.colToSQLType(mm.time()), 'TIME NOT NULL');
  sqlEq(dialect.colToSQLType(mm.time({ defaultToNow: 'utc' })), 'TIME NOT NULL');
  sqlEq(dialect.colToSQLType(mm.time({ fsp: 3 })), 'TIME(3) NOT NULL');
  // NULL
  sqlEq(dialect.colToSQLType(mm.int().nullable), 'INT NULL DEFAULT NULL');
  // Default value
  sqlEq(dialect.colToSQLType(mm.int().default(43).nullable), 'INT NULL DEFAULT 43');
  sqlEq(
    dialect.colToSQLType(mm.varChar(23).default('oo').nullable),
    "VARCHAR(23) NULL DEFAULT 'oo'",
  );
});
