import { Dialect, TypeBridge } from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';

function sysType(type: string): TypeBridge {
  return new TypeBridge(type, null, true);
}

function timeType(): TypeBridge {
  return new TypeBridge('time.Time', '"time"', true);
}

export default class MySQL extends Dialect {
  escape(name: string): string {
    throwIfFalsy(name, 'name');
    return '`' + name + '`';
  }

  goType(column: dd.Column): TypeBridge {
    throwIfFalsy(column, 'column');
    const bridge = this.goTypeNonNull(column);
    if (!column.props.notNull) {
      bridge.type = '*' + bridge.type;
    }
    return bridge;
  }

  as(sql: string, name: string): string {
    return `${sql} AS ${this.escape(name)}`;
  }

  private goTypeNonNull(column: dd.Column): TypeBridge {
    const DT = dd.dt;
    const unsigned = column.props.unsigned;
    for (const type of column.types) {
      switch (type) {
        case DT.bigInt: {
          return sysType(unsigned ? 'uint64' : 'int64');
        }
        case DT.int: {
          return sysType(unsigned ? 'uint' : 'int');
        }
        case DT.smallInt: {
          return sysType(unsigned ? 'uint16' : 'int16');
        }
        case DT.tinyInt: {
          return sysType(unsigned ? 'uint8' : 'int8');
        }
        case DT.varChar:
        case DT.char:
        case DT.text: {
          return sysType('string');
        }

        case DT.datetime:
        case DT.date: {
          return timeType();
        }
      }
    }
    throw new Error(`Type not supported: ${this.inspectTypes(column.types)}`);
  }

  private inspectTypes(types: Set<string>): string {
    if (!types) {
      return 'null';
    }
    return `"${[...types].join()}"`;
  }
}
