import * as mm from 'mingru-models';
import { SQLIO, sqlIO, SQLIOBuilderOption } from './sqlIO.js';
import { ParamList } from '../lib/varList.js';
import { VarDef } from '../lib/varInfo.js';
import dtDefault from '../build/dtDefault.js';
import ctx from '../ctx.js';

export class SetterIO {
  static fromAction(
    action: mm.CoreUpdateAction,
    allowUnsetValues: boolean,
    sourceTable: mm.Table | null,
    context: string,
    opt?: SQLIOBuilderOption,
  ): SetterIO[] {
    const table = action.__getData().sqlTable || sourceTable;
    if (!table) {
      throw new Error(`Unexpected empty table in \`SetterIO\`, action "${action}"`);
    }
    const actionData = action.__getData();
    const actionSetters = actionData.setters ?? new Map<mm.Column, unknown>();
    const res: SetterIO[] = [];

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
      const colType = col.__type();
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
          res.push(
            this.getAutoSetterValue(
              col,
              autoSetter,
              actionData.autoSetterParamsOpt,
              table,
              sourceTable,
              `${context} [AutoSetter on ${col}]`,
              opt,
            ),
          );
          // If value is set, no need to check other auto setter values.
          break;
        }
      }
      if (!isValueSet && !allowUnsetValues) {
        throw new Error(`${col} is not set by any setter`);
      }
    }

    // User setters come last cuz some of them might depend on other columns.
    // eslint-disable-next-line arrow-body-style
    const userSetters = Array.from(actionSetters, ([key, value]) => {
      // Pass `null` for table argument. If `value` is not SQL, it's the default value of a column,
      // thus no need the table argument as it's not an SQL object.
      return new SetterIO(
        key,
        sqlIO(
          value instanceof mm.SQL ? value : mm.sql`${ctx.dialect.objToSQL(value, null)}`,
          sourceTable,
          `${context} [Key: ${key}, value: ${value}]`,
          opt,
        ),
      );
    });
    res.push(...userSetters);
    return res;
  }

  private static getAutoSetterValue(
    col: mm.Column,
    autoSetter: mm.AutoSetterType,
    autoSetterSetParamsOpt: mm.SetParamsOptions | undefined,
    table: mm.Table,
    sourceTable: mm.Table | null,
    context: string,
    opt?: SQLIOBuilderOption,
  ): SetterIO {
    switch (autoSetter) {
      case mm.AutoSetterType.param: {
        const param = autoSetterSetParamsOpt?.toParamCallback
          ? autoSetterSetParamsOpt.toParamCallback(col)
          : col.toParam(undefined, autoSetterSetParamsOpt?.toParamOpt);
        return new SetterIO(
          col,
          sqlIO(mm.sql`${param}`, sourceTable, `${context} [Handling param setter on ${col}]`, opt),
        );
      }

      case mm.AutoSetterType.default: {
        let value: mm.SQL;
        const colData = col.__getData();
        const colType = col.__type();
        const defValue = colData.defaultValue;
        if (defValue !== undefined && defValue !== null) {
          if (defValue instanceof mm.SQL) {
            value = defValue;
          } else {
            value = ctx.dialect.objToSQL(defValue, table);
          }
        } else if (colType.nullable) {
          value = mm.sql`${mm.constants.NULL}`;
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
          value = ctx.dialect.objToSQL(def, table);
        }

        return new SetterIO(col, sqlIO(value, sourceTable, context, opt));
      }

      default:
        throw new Error(`Unsupported auto setter type "${autoSetter}"`);
    }
  }

  constructor(public col: mm.Column, public sql: SQLIO) {}
}

export function settersToParamList(name: string, setters: SetterIO[], items?: VarDef[]) {
  // Set inputs
  const list = new ParamList(name);
  if (items) {
    for (const v of items) {
      list.add(v);
    }
  }
  // Merge setter inputs
  for (const setter of setters) {
    list.merge(setter.sql.vars.list);
  }
  return list;
}
