import { capitalizeFirstLetter } from '../lib/stringUtil';

export class InstanceVariable {
  name: string;

  constructor(
    name: string,
    public type: string,
  ) {
    if (name === 'id') {
      this.name = 'ID';
    } else {
      this.name = capitalizeFirstLetter(name);
    }
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
  return `/************ ${s} ************/
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
