import { SelectIO } from '../io/select';
import { capitalizeFirstLetter } from '../lib/stringUtil';
import Dialect from '../dialect';

const INDENT = '\t';
const NEWLINE = '\n';

export default class GoBuilder {
  memberNames: Set<string> = new Set<string>();

  constructor(
    public dialect: Dialect,
  ) { }

  private select(io: SelectIO) {
    const { dialect } = this;
    const actionName = capitalizeFirstLetter(io.action.name);
    const funcName = this.getMemberName('Select', actionName);
    this.checkMemberName(funcName);
    const clsName = funcName + 'Result';
    this.checkMemberName(clsName);

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
  }

  private getMemberName(prefix: string, viewName: string) {
    const name = prefix + viewName;
    return name;
  }

  private checkMemberName(name: string) {
    if (this.memberNames.has(name)) {
      throw new Error(`The member name "${name}" already exists`);
    }
    this.memberNames.add(name);
  }
}
