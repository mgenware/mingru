import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SQLIO, sqlIO } from './sqlIO';
import VarList from '../lib/varList';
import Dialect from '../dialect';
import VarInfo from '../lib/varInfo';
import dtDefault from '../build/dtDefault';

export class SetterIO {
  static fromAction(
    action: mm.CoreUpdateAction,
    dialect: Dialect,
    allowUnsetValues: boolean,
  ): SetterIO[] {
    const [table] = action.ensureInitialized();
    const { setters: actionSetters } = action;

    // User setters come first.
    // eslint-disable-next-line arrow-body-style
    const res = Array.from(action.setters, ([key, value]) => {
      // Pass `null` for table argument. If `value` is not SQL, it's the default value of a column,
      // thus no need the table argument as it's not an SQL object.
      return new SetterIO(
        key,
        sqlIO(
          value instanceof mm.SQL
            ? value
            : mm.sql`${dialect.objToSQL(value, null)}`,
          dialect,
        ),
      );
    });

    for (const col of Object.values(table.__columns)) {
      // Skip user setter.
      if (actionSetters.get(col)) {
        continue;
      }

      // Skip AUTO_INCREMENT PKs
      if (col.__type.autoIncrement) {
        continue;
      }

      let isValueSet = false;
      for (const autoSetter of action.autoSetters) {
        const defValue = col.__defaultValue;
        if (
          autoSetter === mm.AutoSetterType.default &&
          defValue === undefined
        ) {
          continue;
        }
        isValueSet = true;
        res.push(this.getAutoSetterValue(col, autoSetter, table, dialect));
        // If value is set, no need to check other auto setter values.
        break;
      }
      if (!isValueSet && !allowUnsetValues) {
        throw new Error(`${col} is not set by any setter`);
      }
    }

    return res;
  }

  private static getAutoSetterValue(
    col: mm.Column,
    autoSetter: mm.AutoSetterType,
    table: mm.Table,
    dialect: Dialect,
  ): SetterIO {
    if (autoSetter === mm.AutoSetterType.input) {
      return new SetterIO(col, sqlIO(mm.sql`${col.toInput()}`, dialect));
    }
    if (autoSetter === mm.AutoSetterType.default) {
      let value: string;
      const defValue = col.__defaultValue;
      if (defValue) {
        if (defValue instanceof mm.SQL) {
          const valueIO = sqlIO(defValue, dialect);
          value = valueIO.toSQL(table);
        } else {
          value = dialect.objToSQL(defValue, table);
        }
      } else if (col.__type.nullable) {
        value = 'NULL';
      } else {
        const type = col.__type.types[0];
        const def = dtDefault(type);
        if (def === null) {
          throw new Error(
            `Cannot determine the default value of type "${type}" at column ${col.__name}`,
          );
        }
        value = dialect.objToSQL(def, table);
      }

      return new SetterIO(col, sqlIO(mm.sql`${value}`, dialect));
    }
    throw new Error(`Unsupported auto setter type "${autoSetter}"`);
  }

  constructor(public col: mm.Column, public sql: SQLIO) {
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
