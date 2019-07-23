import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SQLIO, sqlIO } from './sqlIO';
import VarList from '../lib/varList';
import Dialect from '../dialect';
import VarInfo from '../lib/varInfo';
import dtDefault from '../build/dtDefault';

export class SetterIO {
  static fromAction(action: dd.CoreUpdateAction, dialect: Dialect): SetterIO[] {
    const result = Array.from(
      action.setters,
      ([key, value]) => new SetterIO(key, sqlIO(value, dialect)),
    );
    if (action.autoSetter) {
      const { setters: actionSetters } = action;
      const table = action.__table;
      if (!table) {
        throw new Error('Action does not have a bound table');
      }
      dd.enumerateColumns(table, col => {
        // If already set, return
        if (actionSetters.get(col)) {
          return;
        }

        // Skip AUTO_INCREMENT PKs
        if (col.type.autoIncrement) {
          return;
        }

        if (action.autoSetter === 'input') {
          result.push(
            new SetterIO(col, sqlIO(dd.sql`${col.toInput()}`, dialect)),
          );
        } else {
          let value: string;
          if (col.defaultValue) {
            if (col.defaultValue instanceof dd.SQL) {
              const valueIO = sqlIO(col.defaultValue as dd.SQL, dialect);
              value = valueIO.toSQL();
            } else {
              value = dialect.objToSQL(col.defaultValue);
            }
          } else if (col.type.nullable) {
            value = 'NULL';
          } else {
            const type = col.type.types[0];
            const def = dtDefault(type);
            // tslint:disable-next-line
            if (def === null) {
              throw new Error(
                `Cannot determine the default value of type "${type}" at column ${
                  col.__name
                }`,
              );
            }
            value = dialect.objToSQL(def);
          }

          result.push(new SetterIO(col, sqlIO(dd.sql`${value}`, dialect)));
        }
      });
    }
    return result;
  }

  constructor(public col: dd.Column, public sql: SQLIO) {
    throwIfFalsy(col, 'col');
    throwIfFalsy(sql, 'sql');
  }
}

export function settersToVarList(
  name: string,
  setters: SetterIO[],
  items?: VarInfo[],
): VarList {
  // Set inputs
  const list = new VarList(name);
  if (items) {
    for (const v of items) {
      list.add(v);
    }
  }
  // Merge setter inputs
  for (const setter of setters) {
    list.merge(setter.sql.varList.list);
  }
  return list;
}
