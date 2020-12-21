import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SQLIO, sqlIO, SQLIOBuilderOption } from './sqlIO';
import VarList from '../lib/varList';
import { Dialect } from '../dialect';
import { VarInfo } from '../lib/varInfo';
import dtDefault from '../build/dtDefault';

export class SetterIO {
  static fromAction(
    action: mm.CoreUpdateAction,
    dialect: Dialect,
    allowUnsetValues: boolean,
    sourceTable: mm.Table | null,
    opt?: SQLIOBuilderOption,
  ): SetterIO[] {
    const table = action.__getData().sqlTable || sourceTable;
    if (!table) {
      throw new Error(`Unexpected empty table in \`SetterIO\`, action "${action}"`);
    }
    const actionData = action.__getData();
    const actionSetters = actionData.setters ?? new Map<mm.Column, unknown>();

    // User setters come first.
    // eslint-disable-next-line arrow-body-style
    const res = Array.from(actionSetters, ([key, value]) => {
      // Pass `null` for table argument. If `value` is not SQL, it's the default value of a column,
      // thus no need the table argument as it's not an SQL object.
      return new SetterIO(
        key,
        sqlIO(
          value instanceof mm.SQL ? value : mm.sql`${dialect.objToSQL(value, null)}`,
          dialect,
          sourceTable,
          opt,
        ),
      );
    });

    for (const col of Object.values(table.__getData().columns)) {
      if (!col) {
        continue;
      }
      // Skip user setters.
      const userSetterValue = actionSetters.get(col);
      if (userSetterValue !== undefined && userSetterValue !== null) {
        continue;
      }

      // Skip AUTO_INCREMENT PKs.
      const colType = col.__mustGetType();
      if (colType.autoIncrement) {
        continue;
      }

      let isValueSet = false;
      if (actionData.autoSetters) {
        for (const autoSetter of actionData.autoSetters) {
          const defValue = col.__getData().defaultValue;
          if (autoSetter === mm.AutoSetterType.default && defValue === undefined) {
            continue;
          }
          isValueSet = true;
          res.push(this.getAutoSetterValue(col, autoSetter, table, dialect, sourceTable, opt));
          // If value is set, no need to check other auto setter values.
          break;
        }
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
    sourceTable: mm.Table | null,
    opt?: SQLIOBuilderOption,
  ): SetterIO {
    if (autoSetter === mm.AutoSetterType.input) {
      return new SetterIO(col, sqlIO(mm.sql`${col.toInput()}`, dialect, sourceTable, opt));
    }
    if (autoSetter === mm.AutoSetterType.default) {
      let value: mm.SQL;
      const colData = col.__getData();
      const colType = col.__mustGetType();
      const defValue = colData.defaultValue;
      if (defValue !== undefined && defValue !== null) {
        if (defValue instanceof mm.SQL) {
          value = defValue;
        } else {
          value = dialect.objToSQL(defValue, table);
        }
      } else if (colType.nullable) {
        value = mm.sql`NULL`;
      } else {
        const type = colType.types[0];
        if (!type) {
          throw new Error('Unexpected empty column types');
        }
        const def = dtDefault(type);
        if (def === null) {
          throw new Error(
            `Cannot determine the default value of type "${type}" at column "${col}"`,
          );
        }
        value = dialect.objToSQL(def, table);
      }

      return new SetterIO(col, sqlIO(value, dialect, sourceTable, opt));
    }
    throw new Error(`Unsupported auto setter type "${autoSetter}"`);
  }

  constructor(public col: mm.Column, public sql: SQLIO) {
    throwIfFalsy(col, 'col');
    throwIfFalsy(sql, 'sql');
  }
}

export function settersToVarList(name: string, setters: SetterIO[], items?: VarInfo[]): VarList {
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
