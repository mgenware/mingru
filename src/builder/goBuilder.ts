import { SelectIO } from '../io/select';
import { capitalizeFirstLetter } from '../lib/stringUtil';
import Dialect from '../dialect';
import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { Action } from 'dd-models/dist/actions/action';
import { inspect } from 'util';

const INDENT = '\t';
const NEWLINE = '\n';
const QUERYABLE = 'queryable sqlx.Queryable';

export default class GoBuilder {
  memberNames: Set<string> = new Set<string>();

  private tableName: string;
  private daType: string;

  constructor(
    public dialect: Dialect,
    public tableActions: dd.TableActionCollection,
  ) {
    throwIfFalsy(tableActions, 'tableActions');
    this.tableName = this.tableActions.table.__name;
    this.daType = `${this.tableName}DA`;
  }

  build(): string {
    const { tableActions } = this;

    let code = this.buildDataObject(tableActions);
    code += `// ----- Actions ----- //${NEWLINE}`;
    for (const [_, action] of tableActions.map) {
      code += this.buildAction(action);
    }
    return code;
  }

  private buildDataObject(tableActions: dd.TableActionCollection): string {
    const tableName = tableActions.table.__name;
    const clsName = tableName + 'TableType';
    const objName = capitalizeFirstLetter(tableName);
    let code = `type ${clsName} struct {${NEWLINE}}${NEWLINE}`;
    code += `var ${objName} = &${clsName}{}${NEWLINE}${NEWLINE}`;
    return code;
  }

  private buildAction(io: unknown): string {
    if (io instanceof SelectIO) {
      return this.select(io as SelectIO);
    }
    throw new Error(`Not supported io object "${inspect(io)}"`);
  )

  private select(io: SelectIO): string {
    const { dialect, daType } = this;
    const actionName = capitalizeFirstLetter(io.action.name);
    const funcName = this.getMemberName('Select', actionName);
    const clsName = funcName + 'Result';

    let code = '';
    // Build result type
    code += `type ${clsName} struct {${NEWLINE}`;

    const colNames = new Set<string>();
    for (const col of io.cols) {
      const fieldName = col.name;
      // TOOO: support alias
      if (colNames.has(fieldName)) {
        throw new Error(`Column name "${fieldName}" already exists`);
      }
      colNames.add(fieldName);
      const fieldType = dialect.goType(col.col.__getTargetColumn());

      code += `${INDENT}${capitalizeFirstLetter(fieldName)} ${fieldType}\n`;
    }
    code += `}${NEWLINE}${NEWLINE}`;

    // Build func
    let paramsCode = QUERYABLE;
    if (io.where) {
      for (const element of io.where.sql.elements) {
        if (element instanceof dd.InputParam) {
          const input = element as dd.InputParam;
        }
      }
    }
    code += `func (da *${daType}) ${actionName}()`;
    return code;
  }

  private getMemberName(prefix: string, viewName: string) {
    const name = prefix + viewName;
    return name;
  }
}
