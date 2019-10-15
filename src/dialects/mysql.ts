import { Dialect } from '../dialect';
import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import { TypeInfo } from '../lib/varInfo';
import { sqlIO } from '../io/sqlIO';
// eslint-disable-next-line
const escapeString = require('sql-escape-string');

const TimeType = new TypeInfo('time.Time', 'time');

export class MySQL extends Dialect {
  encodeName(name: string): string {
    throwIfFalsy(name, 'name');
    return '`' + name + '`';
  }

  objToSQL(value: unknown, table: mm.Table | null): string {
    if (value === undefined) {
      throw new Error('value is undefined');
    }
    if (value === null) {
      return 'NULL';
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      return `${+(value as number)}`;
    }
    if (typeof value === 'string') {
      return escapeString(value);
    }
    if (value instanceof mm.SQL) {
      const io = sqlIO(value, this);
      return io.toSQL(table);
    }
    throw new Error(`Unsupported type of object "${toTypeString(value)}"`);
  }

  colTypeToGoType(colType: mm.ColumnType): TypeInfo {
    throwIfFalsy(colType, 'colType');
    const type = this.goTypeNonNull(colType);
    if (colType.nullable) {
      return this.toPointerType(type);
    }
    if (type instanceof TypeInfo) {
      return type;
    }
    // Convert string to TypeInfo
    return new TypeInfo(type);
  }

  colToSQLType(col: mm.Column): string {
    throwIfFalsy(col, 'col');
    const colType = col.type;
    const types = [this.absoluteSQLType(colType)];
    if (colType.unsigned) {
      types.push('UNSIGNED');
    }
    types.push(colType.nullable ? 'NULL' : 'NOT NULL');
    if (!col.isNoDefaultOnCSQL) {
      const defValue = col.defaultValue;
      if (defValue && defValue instanceof mm.SQL === false) {
        types.push('DEFAULT');

        // MySQL doesn't allow dynamic value as default value, we simply ignore SQL expr here
        types.push(this.objToSQL(defValue, col.getSourceTable()));
      } else if (colType.nullable) {
        types.push('DEFAULT');
        types.push('NULL');
      }
    }
    if (colType.autoIncrement) {
      types.push('AUTO_INCREMENT');
    }
    return types.join(' ');
  }

  as(sql: string, name: string): string {
    return `${sql} AS ${this.encodeName(name)}`;
  }

  sqlCall(type: mm.SQLCallType): string {
    switch (type) {
      case mm.SQLCallType.datetimeNow:
        return 'NOW';
      case mm.SQLCallType.dateNow:
        return 'CURDATE';
      case mm.SQLCallType.timeNow:
        return 'CURTIME';
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
      default:
        throw new Error(`Unsupported type of call "${type}"`);
    }
  }

  private absoluteSQLType(colType: mm.ColumnType): string {
    const DT = mm.dt;
    const size = colType.length;
    for (const type of colType.types) {
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
        case DT.varChar: {
          return `VARCHAR(${size})`;
        }
        case DT.char: {
          return `CHAR(${size})`;
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

  private goTypeNonNull(colType: mm.ColumnType): TypeInfo | string {
    const DT = mm.dt;
    const unsigned = colType.unsigned;
    for (const type of colType.types) {
      switch (type) {
        case DT.bigInt: {
          return unsigned ? 'uint64' : 'int64';
        }
        case DT.int: {
          return unsigned ? 'uint' : 'int';
        }
        case DT.smallInt: {
          return unsigned ? 'uint16' : 'int16';
        }
        case DT.tinyInt: {
          return unsigned ? 'uint8' : 'int8';
        }
        case DT.varChar:
        case DT.char:
        case DT.text: {
          return 'string';
        }

        case DT.datetime:
        case DT.date:
        case DT.time: {
          return TimeType;
        }
      }
    }
    throw new Error(`Type not supported: ${this.inspectTypes(colType.types)}`);
  }

  private inspectTypes(types: string[]): string {
    if (!types) {
      return 'null';
    }
    return `[${types.join()}]`;
  }

  private toPointerType(type: string | TypeInfo): TypeInfo {
    if (type instanceof TypeInfo) {
      return new TypeInfo(`*${type.typeName}`, type.namespace);
    }
    return new TypeInfo(`*${type}`);
  }
}

export const mysql = new MySQL();
