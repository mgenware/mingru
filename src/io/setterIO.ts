import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SQLIO } from './sqlIO';
import SQLVariableList from './sqlInputList';

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
