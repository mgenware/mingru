import * as mm from 'mingru-models';
import { throwIfFalsy } from 'throw-if-arg-empty';

export class TypeInfo {
  static type(typeName: string, namespace?: string): TypeInfo {
    return new TypeInfo(typeName, namespace, false, false);
  }

  static compoundType(
    type: TypeInfo,
    isPointer: boolean,
    isArray: boolean,
  ): TypeInfo {
    return new TypeInfo(type, undefined, isPointer, isArray);
  }

  typeString: string;
  sourceTypeString: string;
  moduleName = '';
  importPath?: string;

  private constructor(
    public type: string | TypeInfo,
    // [namespace]|import path
    pathInfo: string | undefined,
    public isPointer: boolean,
    public isArray: boolean,
  ) {
    if (typeof type === 'string') {
      if (pathInfo) {
        const parts = pathInfo.split('|');
        if (parts.length === 2) {
          [this.moduleName, this.importPath] = parts;
        } else {
          [this.moduleName] = parts;
          [this.importPath] = parts;
        }
      }
    } else {
      this.moduleName = type.moduleName;
      this.importPath = type.importPath;
    }
    // `sourceTypeString` and`getTypeString` should be called at last
    // cuz they depend on other properties like `namespace`.
    this.sourceTypeString = this.getSourceTypeString();
    this.typeString = this.getTypeString();
    Object.freeze(this);
  }

  toPointer(): TypeInfo {
    return TypeInfo.compoundType(this, true, false);
  }

  toArray(): TypeInfo {
    return TypeInfo.compoundType(this, false, true);
  }

  toString(): string {
    // `this.namespace` is already included in `this.typeString`.
    let s = this.typeString;
    if (this.importPath) {
      s += `|${this.importPath}`;
    }
    return s;
  }

  private getTypeString() {
    const { type, sourceTypeString } = this;
    if (typeof type === 'string') {
      return sourceTypeString;
    }
    let s = `${sourceTypeString}`;
    if (this.isPointer) {
      s = `*${s}`;
    }
    if (this.isArray) {
      s = `[]${s}`;
    }
    return s;
  }

  private getSourceTypeString() {
    const { type } = this;
    if (typeof type === 'string') {
      if (this.moduleName) {
        return `${this.moduleName}.${type}`;
      }
      return type;
    }
    return type.sourceTypeString;
  }
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
