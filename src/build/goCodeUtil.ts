import * as mm from 'mingru-models';
import { JSONKeyStyle } from './buildOptions.js';
import { VarInfo, getAtomicTypeInfo } from '../lib/varInfo.js';
import { StringSegment } from '../dialect.js';
import CodeStringBuilder from '../lib/codeStringBuilder.js';
import * as stringUtils from '../lib/stringUtils.js';
import LinesBuilder from './linesBuilder.js';
import { tableInstanceName } from '../def/lib.js';

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

export class GoStructData {
  members: VarInfo[];
  ignoredMembers: Set<string>;
  omitEmptyMembers: Set<string>;

  constructor(
    public typeName: string,
    // Members will be re-sorted.
    members: Iterable<VarInfo>,
    public jsonKeyStyle: JSONKeyStyle | null,
    // Key: variable name.
    ignoredMembers: Set<string> | null,
    // Key: variable name.
    omitEmptyMembers: Set<string> | null,
  ) {
    this.members = [...members].sort((a, b) => a.name.localeCompare(b.name));
    this.ignoredMembers = ignoredMembers ?? new Set();
    this.omitEmptyMembers = omitEmptyMembers ?? new Set();
  }

  merge(oth: GoStructData): GoStructData {
    // Do a shallow copy of current members.
    const members = new Map<string, VarInfo>();
    for (const mem of this.members) {
      members.set(mem.name, mem);
    }
    // Merge two member arrays.
    for (const v of oth.members) {
      if (!members.has(v.name)) {
        members.set(v.name, v);
      }
    }
    const ignoredMembers = new Set<string>(this.ignoredMembers);
    for (const name of oth.ignoredMembers) {
      ignoredMembers.add(name);
    }
    const omitEmptyMembers = new Set<string>(this.omitEmptyMembers);
    for (const name of oth.omitEmptyMembers) {
      omitEmptyMembers.add(name);
    }
    return new GoStructData(
      this.typeName,
      members.values(),
      this.jsonKeyStyle,
      ignoredMembers,
      omitEmptyMembers,
    );
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

export function struct(data: GoStructData): string {
  let code = `// ${data.typeName} ...
type ${data.typeName} struct {
`;
  // Use 3 string arrays to store each column (name|type|tag) in order to
  // properly handle indentation.
  const nameColumns: string[] = [];
  const typeColumns: string[] = [];
  const tagColumns: string[] = [];
  for (const mem of data.members) {
    const memName = mem.pascalName;
    const memType = mem.type.fullTypeName;
    let tag = '';
    nameColumns.push(memName);
    typeColumns.push(memType);

    const omitEmpty = data.omitEmptyMembers.has(memName) || false;
    if (data.ignoredMembers.has(memName)) {
      tag = MemberTagUtil.getIgnoreJSONTag();
    } else if (data.jsonKeyStyle === JSONKeyStyle.camelCase) {
      tag = MemberTagUtil.getCamelCaseJSONTag(memName, omitEmpty);
    } else if (data.jsonKeyStyle === JSONKeyStyle.snakeCase) {
      tag = MemberTagUtil.getSnakeCaseJSONTag(memName, omitEmpty);
    }
    tagColumns.push(tag);
  }

  const maxNameLen = Math.max(...nameColumns.map((s) => s.length));
  const maxTypeLen = Math.max(...typeColumns.map((s) => s.length));
  for (let i = 0; i < nameColumns.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const name = nameColumns[i]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const type = typeColumns[i]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tag = tagColumns[i]!;

    code += `\t${name.padEnd(maxNameLen)} ${tag ? type.padEnd(maxTypeLen) : type}`;
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
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!size && !capacity) {
    return `var ${name} []${type}`;
  }
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

  addVars(vars: Iterable<VarInfo>) {
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

export function buildEnum(builder: LinesBuilder, values: string[]) {
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

export enum VarInfoNameCase {
  none,
  camelCase,
  pascalCase,
}

export function transformVarInfo(v: VarInfo, nameCase: VarInfoNameCase): string {
  const { value } = v;
  if (value !== undefined) {
    if (value instanceof mm.ValueRef) {
      return value.path;
    }
    if (value instanceof mm.Table) {
      return tableInstanceName(value.__getData().name);
    }
    return value;
  }
  switch (nameCase) {
    case VarInfoNameCase.camelCase:
      return v.camelCaseName();
    case VarInfoNameCase.pascalCase:
      return v.pascalCaseName();
    default:
      return v.name;
  }
}
