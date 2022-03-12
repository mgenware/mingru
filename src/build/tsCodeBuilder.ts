import mustBeErr from 'must-be-err';
import { GoStructData } from './goCodeUtil.js';
import { getAtomicTypeInfo, TypeInfo, CompoundTypeInfo } from '../lib/varInfo.js';

function goTypeToTSType(type: TypeInfo): { type: string; optional: boolean } {
  const typeString = getAtomicTypeInfo(type).fullTypeName;
  const isArray = type instanceof CompoundTypeInfo && type.isArray;
  const optional = type instanceof CompoundTypeInfo && type.isPointer;

  let tsTypeString;
  switch (typeString) {
    case 'bool':
      tsTypeString = 'boolean';
      break;
    case 'int':
    case 'uint':
    case 'uint64':
    case 'double':
      tsTypeString = 'number';
      break;
    case 'string':
    case 'time.Time':
      tsTypeString = 'string';
      break;
    default:
      throw new Error(`Unsupported Go type "${type}"`);
  }

  if (isArray) {
    return { type: `${tsTypeString}[]`, optional };
  }
  return { type: tsTypeString, optional };
}

export function buildTSInterface(structData: GoStructData, typeName?: string) {
  let code = `export interface ${typeName || structData.typeName} {\n`;
  for (const mem of structData.members) {
    if (structData.ignoredMembers.has(mem.name)) {
      continue;
    }
    try {
      const tsType = goTypeToTSType(mem.type);
      code += `  ${mem.name}?: ${tsType.type};\n`;
    } catch (err) {
      mustBeErr(err);
      throw new Error(
        `Error generating TS property ${mem.name} in ${structData.typeName}, ${err.message}`,
      );
    }
  }
  code += '}\n';
  return code;
}
