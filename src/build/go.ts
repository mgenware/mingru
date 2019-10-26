import * as mm from 'mingru-models';
import { MemberJSONKeyStyle } from './buildOption';

export class InstanceVariable {
  name: string;
  tag = '';

  constructor(name: string, public type: string) {
    this.name = mm.utils.capitalizeColumnName(mm.utils.toCamelCase(name));
  }

  setSnakeCaseJSONTag() {
    this.setJSONTag(mm.utils.toSnakeCase(this.name));
  }

  setCamelCaseJSONTag() {
    this.setJSONTag(mm.utils.toCamelCase(this.name));
  }

  setIgnoreJSONTag() {
    this.setJSONTag('-');
  }

  private setJSONTag(name: string) {
    this.tag = '`json:"' + name + '"`';
  }
}

export function struct(
  typeName: string,
  members: InstanceVariable[],
  nameStyle: MemberJSONKeyStyle,
  ignored: Set<InstanceVariable> | null,
): string {
  let code = `// ${typeName} ...
type ${typeName} struct {
`;
  // Find the max length of var names
  const nameMaxLen = Math.max(...members.map(m => m.name.length));
  let typeMaxLen = 0;
  if (nameStyle !== MemberJSONKeyStyle.none) {
    typeMaxLen = Math.max(...members.map(m => m.type.length));
  }
  for (const mem of members) {
    code += `\t${mem.name.padEnd(nameMaxLen)} ${mem.type.padEnd(typeMaxLen)}`;
    if (ignored && ignored.has(mem)) {
      mem.setIgnoreJSONTag();
    } else if (nameStyle === MemberJSONKeyStyle.camelCase) {
      mem.setCamelCaseJSONTag();
    } else if (nameStyle === MemberJSONKeyStyle.snakeCase) {
      mem.setSnakeCaseJSONTag();
    }
    if (mem.tag) {
      code += ` ${mem.tag}`;
    }
    code += '\n';
  }
  code += `}\n`;
  return code;
}

export function sep(s: string): string {
  return `// ------------ ${s} ------------
`;
}

export function newPointer(typeName: string): string {
  return `&${typeName}{}`;
}

export function pointerVar(name: string, typeName: string): string {
  return `${name} := ${newPointer(typeName)}`;
}

export function makeArray(
  name: string,
  type: string,
  size?: number | string,
  capacity?: number | string,
): string {
  size = size || 0;
  const capacityParam = capacity ? `, ${capacity}` : '';
  return `${name} := make([]${type}, ${size}${capacityParam})`;
}

function joinImports(imports: string[]): string {
  return imports
    .sort()
    .map(s => `\t"${s}"\n`)
    .join('');
}

function formatImports(imports: string[]): string {
  if (!imports || !imports.length) {
    return '';
  }

  // Split the imports into system and user imports
  const sysImports: string[] = [];
  const usrImports: string[] = [];
  for (const s of imports) {
    if (s.includes('.')) {
      usrImports.push(s);
    } else {
      sysImports.push(s);
    }
  }

  const sysStr = joinImports(sysImports);
  const usrStr = joinImports(usrImports);
  // Add an empty line between system imports and user imports
  const hasSep = sysStr && usrStr;
  return `${sysStr}${hasSep ? '\n' : ''}${usrStr}`;
}

export function makeImports(imports: string[]): string {
  const code = formatImports(imports);
  return `import (
${code})

`;
}

export function makeStringLiteral(s: string): string {
  return JSON.stringify(s);
}
