/* eslint-disable @typescript-eslint/no-use-before-define */
import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';

export class AtomicTypeInfo {
  moduleName = '';
  importPath?: string;
  typeString: string;
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
        [this.moduleName, this.importPath] = parts;
      } else {
        [this.moduleName] = parts;
        [this.importPath] = parts;
      }
    }
    this.typeString = this.getTypeString();
    this.defaultValueString = `${this.defaultValue}`;
  }

  toString(): string {
    // `this.moduleName` is already included in `this.typeString`.
    let s = this.typeString;
    if (this.importPath) {
      s += `|${this.importPath}`;
    }
    return s;
  }

  private getTypeString(): string {
    const { typeName } = this;
    if (this.moduleName) {
      return `${this.moduleName}.${typeName}`;
    }
    return typeName;
  }
}

export class CompoundTypeInfo {
  typeString: string;
  defaultValueString: string;

  constructor(public core: AtomicTypeInfo, public isPointer: boolean, public isArray: boolean) {
    this.typeString = this.getTypeString(false);
    this.defaultValueString = this.isPointer || this.isArray ? 'nil' : this.core.defaultValueString;
    Object.freeze(this);
  }

  toString(): string {
    return this.getTypeString(true);
  }

  // `verbose` is used in `toString` for debugging purposes.
  private getTypeString(verbose: boolean): string {
    let s = verbose ? this.core.toString() : this.core.typeString;
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

export function typeInfoToPointer(typeInfo: TypeInfo): CompoundTypeInfo {
  if (typeInfo instanceof CompoundTypeInfo) {
    return new CompoundTypeInfo(typeInfo.core, true, typeInfo.isArray);
  }
  return new CompoundTypeInfo(typeInfo, true, false);
}

export type VarValue = string | mm.ValueRef | mm.Table | number;

export class VarInfo {
  static withValue(v: VarInfo, value: VarValue): VarInfo {
    throwIfFalsy(v, 'v');
    return new VarInfo(v.name, v.type, value);
  }

  constructor(public name: string, public type: TypeInfo, public value?: VarValue) {
    Object.freeze(this);
  }

  get valueOrName(): string {
    const { value } = this;
    if (value) {
      if (typeof value === 'string') {
        return value;
      }
      if (typeof value === 'number') {
        return value.toString();
      }
      if (value instanceof mm.ValueRef) {
        return value.path;
      }
      return JSON.stringify(value.getDBName());
    }
    return this.name;
  }

  get hasValueRef(): boolean {
    return this.value instanceof mm.ValueRef;
  }

  toString(): string {
    let s = `${this.name}: ${this.type.toString()}`;
    if (this.value) {
      s += `=${this.value}`;
    }
    return s;
  }
}

export default VarInfo;
