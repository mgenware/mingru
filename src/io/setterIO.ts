import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { SQLIO } from './sqlIO';
import VarList from '../lib/varList';
import Dialect from '../dialect';

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

export function settersToVarList(
  name: string,
  setters: SetterIO[],
  dialect: Dialect,
): VarList {
  // Set inputs
  const list = new VarList(name);
  // Merge setter inputs
  for (const setter of setters) {
    if (setter.sql.inputs.length) {
      list.addSQLVars(setter.sql.inputs, dialect);
    }
  }
  return list;
}
