import { SelectIO } from '../io/select';
import { capitalizeFirstLetter } from '../lib/stringUtil';
import Dialect from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import toTypeString from 'to-type-string';
import select from '../io/select';

const Indent = '\t';
const Newline = '\n';
const QueryableParam = 'queryable';
const QueryableType = 'sqlx.Queryable';

export default class GoBuilder {
  memberNames: Set<string> = new Set<string>();

  private tableName: string;
  private tableClassType: string;

  constructor(
    public dialect: Dialect,
    public tableActions: dd.TableActionCollection,
  ) {
    throwIfFalsy(tableActions, 'tableActions');
    this.tableName = this.tableActions.table.__name;
    this.tableClassType = `${this.tableName}DA`;
  }

  build(): string {
    const { tableActions } = this;

    let code = this.buildDataObject(tableActions);
    code += `// ----- Actions ----- //${Newline}`;
    for (const action of tableActions.map.values()) {
      code += this.buildAction(action);
    }
    return code;
  }

  private buildDataObject(tableActions: dd.TableActionCollection): string {
    const tableName = tableActions.table.__name;
    const clsName = tableName + 'TableType';
    const objName = capitalizeFirstLetter(tableName);
    let code = `type ${clsName} struct {${Newline}}${Newline}`;
    code += `var ${objName} = &${clsName}{}${Newline}${Newline}`;
    return code;
  }

  private buildAction(action: unknown): string {
    const { dialect } = this;
    if (action instanceof dd.SelectAction) {
      const selectAction = action as dd.SelectAction;
      const io = select(selectAction, dialect);
      return this.select(io);
    }
    throw new Error(`Not supported io object "${toTypeString(action)}"`);
  }

  private select(io: SelectIO): string {
    const { dialect, tableClassType } = this;
    const actionName = capitalizeFirstLetter(io.action.name);
    const funcName = this.getMemberName('Select', actionName);
    const resultTypeName = funcName + 'Result';

    let code = '';
    // Build result type
    code += `type ${resultTypeName} struct {${Newline}`;

    const colNames = new Set<string>();
    for (const col of io.cols) {
      const fieldName = col.name;
      // TOOO: support alias
      if (colNames.has(fieldName)) {
        throw new Error(`Column name "${fieldName}" already exists`);
      }
      colNames.add(fieldName);
      const fieldType = dialect.goType(col.col.__getTargetColumn());

      code += `${Indent}${capitalizeFirstLetter(fieldName)} ${fieldType}\n`;
    }
    code += `}${Newline}${Newline}`;

    // Build func
    let paramsCode = `${QueryableParam} ${QueryableType}`;
    if (io.where) {
      for (const element of io.where.sql.elements) {
        if (element instanceof dd.InputParam) {
          const input = element as dd.InputParam;
          let typeCode;
          if (input.type instanceof dd.Column) {
            typeCode = dialect.goType(input.type as dd.Column);
          } else {
            typeCode = input.type as string;
          }
          paramsCode += `, ${input.name} ${typeCode}`;
        }
      }
    }
    // > func
    code += `func (da *${tableClassType}) ${actionName}(${paramsCode}) *${resultTypeName} {`;
    code += `${Indent}var result *${resultTypeName}`;
    // > call
    code += `err := .QueryRow("${io.sql}`;
    if (io.where) {
    }

    // < call
    code += '")';

    // < func
    code += `}${Newline}`;
    return code;
  }

  private getMemberName(prefix: string, viewName: string) {
    const name = prefix + viewName;
    return name;
  }
}
