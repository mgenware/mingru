import { Dialect } from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
const escapeString = require('sql-escape-string');

const TimeType = 'time.Time|time';

export default class MySQL extends Dialect {
  escape(name: string): string {
    throwIfFalsy(name, 'name');
    return '`' + name + '`';
  }

  translate(value: unknown): string {
    // tslint:disable-next-line
    if (value === undefined) {
      throw new Error('value is undefined');
    }
    // tslint:disable-next-line
    if (value === null) {
      return 'NULL';
    }
    // tslint:disable-next-line
    if (typeof value === 'boolean' || typeof value === 'number') {
      return `${+(value as number)}`;
    }
    // tslint:disable-next-line
    if (typeof value === 'string') {
      return escapeString(value);
    }
    throw new Error(`Unsupported type of object "${toTypeString(value)}"`);
  }

  convertColumnType(type: dd.ColumnType): string {
    throwIfFalsy(type, 'type');
    let typeName = this.goTypeNonNull(type);
    if (type.nullable) {
      typeName = '*' + typeName;
    }
    return typeName;
  }

  as(sql: string, name: string): string {
    return `${sql} AS ${this.escape(name)}`;
  }

  sqlCall(type: dd.SQLCallType): string {
    switch (type) {
      case dd.SQLCallType.datetimeNow:
        return 'NOW';
      case dd.SQLCallType.dateNow:
        return 'CURDATE';
      case dd.SQLCallType.timeNow:
        return 'CURTIME';
      case dd.SQLCallType.count:
        return 'COUNT';
      case dd.SQLCallType.coalesce:
        return 'COALESCE';
      default:
        throw new Error(`Unsupported type of call "${type}"`);
    }
  }

  private goTypeNonNull(colType: dd.ColumnType): string {
    const DT = dd.dt;
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
        case DT.date: {
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
}
