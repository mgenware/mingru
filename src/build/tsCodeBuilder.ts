import { GoStructData } from './goCodeUtil.js';
import { getAtomicTypeInfo } from '../lib/varInfo.js';

function goTypeToTSType(type: string): string {
  switch (type) {
    case 'bool':
      return 'boolean';
    case 'int':
    case 'uint':
    case 'uint64':
    case 'double':
      return 'number';
    case 'string':
      return 'string';
    default:
      throw new Error(`Unsupported Go type "${type}"`);
  }
}

export function buildTSInterface(structData: GoStructData, typeName?: string) {
  let code = `export interface ${typeName || structData.typeName} {\n`;
  for (const mem of structData.members) {
    if (structData.ignoredMembers.has(mem.name)) {
      continue;
    }
    const tsType = goTypeToTSType(getAtomicTypeInfo(mem.type).fullTypeName);
    code += `  ${mem.camelCaseName()}?: ${tsType};\n`;
  }
  code += '}\n';
  return code;
}
