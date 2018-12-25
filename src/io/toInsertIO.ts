import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as io from './io';
import dtDefault from '../builder/dtDefault';
import toTypeString from 'to-type-string';

export class InsertProcessor {
  constructor(public action: dd.InsertAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): io.InsertIO {
    let sql = 'INSERT INTO ';
    const { action, dialect } = this;
    const { columnValueMap, withDefaults, table } = action;

    // table
    const tableIO = this.handleFrom(table);
    sql += tableIO.sql;

    // columns
    if (!columnValueMap.size) {
      throw new Error(
        `The insert action "${action}" does not have any setters`,
      );
    }
    const setters = io.SetterIO.fromMap(columnValueMap);

    // Try to set the remaining columns to defaults if withDefaults is true
    if (withDefaults) {
      dd.Table.forEach(table, col => {
        if (col instanceof dd.ColumnBase === false) {
          throw new Error(
            `Expected a ColumnBase object, got "${toTypeString(
              col,
            )}" on table "${toTypeString(table)}"`,
          );
        }
        if (columnValueMap.get(col)) {
          return;
        }

        const colName = col.__name;
        let value: string;
        switch (col.__type) {
          case dd.ColumnBaseType.Joined:
            throw new Error(
              `Unexpected JoinedColumn in InsertAction, column name: "${colName}"`,
            );

          case dd.ColumnBaseType.Selected:
            throw new Error(
              `Unexpected SelectedColumn in InsertAction, column name: "${colName}"`,
            );

          case dd.ColumnBaseType.Foreign:
            throw new Error(
              `Cannot set a default value for a foreign column, column "${colName}"`,
            );

          case dd.ColumnBaseType.Full: {
            const fullColumn = col as dd.Column;
            // Skip PKs
            if (fullColumn.props.pk) {
              return;
            }

            const { props } = fullColumn;
            if (props.default) {
              value = dialect.encode(props.default);
            } else if (fullColumn.props.nullable) {
              value = 'NULL';
            } else {
              const type = fullColumn.types.values().next().value;
              const def = dtDefault(type);
              // tslint:disable-next-line
              if (def === null) {
                throw new Error(
                  `Cannot determine the default value of type "${type}" at column ${colName}`,
                );
              }
              value = dialect.encode(def);
            }
            break;
          }

          default:
            throw new Error(
              `Unexpected column type in InsertAction, column name: "${
                col.__name
              }", type "${toTypeString(col)}"`,
            );
        }
        setters.push(new io.SetterIO(col, new io.SQLIO(dd.sql`${value}`)));
      });
    }

    const colNames = setters.map(s => dialect.escape(s.col.__name));
    sql += ` (${colNames.join(', ')})`;

    // values
    const colValues = setters.map(s => s.sql.toSQL(dialect));
    sql += ` VALUES (${colValues.join(', ')})`;

    return new io.InsertIO(action, sql, tableIO, setters);
  }

  private handleFrom(table: dd.Table): io.TableIO {
    const e = this.dialect.escape;
    const sql = `${e(table.__name)}`;
    return new io.TableIO(table, sql);
  }
}

export default function insertIO(
  action: dd.InsertAction,
  dialect: Dialect,
): io.InsertIO {
  const pro = new InsertProcessor(action, dialect);
  return pro.convert();
}
