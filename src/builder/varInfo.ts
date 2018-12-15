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
        if (element instanceof dd.InputParam) {
          const input = element as dd.InputParam;
          let type: TypeBridge;
          if (input.type instanceof dd.Column) {
            type = dialect.goType(input.type as dd.Column);
          } else {
            type = new TypeBridge(input.type as string, null, false);
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
    public rawObject: dd.InputParam | dd.ColumnBase,
  ) {
    this.name = nameContext.get(name);
  }
}
