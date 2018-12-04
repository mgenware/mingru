import { Dialect, TypeBridge } from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';

// Not needed by now
// const NullBool = 'NullBool';
// const NullFloat64 = 'NullFloat64';
const NullInt64 = 'NullInt64';
const NullString = 'NullString';

function sysType(type: string): TypeBridge {
  return new TypeBridge(type, null, true);
}

function nullType(type: string): TypeBridge {
  return new TypeBridge(`sql.${type}`, 'database/sql', true);
}

function timeType(): TypeBridge {
  return new TypeBridge('time.Time', 'time', true);
}

function nullTimeType(): TypeBridge {
  return new TypeBridge(
    'mysql.NullTime',
    'github.com/go-sql-driver/mysql',
    false,
  );
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

        case DT.datetime:
        case DT.date: {
          if (nullable) {
            return nullTimeType();
          }
          return timeType();
        }
      }
    }
    throw new Error(`Type not supported: ${this.inspectTypes(column.types)}`);
  }

  as(sql: string, name: string): string {
    return `${sql} AS ${this.escape(name)}`;
  }

  private inspectTypes(types: Set<string>): string {
    if (!types) {
      return 'null';
    }
    return `"${[...types].join()}"`;
  }
}
