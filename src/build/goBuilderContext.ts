import { FuncSignature, GoStructData } from './goCodeUtil.js';

// Carries shared information during building.
export default class GoBuilderContext {
  // Shared interfaces.
  interfaces: Record<string, Map<string, FuncSignature>> = {};
  // Shared result types.
  resultTypes: Record<string, GoStructData> = {};

  addSharedInterface(name: string, funcSig: FuncSignature) {
    const { interfaces } = this;
    if (interfaces[name] === undefined) {
      interfaces[name] = new Map<string, FuncSignature>();
    }
    interfaces[name]?.set(funcSig.sig, funcSig);
  }

  addSharedResultType(name: string, info: GoStructData) {
    const { resultTypes } = this;
    const prev = resultTypes[name];
    resultTypes[name] = prev ? prev.merge(info) : info;
  }
}
