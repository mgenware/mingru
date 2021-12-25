/* eslint-disable @typescript-eslint/no-use-before-define */
import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import { toCamelCase, toPascalCase } from './stringUtils.js';

export class AtomicTypeInfo {
  moduleName = '';
  importPath?: string;
  fullTypeName: string;
  defaultValueString: string;

  constructor(
    public typeName: string,
    public defaultValue: unknown,
    // Format: <module name>|<import path>
    typePath: string | null,
  ) {
    if (typePath) {
      const parts = typePath.split('|');
      if (parts.length === 2) {
        this.moduleName = parts[0] ?? '';
        this.importPath = parts[1];
      } else {
        this.moduleName = parts[0] ?? '';
        this.importPath = parts[0];
      }
    }
    this.fullTypeName = this.getFullTypeName();
    this.defaultValueString = `${this.defaultValue}`;
  }

  toString(): string {
    // `this.moduleName` is already included in `this.typeString`.
    let s = this.fullTypeName;
    if (this.importPath) {
      s += `|${this.importPath}`;
    }
    return s;
  }

  private getFullTypeName(): string {
    const { typeName } = this;
    if (this.moduleName) {
      return `${this.moduleName}.${typeName}`;
    }
    return typeName;
  }
}

export class CompoundTypeInfo {
  fullTypeName: string;
  defaultValueString: string;

  constructor(public core: AtomicTypeInfo, public isPointer: boolean, public isArray: boolean) {
    this.fullTypeName = this.getFullTypeName(false);
    this.defaultValueString = this.isPointer || this.isArray ? 'nil' : this.core.defaultValueString;
    Object.freeze(this);
  }

  toString(): string {
    return this.getFullTypeName(true);
  }

  // `verbose` is used in `toString` for debugging purposes.
  private getFullTypeName(verbose: boolean): string {
    let s = verbose ? this.core.toString() : this.core.fullTypeName;
    if (this.isPointer) {
      s = `*${s}`;
    }
    if (this.isArray) {
      s = `[]${s}`;
    }
    return s;
  }
}

export type TypeInfo = AtomicTypeInfo | CompoundTypeInfo;

export function getAtomicTypeInfo(typeInfo: TypeInfo): AtomicTypeInfo {
  if (typeInfo instanceof CompoundTypeInfo) {
    return typeInfo.core;
  }
  return typeInfo;
}

export function typeInfoToArray(typeInfo: TypeInfo): CompoundTypeInfo {
  if (typeInfo instanceof CompoundTypeInfo) {
    return new CompoundTypeInfo(typeInfo.core, typeInfo.isPointer, true);
  }
  return new CompoundTypeInfo(typeInfo, false, true);
}

export function typeInfoWithoutArray(typeInfo: TypeInfo): TypeInfo {
  if (typeInfo instanceof CompoundTypeInfo) {
    return new CompoundTypeInfo(typeInfo.core, typeInfo.isPointer, false);
  }
  return typeInfo;
}

export function typeInfoToPointer(typeInfo: TypeInfo): CompoundTypeInfo {
  if (typeInfo instanceof CompoundTypeInfo) {
    return new CompoundTypeInfo(typeInfo.core, true, typeInfo.isArray);
  }
  return new CompoundTypeInfo(typeInfo, true, false);
}

export function typeInfoWithoutPointer(typeInfo: TypeInfo): TypeInfo {
  if (typeInfo instanceof CompoundTypeInfo) {
    return new CompoundTypeInfo(typeInfo.core, false, typeInfo.isArray);
  }
  return typeInfo;
}

export type VarValue = string | mm.ValueRef | mm.Table | number;

export class VarInfo {
  static withValue(v: VarInfo, value: VarValue): VarInfo {
    throwIfFalsy(v, 'v');
    return new VarInfo(v.name, v.type, value);
  }

  readonly pascalName: string;

  constructor(public name: string, public type: TypeInfo, public value?: VarValue) {
    this.pascalName = toPascalCase(name);
    Object.freeze(this);
  }

  camelCaseName(): string {
    return toCamelCase(this.name);
  }

  pascalCaseName(): string {
    return toPascalCase(this.name);
  }

  valueOrName(nameCase: 'camelCase' | 'pascalCase' | 'original'): string {
    const { value } = this;
    if (value !== undefined) {
      if (typeof value === 'string') {
        return value;
      }
      if (typeof value === 'number') {
        return value.toString();
      }
      if (value instanceof mm.ValueRef) {
        return value.path;
      }
      return JSON.stringify(value.__getDBName());
    }
    switch (nameCase) {
      case 'camelCase':
        return this.camelCaseName();
      case 'pascalCase':
        return this.pascalCaseName();
      default:
        return this.name;
    }
  }

  get hasValueRef(): boolean {
    return this.value instanceof mm.ValueRef;
  }

  toString(): string {
    let s = `${this.name}: ${this.type.toString()}`;
    if (this.value !== undefined) {
      s += `=${this.value}`;
    }
    return s;
  }
}

export default VarInfo;
