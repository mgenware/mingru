import { FuncSignature, StructInfo } from './goCode';

export default class GoBuilderContext {
  interfaces: { [name: string]: Map<string, FuncSignature> } = {};
  resultTypes: { [name: string]: StructInfo } = {};

  handleInterfaceMember(name: string, funcSig: FuncSignature) {
    if (!this.interfaces[name]) {
      this.interfaces[name] = new Map<string, FuncSignature>();
    }
    this.interfaces[name].set(funcSig.sig, funcSig);
  }

  handleResultType(name: string, info: StructInfo) {
    this.resultTypes[name] = info;
  }
}
