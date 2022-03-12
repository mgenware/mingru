/* eslint-disable @typescript-eslint/no-use-before-define */
import * as mm from 'mingru-models';

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

export interface VarDef {
  name: string;
  type: TypeInfo;
}

export function formatVarDef(varDef: VarDef) {
  return `${varDef.name}: ${varDef.type}`;
}

export type ValueType = string | mm.CapturedVar | mm.Table;
