import { JSONEncodingStyle } from './buildOptions';
import { VarInfo, getAtomicTypeInfo } from '../lib/varInfo';
import { StringSegment } from '../dialect';
import CodeStringBuilder from '../lib/codeStringBuilder';
import * as stringUtils from '../lib/stringUtils';
import LinesBuilder from './linesBuilder';

export class FuncSignature {
  constructor(
    public name: string,
    public sig: string,
    public params: VarInfo[],
    public returnType: VarInfo[],
  ) {}
}

export class MemberTagUtil {
  static getSnakeCaseJSONTag(name: string, omitEmpty: boolean) {
    return this.getJSONTag(stringUtils.toSnakeCase(name), omitEmpty);
  }

  static getCamelCaseJSONTag(name: string, omitEmpty: boolean): string {
    return this.getJSONTag(stringUtils.toCamelCase(name), omitEmpty);
  }

  static getIgnoreJSONTag(): string {
    return this.getJSONTag('-', false);
  }

  private static getJSONTag(name: string, omitEmpty: boolean): string {
    return `\`json:"${name}${omitEmpty ? ',omitempty' : ''}"\``;
  }
}

export class MutableStructInfo {
  constructor(
    public typeName: string,
    // K: Name of `VarInfo`.
    public members: Map<string, VarInfo>,
    public nameStyle: JSONEncodingStyle,
    // K: Name of `VarInfo`.
    public ignoredMembers: Set<string>,
    // K: Name of `VarInfo`.
    public omitEmptyMembers: Set<string>,
  ) {}

  merge(oth: MutableStructInfo) {
    for (const v of oth.members.values()) {
      if (!this.members.has(v.name)) {
        this.members.set(v.name, v);
      }
    }
    for (const name of oth.ignoredMembers) {
      this.ignoredMembers.add(name);
    }
    for (const name of oth.omitEmptyMembers) {
      this.omitEmptyMembers.add(name);
    }
  }
}

export function interfaceType(typeName: string, members: string[]): string {
  let code = `// ${typeName} ...
type ${typeName} interface {
`;
  for (const mem of members) {
    code += `\t${mem}\n`;
  }
  code += '}\n';
  return code;
}

export function struct(
  typeName: string,
  members: Map<string, VarInfo>,
  nameStyle: JSONEncodingStyle,
  ignoredMembers: Set<string>,
  omitEmptyMembers: Set<string>,
): string {
  // Sort members alphabetically.
  const values = [...members.values()].sort((a, b) => a.name.localeCompare(b.name));
  let code = `// ${typeName} ...
type ${typeName} struct {
`;
  // Find the max length of all field names.
  const nameMaxLen = Math.max(...values.map((m) => m.name.length));
  let typeMaxLen = 0;
  if (nameStyle !== JSONEncodingStyle.none) {
    typeMaxLen = Math.max(...values.map((m) => m.type.typeString.length));
  }
  for (const mem of values) {
    const memName = mem.name;
    let tag: string | null = null;
    code += `\t${memName.padEnd(nameMaxLen)} ${mem.type.typeString.padEnd(typeMaxLen)}`;
    const omitEmpty = omitEmptyMembers.has(memName) || false;
    if (ignoredMembers.has(memName)) {
      tag = MemberTagUtil.getIgnoreJSONTag();
    } else if (nameStyle === JSONEncodingStyle.camelCase) {
      tag = MemberTagUtil.getCamelCaseJSONTag(memName, omitEmpty);
    } else if (nameStyle === JSONEncodingStyle.snakeCase) {
      tag = MemberTagUtil.getSnakeCaseJSONTag(memName, omitEmpty);
    }
    if (tag) {
      code += ` ${tag}`;
    }
    code += '\n';
  }
  code += '}\n';
  return code;
}

export function sep(s: string): string {
  return `// ------------ ${s} ------------
`;
}

export function newStructPointer(typeName: string): string {
  return `&${typeName}{}`;
}

export function newStructPointerVar(name: string, typeName: string): string {
  return `${name} := ${newStructPointer(typeName)}`;
}

export function makeArray(
  name: string,
  type: string,
  size?: number | string,
  capacity?: number | string,
): string {
  // eslint-disable-next-line no-param-reassign
  size = size ?? 0;
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const capacityParam = capacity ? `, ${capacity}` : '';
  return `${name} := make([]${type}, ${size}${capacityParam})`;
}

function joinImports(imports: string[], newline: boolean): string {
  if (!imports.length) {
    return '';
  }
  if (!newline) {
    return `"${imports[0]}"`;
  }
  return imports
    .sort()
    .map((s) => `\t"${s}"\n`)
    .join('');
}

function formatImports(imports: string[]): string {
  if (!imports.length) {
    return '';
  }

  const newlines = imports.length > 1;
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

  const sysStr = joinImports(sysImports, newlines);
  const usrStr = joinImports(usrImports, newlines);
  // Add an empty line between system imports and user imports
  const hasSep = sysStr && usrStr;
  return `${sysStr}${hasSep ? '\n' : ''}${usrStr}`;
}

export function makeImports(imports: string[]): string {
  const code = formatImports(imports);
  if (!code) {
    return '';
  }
  if (imports.length === 1) {
    return `import ${code}\n\n`;
  }
  return `import (
${code})\n\n`;
}

export function makeStringLiteral(s: string): string {
  return JSON.stringify(s);
}

export function makeStringFromSegments(list: StringSegment[]): string {
  const builder = new CodeStringBuilder();
  for (const segment of list) {
    if (typeof segment === 'string') {
      builder.addString(segment);
    } else {
      builder.addCode(segment.code);
    }
  }
  return builder.finish();
}

export function extractStringContentFromSegments(list: StringSegment[]): string {
  let res = '';
  for (const segment of list) {
    if (typeof segment === 'object') {
      throw new Error(`Unexpected code segment: "${JSON.stringify(segment)}"`);
    }
    res += segment;
  }
  return res;
}

export class ImportList {
  private imports = new Set<string>();

  addVars(vars: VarInfo[]) {
    for (const info of vars) {
      const atomicInfo = getAtomicTypeInfo(info.type);
      if (atomicInfo.importPath) {
        this.imports.add(atomicInfo.importPath);
      }
    }
  }

  add(value: string) {
    if (value) {
      this.imports.add(value);
    }
  }

  code(): string {
    return makeImports([...this.imports]);
  }
}

export function buildSwitch(
  builder: LinesBuilder,
  condition: string,
  cases: Record<string, string>,
  defaultCode: string[],
) {
  builder.push(`switch ${condition} {`);
  for (const [key, val] of Object.entries(cases)) {
    builder.push(`case ${key}:`);
    builder.increaseIndent();
    builder.push(val);
    builder.decreaseIndent();
  }
  builder.push('default:');
  builder.increaseIndent();
  for (const line of defaultCode) {
    builder.push(line);
  }
  builder.decreaseIndent();
  builder.push('}');
}

export function buildEnum(builder: LinesBuilder, name: string, values: string[]) {
  builder.push(`// ${name} ...`);
  builder.push('const (');
  builder.increaseIndent();
  let isFirst = true;
  for (const val of values) {
    builder.push(val + (isFirst ? ' = iota' : ''));
    if (isFirst) {
      isFirst = false;
    }
  }
  builder.decreaseIndent();
  builder.push(')');
}

export function appendWithSeparator(code: string, append: string): string {
  if (!code) {
    return append;
  }
  return `${code}\n${append}`;
}
