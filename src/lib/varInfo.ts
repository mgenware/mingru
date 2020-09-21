/* eslint-disable @typescript-eslint/no-use-before-define */
import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';

export class AtomicTypeInfo {
  moduleName = '';
  importPath?: string;
  typeString: string;

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
  }

  toPointer(): CompoundTypeInfo {
    return new CompoundTypeInfo(this, true, false);
  }

  toArray(): CompoundTypeInfo {
    return new CompoundTypeInfo(this, false, true);
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

  constructor(
    public core: AtomicTypeInfo,
    public isPointer: boolean,
    public isArray: boolean,
  ) {
    this.typeString = this.getTypeString(false);
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

export class VarInfo {
  static withValue(v: VarInfo, value: string | mm.ValueRef): VarInfo {
    throwIfFalsy(v, 'v');
    return new VarInfo(v.name, v.type, value);
  }

  constructor(
    public name: string,
    public type: TypeInfo,
    public value?: string | mm.ValueRef,
  ) {
    Object.freeze(this);
  }

  get valueOrName(): string {
    const { value } = this;
    if (value) {
      return value instanceof mm.ValueRef ? value.path : value;
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
