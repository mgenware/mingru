/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import { Dialect } from '../dialect.js';
import { AtomicTypeInfo, CompoundTypeInfo, TypeInfo } from '../lib/varInfo.js';
import escapeSQLString from './sqlEscapeString.js';

const TimeType = new AtomicTypeInfo('Time', 'time.Time{}', 'time');

export class MySQL extends Dialect {
  override encodeName(name: string): string {
    throwIfFalsy(name, 'name');
    return '`' + name + '`';
  }

  override objToSQL(value: unknown, _table: mm.Table | null): mm.SQL {
    if (value === undefined) {
      throw new Error('Value is undefined');
    }
    if (value === null) {
      return mm.sql`NULL`;
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      const valueString = `${+(value as number)}`;
      return mm.sql`${valueString}`;
    }
    if (typeof value === 'string') {
      return mm.sql`${escapeSQLString(value)}`;
    }
    if (value instanceof mm.SQL) {
      return value;
    }
    throw new Error(`Unsupported type of object "${toTypeString(value)}"`);
  }

  override colTypeToGoType(colType: mm.ColumnType): TypeInfo {
    throwIfFalsy(colType, 'colType');
    const typeInfo = this.goTypeNonNull(colType);
    if (colType.nullable) {
      return new CompoundTypeInfo(typeInfo, true, false);
    }
    return typeInfo;
  }

  override colToSQLType(col: mm.Column): mm.SQL {
    throwIfFalsy(col, 'col');
    const colType = col.__type();
    const colData = col.__getData();
    let typeString = this.absoluteSQLType(colType);
    if (colType.length) {
      typeString = `${typeString}(${colType.length})`;
    }

    const builder = new mm.SQLBuilder();
    builder.push(typeString);
    if (colType.unsigned) {
      builder.pushWithSpace('UNSIGNED');
    }
    builder.pushWithSpace(colType.nullable ? 'NULL' : 'NOT NULL');
    if (!colData.noDefaultValueOnCSQL) {
      const defValue = colData.defaultValue;
      if (defValue !== undefined && defValue instanceof mm.SQL === false) {
        builder.pushWithSpace('DEFAULT');

        // MySQL doesn't allow dynamic value as default value, we simply ignore SQL expr here.
        builder.pushWithSpace(this.objToSQL(defValue, col.__getSourceTable()));
      } else if (colType.nullable) {
        builder.pushWithSpace('DEFAULT');
        builder.pushWithSpace('NULL');
      }
    }
    if (colData.uniqueConstraint) {
      builder.pushWithSpace('UNIQUE');
    }
    if (colType.autoIncrement) {
      builder.pushWithSpace('AUTO_INCREMENT');
    }
    return builder.toSQL();
  }

  override as(sql: mm.SQL, name: string): mm.SQL {
    return mm.sql`${sql} AS ${this.encodeName(name)}`;
  }

  override sqlCall(type: mm.SQLCallType): string {
    switch (type) {
      case mm.SQLCallType.localDatetimeNow:
        return 'NOW';
      case mm.SQLCallType.localDateNow:
        return 'CURDATE';
      case mm.SQLCallType.localTimeNow:
        return 'CURTIME';
      case mm.SQLCallType.utcDatetimeNow:
        return 'UTC_TIMESTAMP';
      case mm.SQLCallType.utcDateNow:
        return 'UTC_DATE';
      case mm.SQLCallType.utcTimeNow:
        return 'UTC_TIME';
      case mm.SQLCallType.count:
        return 'COUNT';
      case mm.SQLCallType.coalesce:
        return 'COALESCE';
      case mm.SQLCallType.avg:
        return 'AVG';
      case mm.SQLCallType.sum:
        return 'SUM';
      case mm.SQLCallType.min:
        return 'MIN';
      case mm.SQLCallType.max:
        return 'MAX';
      case mm.SQLCallType.year:
        return 'YEAR';
      case mm.SQLCallType.month:
        return 'MONTH';
      case mm.SQLCallType.day:
        return 'DAY';
      case mm.SQLCallType.week:
        return 'WEEK';
      case mm.SQLCallType.hour:
        return 'HOUR';
      case mm.SQLCallType.minute:
        return 'MINUTE';
      case mm.SQLCallType.second:
        return 'SECOND';
      case mm.SQLCallType.timestampNow:
        return 'NOW';
      case mm.SQLCallType.exists:
        return 'EXISTS';
      case mm.SQLCallType.notExists:
        return 'NOT EXISTS';
      case mm.SQLCallType.ifNull:
        return 'IFNULL';
      case mm.SQLCallType.IF:
        return 'IF';
      default:
        throw new Error(`Unsupported type of call "${type}"`);
    }
  }

  private absoluteSQLType(colType: mm.ColumnType): string {
    const DT = mm.dt;
    for (const type of colType.types) {
      // eslint-disable-next-line default-case
      switch (type) {
        case DT.bigInt: {
          return 'BIGINT';
        }
        case DT.int: {
          return 'INT';
        }
        case DT.smallInt: {
          return 'SMALLINT';
        }
        case DT.tinyInt: {
          return 'TINYINT';
        }
        case DT.bool: {
          return 'TINYINT';
        }
        case DT.float: {
          return 'FLOAT';
        }
        case DT.double: {
          return 'DOUBLE';
        }
        case DT.varChar: {
          return 'VARCHAR';
        }
        case DT.char: {
          return 'CHAR';
        }
        case DT.text: {
          return 'TEXT';
        }
        case DT.datetime: {
          return 'DATETIME';
        }
        case DT.date: {
          return 'DATE';
        }
        case DT.time: {
          return 'TIME';
        }
      }
    }
    throw new Error(`Type not supported: ${this.inspectTypes(colType.types)}`);
  }

  private goTypeNonNull(colType: mm.ColumnType): AtomicTypeInfo {
    const DT = mm.dt;
    const { unsigned } = colType;
    for (const type of colType.types) {
      // eslint-disable-next-line default-case
      switch (type) {
        case DT.bigInt: {
          return new AtomicTypeInfo(unsigned ? 'uint64' : 'int64', 0, null);
        }
        case DT.int: {
          return new AtomicTypeInfo(unsigned ? 'uint' : 'int', 0, null);
        }
        case DT.smallInt: {
          return new AtomicTypeInfo(unsigned ? 'uint16' : 'int16', 0, null);
        }
        case DT.tinyInt: {
          return new AtomicTypeInfo(unsigned ? 'uint8' : 'int8', 0, null);
        }
        case DT.varChar:
        case DT.char:
        case DT.text: {
          return new AtomicTypeInfo('string', '', null);
        }

        case DT.datetime:
        case DT.date:
        case DT.time:
        case DT.timestamp: {
          return TimeType;
        }

        case DT.bool: {
          return new AtomicTypeInfo('bool', false, null);
        }
      }
    }
    throw new Error(`Type not supported: ${this.inspectTypes(colType.types)}`);
  }

  private inspectTypes(types?: string[]): string {
    if (!types) {
      return 'null';
    }
    return `[${types.join()}]`;
  }
}

export const mysql = new MySQL();
