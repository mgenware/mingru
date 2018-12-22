import * as dd from 'dd-models';
import { Dialect, TypeBridge } from '../dialect';
import { SQLIO } from '../io/io';
import NameContext from '../lib/nameContext';

export default class VarInfo {
  static fromColumn(
    dialect: Dialect,
    col: dd.ColumnBase,
    nameContext: NameContext,
  ): VarInfo {
    return new VarInfo(
      col.__name,
      nameContext,
      dialect.goType(col.__getTargetColumn()),
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
            type = dialect.goType(input.typeObject as dd.Column);
          } else {
            type = new TypeBridge(input.typeObject as string, null, false);
          }
          res.push(new VarInfo(input.name, nameContext, type, input));
        }
      }
    }
    return res;
  }

  name: string;

  constructor(
    name: string,
    nameContext: NameContext,
    public type: TypeBridge,
    public rawObject: dd.SQLInput | dd.ColumnBase,
  ) {
    this.name = nameContext.get(name);
  }
}
