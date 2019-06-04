import * as dd from 'dd-models';
import { Dialect, TypeBridge } from '../dialect';
import { SQLIO } from '../io/sqlIO';
import NameContext from '../lib/nameContext';
import SQLVariableList from '../io/sqlInputList';

export default class VarInfo {
  static fromColumn(
    dialect: Dialect,
    col: dd.Column,
    nameContext: NameContext,
  ): VarInfo {
    return new VarInfo(
      col.__name,
      col.getDBName(),
      nameContext,
      dialect.goType(col.type),
      col,
    );
  }

  static fromSQLArray(
    dialect: Dialect,
    sqls: SQLIO[],
    nameContext: NameContext,
  ): VarInfo[] {
    const res: VarInfo[] = [];
    for (const sql of sqls) {
      for (const element of sql.sql.elements) {
        if (element.type === dd.SQLElementType.input) {
          const input = element.toInput();
          let type: TypeBridge;
          if (input.typeObject instanceof dd.Column) {
            type = dialect.goType((input.typeObject as dd.Column).type);
          } else {
            type = new TypeBridge(input.typeObject as string, null, false);
          }
          res.push(
            new VarInfo(input.name, input.name, nameContext, type, input),
          );
        }
      }
    }
    return res;
  }

  static fromInputs(
    dialect: Dialect,
    nameContext: NameContext,
    inputs: SQLVariableList,
  ): VarInfo[] {
    const res: VarInfo[] = [];
    for (const input of inputs.list) {
      let type: TypeBridge;
      if (input.typeObject instanceof dd.Column) {
        type = dialect.goType((input.typeObject as dd.Column).type);
      } else {
        type = new TypeBridge(input.typeObject as string, null, false);
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
    public type: TypeBridge,
    public rawObject: dd.SQLVariable | dd.Column,
  ) {
    this.name = nameContext.get(name);
  }
}
