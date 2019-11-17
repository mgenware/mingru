import * as mm from 'mingru-models';
import { MemberJSONKeyStyle } from './buildOption';
import VarInfo from '../lib/varInfo';

export class FuncSignature {
  constructor(
    public name: string,
    public sig: string,
    public params: VarInfo[],
    public returnType: VarInfo[],
  ) {}
}

export class MemberTagUtil {
  static getSnakeCaseJSONTag(name: string) {
    return this.getJSONTag(mm.utils.toSnakeCase(name));
  }

  static getCamelCaseJSONTag(name: string): string {
    return this.getJSONTag(mm.utils.toCamelCase(name));
  }

  static getIgnoreJSONTag(): string {
    return this.getJSONTag('-');
  }

  private static getJSONTag(name: string): string {
    return '`json:"' + name + '"`';
  }
}

export class StructInfo {
  constructor(
    public typeName: string,
    public members: VarInfo[],
    public nameStyle: MemberJSONKeyStyle,
    public ignored: Set<VarInfo> | null,
  ) {}
}

export function interfaceType(typeName: string, members: string[]): string {
  let code = `// ${typeName} ...
type ${typeName} interface {
`;
  for (const mem of members) {
    code += `\t${mem}\n`;
  }
  code += `}\n`;
  return code;
}

export function struct(
  typeName: string,
  members: VarInfo[],
  nameStyle: MemberJSONKeyStyle,
  ignored: Set<VarInfo> | null,
): string {
  let code = `// ${typeName} ...
type ${typeName} struct {
`;
  // Find the max length of var names
  const nameMaxLen = Math.max(...members.map(m => m.name.length));
  let typeMaxLen = 0;
  if (nameStyle !== MemberJSONKeyStyle.none) {
    typeMaxLen = Math.max(...members.map(m => m.type.typeString.length));
  }
  for (const mem of members) {
    let tag: string | null = null;
    code += `\t${mem.name.padEnd(nameMaxLen)} ${mem.type.typeString.padEnd(
      typeMaxLen,
    )}`;
    if (ignored && ignored.has(mem)) {
      tag = MemberTagUtil.getIgnoreJSONTag();
    } else if (nameStyle === MemberJSONKeyStyle.camelCase) {
      tag = MemberTagUtil.getCamelCaseJSONTag(mem.name);
    } else if (nameStyle === MemberJSONKeyStyle.snakeCase) {
      tag = MemberTagUtil.getSnakeCaseJSONTag(mem.name);
    }
    if (tag) {
      code += ` ${tag}`;
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
