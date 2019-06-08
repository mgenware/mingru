import * as dd from 'dd-models';
import { Dialect } from '../dialect';
import NameContext from '../lib/nameContext';
import SQLVariableList from '../io/sqlInputList';

export default class VarInfo {
  static fromInputs(
    dialect: Dialect,
    nameContext: NameContext,
    inputs: SQLVariableList,
  ): VarInfo[] {
    const res: VarInfo[] = [];
    for (const input of inputs.list) {
      let type: string;
      if (input.typeInfo instanceof dd.Column) {
        type = dialect.convertColumnType((input.typeInfo as dd.Column).type);
      } else {
        type = input.typeInfo as string;
      }
      res.push(new VarInfo(input.name, input.name, nameContext, type, input));
    }
    return res;
  }

  name: string;

  constructor(
    name: string, // Name defined in TS model
    public dbName: string, // Raw DB column name
    nameContext: NameContext,
    public type: string,
    public rawObject: dd.SQLVariable | dd.Column,
  ) {
    this.name = nameContext.get(name);
  }
}
