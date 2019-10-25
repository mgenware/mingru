import * as mm from 'mingru-models';
import { MemberJSONKeyStyle } from './buildOption';

export class InstanceVariable {
  name: string;
  tag = '';

  constructor(name: string, public type: string) {
    this.name = mm.utils.capitalizeColumnName(mm.utils.toCamelCase(name));
  }

  makeSnakeCaseJSONTag() {
    this.setJSONTag(mm.utils.toSnakeCase(this.name));
  }

  makeCamelCaseJSONTag() {
    this.setJSONTag(mm.utils.toCamelCase(this.name));
  }

  private setJSONTag(name: string) {
    this.tag = '`json:"' + name + '"`';
  }
}

export function struct(
  typeName: string,
  members: InstanceVariable[],
  nameStyle: MemberJSONKeyStyle,
): string {
  let code = `// ${typeName} ...
type ${typeName} struct {
`;
  // Find the max length of var names
  const max = Math.max(...members.map(m => m.name.length));
  for (const mem of members) {
    code += `\t${mem.name.padEnd(max)} ${mem.type}`;
    if (nameStyle === MemberJSONKeyStyle.camelCase) {
      mem.makeCamelCaseJSONTag();
    } else if (nameStyle === MemberJSONKeyStyle.snakeCase) {
      mem.makeSnakeCaseJSONTag();
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
