import * as dd from 'dd-models';
import Dialect from '../dialect';
import { SQLIO } from '../io/io';

export default class ParamInfo {
  static getList(dialect: Dialect, sqls: Array<SQLIO|null>): ParamInfo[] {
    if (!sqls) {
      return [];
    }
    const result: ParamInfo[] = [];
    // Filter out null values
    for (const sql of sqls) {
      if (!sql) {
        continue;
      }
      for (const element of sql.sql.elements) {
        if (element instanceof dd.InputParam) {
          const input = element as dd.InputParam;
          let type;
          if (input.type instanceof dd.Column) {
            type = dialect.goType(input.type as dd.Column).type;
          } else {
            type = input.type as string;
          }
          result.push(new ParamInfo(input.name, type, input));
        }
      }
    }
    return result;
  }

  constructor(
    public name: string,
    public type: string,
    public inputParam: dd.InputParam,
  ) { }
}
