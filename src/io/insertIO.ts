import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import dtDefault from '../build/dtDefault';
import { ActionIO, settersToInputs } from './common';
import { SetterIO } from './common';
import { SQLIO } from './sqlIO';
import SQLVariableList from './sqlInputList';

export const InsertedIDKey = 'inserted_id';
const insertedIDVarList = new SQLVariableList();
insertedIDVarList.add(new dd.SQLVariable(dd.int(), InsertedIDKey));
insertedIDVarList.seal();

export class InsertIO extends ActionIO {
  private inputs: SQLVariableList;

  constructor(
    public action: dd.InsertAction,
    public sql: string,
    public setters: SetterIO[],
  ) {
    super(action);
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');

    this.inputs = settersToInputs(this.setters);
  }

  getInputs(): SQLVariableList {
    return this.inputs;
  }

  getReturns(): SQLVariableList {
    return insertedIDVarList;
  }
}

export class InsertIOProcessor {
  constructor(public action: dd.InsertAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): InsertIO {
    let sql = 'INSERT INTO ';
    const { action, dialect } = this;
    const { setters: actionSetters, withDefaults, __table: table } = action;

    // table
    const tableSQL = this.handleFrom(table);
    sql += tableSQL;

    // setters
    if (!actionSetters.size) {
      throw new Error(
        `The insert action "${action}" does not have any setters`,
      );
    }
    const setters = SetterIO.fromMap(actionSetters);

    // Try to set the remaining columns to defaults if withDefaults is true
    if (withDefaults) {
      dd.enumerateColumns(table, col => {
        // If already set, return
        if (actionSetters.get(col)) {
          return;
        }

        const colName = col.__name;
        if (col.isJoinedColumn()) {
          throw new Error(
            `Unexpected JoinedColumn in InsertAction, column name: "${colName}"`,
          );
        }
        if (col.foreignColumn) {
          throw new Error(
            `Cannot set a default value for a foreign column, column "${colName}"`,
          );
        }

        // Skip PKs
        if (col.type.pk) {
          return;
        }

        let value: string;
        if (col.default) {
          if (col.default instanceof dd.SQL) {
            const valueIO = new SQLIO(col.default as dd.SQL);
            value = valueIO.toSQL(dialect);
          } else {
            value = dialect.translate(col.default);
          }
        } else if (col.type.nullable) {
          value = 'NULL';
        } else {
          const type = col.type.types[0];
          const def = dtDefault(type);
          // tslint:disable-next-line
          if (def === null) {
            throw new Error(
              `Cannot determine the default value of type "${type}" at column ${colName}`,
            );
          }
          value = dialect.translate(def);
        }

        setters.push(new SetterIO(col, new SQLIO(dd.sql`${value}`)));
      });
    }

    const colNames = setters.map(s => dialect.escapeColumn(s.col));
    sql += ` (${colNames.join(', ')})`;

    // values
    const colValues = setters.map(s => s.sql.toSQL(dialect));
    sql += ` VALUES (${colValues.join(', ')})`;

    return new InsertIO(action, sql, setters);
  }

  private handleFrom(table: dd.Table): string {
    const e = this.dialect.escape;
    return `${e(table.getDBName())}`;
  }
}

export function insertIO(action: dd.InsertAction, dialect: Dialect): InsertIO {
  const pro = new InsertIOProcessor(action, dialect);
  return pro.convert();
}
