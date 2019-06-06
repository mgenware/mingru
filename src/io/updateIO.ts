import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import { TableIO, settersToInputs, ActionIO } from './common';
import { SetterIO } from './common';
import { SQLIO } from './sqlIO';
import SQLVariableList from './sqlInputList';

export const RowsAffectedKey = 'rows_affected';
export const rowsAffectedVarList = new SQLVariableList();
rowsAffectedVarList.add(new dd.SQLVariable(dd.int(), RowsAffectedKey));
rowsAffectedVarList.seal();

export class UpdateIO extends ActionIO {
  // Accumulated inputs (whereInputs + setterInputs)
  inputs: SQLVariableList;
  setterInputs: SQLVariableList;

  constructor(
    public action: dd.UpdateAction,
    public sql: string,
    public table: TableIO,
    public setters: SetterIO[],
    public where: SQLIO | null,
  ) {
    super();
    throwIfFalsy(action, 'action');
    throwIfFalsy(sql, 'sql');
    throwIfFalsy(table, 'table');
    throwIfFalsy(setters, 'setters');

    const setterInputs = settersToInputs(this.setters);
    if (this.where) {
      const inputs = this.where.inputs.copy();
      inputs.merge(setterInputs);
      inputs.seal();
      this.inputs = inputs;
    } else {
      this.inputs = setterInputs;
    }
    this.setterInputs = setterInputs;
  }

  getInputs(): SQLVariableList {
    return this.inputs;
  }

  getReturns(): SQLVariableList {
    return rowsAffectedVarList;
  }
}

class UpdateIOProcessor {
  constructor(public action: dd.UpdateAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): UpdateIO {
    let sql = 'UPDATE ';
    const { action, dialect } = this;
    const table = action.__table as dd.Table;

    if (!action.whereSQL && !action.allowNoWhere) {
      throw new Error(
        `You have to call unsafeUpdateAll to build an action without a WHERE clause, action name: "${
          action.__name
        }"`,
      );
    }

    // setters
    const { setters } = action;
    if (!setters.size) {
      throw new Error(
        `The update action "${action}" does not have any setters`,
      );
    }

    // table
    const fromIO = this.handleFrom(table);
    sql += `${fromIO.sql} SET `;

    const setterIOs = SetterIO.fromMap(setters);
    sql += setterIOs
      .map(s => `${dialect.escapeColumn(s.col)} = ${s.sql.toSQL(dialect)}`)
      .join(', ');

    // where
    const whereIO = action.whereSQL ? new SQLIO(action.whereSQL) : null;
    if (whereIO) {
      sql += ` WHERE ${whereIO.toSQL(dialect)}`;
    }
    return new UpdateIO(action, sql, fromIO, setterIOs, whereIO);
  }

  private handleFrom(table: dd.Table): TableIO {
    const e = this.dialect.escape;
    const sql = `${e(table.getDBName())}`;
    return new TableIO(table, sql);
  }
}

export function updateIO(action: dd.UpdateAction, dialect: Dialect): UpdateIO {
  const pro = new UpdateIOProcessor(action, dialect);
  return pro.convert();
}
