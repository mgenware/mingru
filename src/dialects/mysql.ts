import Dialect from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';

export default class MySQL extends Dialect {
  escape(name: string): string {
    throwIfFalsy(name, 'name');
    return '`' + name + '`';
  }

  goType(column: dd.Column): string {
    throwIfFalsy(column, 'column');

    const DT = dd.dt;
    const unsigned = column.unsigned;
    for (const type of column.types) {
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
      }
    }
    throw new Error(`Type not supported: ${toTypeString(column.types)}`);
  }
}
