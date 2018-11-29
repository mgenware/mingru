import { Dialect, TypeBridge } from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';

// Not needed by now
// const NullBool = 'NullBool';
// const NullFloat64 = 'NullFloat64';
const NullInt64 = 'NullInt64';
const NullString = 'NullString';

function sysType(type: string): TypeBridge {
  return new TypeBridge(type);
}

function nullType(type: string): TypeBridge {
  const b = new TypeBridge(`sql.${type}`);
  b.importPath = 'database/sql';
  return b;
}

export default class MySQL extends Dialect {
  escape(name: string): string {
    throwIfFalsy(name, 'name');
    return '`' + name + '`';
  }

  goType(column: dd.Column): TypeBridge {
    throwIfFalsy(column, 'column');

    const DT = dd.dt;
    const unsigned = column.props.unsigned;
    const nullable = !column.props.notNull;
    for (const type of column.types) {
      switch (type) {
        case DT.bigInt: {
          if (nullable) {
            return nullType(NullInt64);
          }
          return sysType(unsigned ? 'uint64' : 'int64');
        }
        case DT.int: {
          if (nullable) {
            return nullType(NullInt64);
          }
          return sysType(unsigned ? 'uint' : 'int');
        }
        case DT.smallInt: {
          if (nullable) {
            return nullType(NullInt64);
          }
          return sysType(unsigned ? 'uint16' : 'int16');
        }
        case DT.tinyInt: {
          if (nullable) {
            return nullType(NullInt64);
          }
          return sysType(unsigned ? 'uint8' : 'int8');
        }
        case DT.varChar:
        case DT.char:
        case DT.text: {
          if (nullable) {
            return nullType(NullString);
          }
          return sysType('string');
        }
      }
    }
    throw new Error(`Type not supported: ${toTypeString(column.types)}`);
  }

  as(sql: string, name: string): string {
    return `${sql} AS ${this.escape(name)}`;
  }

  goString(s: string): string {
    return JSON.stringify(s);
  }
}
