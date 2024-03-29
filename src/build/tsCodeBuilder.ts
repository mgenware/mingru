import mustBeErr from 'must-be-err';
import { GoStructData } from './goCodeUtil.js';
import { getAtomicTypeInfo, TypeInfo, CompoundTypeInfo } from '../lib/varInfo.js';
import * as su from '../lib/stringUtils.js';

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
    case 'int64':
    case 'uint64':
    case 'int32':
    case 'uint32':
    case 'int16':
    case 'uint16':
    case 'int8':
    case 'uint8':
    case 'double':
    case 'byte':
    case 'rune':
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
      code += `  ${su.toCamelCase(mem.name)}?: ${tsType.type};\n`;
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
