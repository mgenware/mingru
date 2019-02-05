import * as dd from 'dd-models';

export class InstanceVariable {
  name: string;

  constructor(name: string, public type: string) {
    this.name = dd.utils.capitalizeColumnName(dd.utils.toCamelCase(name));
  }
}

export function struct(typeName: string, members: InstanceVariable[]): string {
  let code = `// ${typeName} ...
type ${typeName} struct {
`;
  // Find the max length of var names
  const max = Math.max(...members.map(m => m.name.length));
  for (const mem of members) {
    code += `\t${mem.name.padEnd(max)} ${mem.type}
`;
  }
  code += `}

`;
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

export function makeArray(name: string, type: string, size?: number): string {
  size = size || 0;
  return `${name} := make([]${type}, ${size})`;
}

function formatImports(imports: string[]): string {
  if (!imports || !imports.length) {
    return '';
  }
  return imports
    .sort()
    .map(s => `\t${s}\n`)
    .join('');
}

export function makeImports(system: string[], user: string[]): string {
  const sysCode = formatImports(system);
  const userCode = formatImports(user);
  let code = sysCode;
  if (sysCode && userCode) {
    code += '\n';
  }
  code += userCode;

  return `import (
${code})

`;
}

export function makeStringLiteral(s: string): string {
  return JSON.stringify(s);
}
