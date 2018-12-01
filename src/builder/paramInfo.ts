import * as dd from 'dd-models';
import { Dialect, TypeBridge } from '../dialect';
import { SQLIO } from '../io/io';

export default class ParamInfo {
  static fromColumn(dialect: Dialect, col: dd.ColumnBase): ParamInfo {
    return new ParamInfo(
      col.__name,
      dialect.goType(col.__getTargetColumn()),
      col,
    );
  }

  static fromSQLArray(dialect: Dialect, sqls: SQLIO[]): ParamInfo[] {
    const res: ParamInfo[] = [];
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
          res.push(new ParamInfo(input.name, type, input));
        }
      }
    }
    return res;
  }

  constructor(
    public name: string,
    public type: TypeBridge,
    public rawObject: dd.InputParam | dd.ColumnBase,
  ) {}
}
