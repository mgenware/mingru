import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import SQLVariableList from './sqlInputList';
import { SQLIO } from './sql';

export class TableIO {
  constructor(public table: dd.Table, public sql: string) {
    throwIfFalsy(table, 'table');
    throwIfFalsy(sql, 'sql');
  }
}

export class ActionIO {
  getInputs(): SQLVariableList {
    throw new Error('Not implemented yet');
  }
}

export class SetterIO {
  static fromMap(map: Map<dd.Column, dd.SQL>): SetterIO[] {
    return Array.from(
      map,
      ([key, value]) => new SetterIO(key, new SQLIO(value)),
    );
  }

  constructor(public col: dd.Column, public sql: SQLIO) {
    throwIfFalsy(col, 'col');
    throwIfFalsy(sql, 'sql');
  }
}

export function settersToInputs(setters: SetterIO[]): SQLVariableList {
  // Set inputs
  const inputs = new SQLVariableList();
  // Merge setter inputs
  for (const setter of setters) {
    if (setter.sql.inputs.length) {
      inputs.merge(setter.sql.inputs);
    }
  }
  inputs.seal();
  return inputs;
}
