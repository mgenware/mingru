import { FuncSignature, MutableStructInfo } from './goCode.js';

export default class GoBuilderContext {
  interfaces: Record<string, Map<string, FuncSignature>> = {};
  resultTypes: Record<string, MutableStructInfo> = {};

  handleInterfaceMember(name: string, funcSig: FuncSignature) {
    const { interfaces } = this;
    if (interfaces[name] === undefined) {
      interfaces[name] = new Map<string, FuncSignature>();
    }
    interfaces[name]?.set(funcSig.sig, funcSig);
  }

  handleResultType(name: string, info: MutableStructInfo) {
    const { resultTypes } = this;
    if (resultTypes[name] !== undefined) {
      resultTypes[name]?.merge(info);
    } else {
      resultTypes[name] = info;
    }
  }
}
