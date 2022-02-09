import * as mm from 'mingru-models';
import { FuncSignature, GoStructData } from './goCodeUtil.js';

// Carries shared information during building. Used in `CoreBuilder`.
export default class CoreBuilderContext {
  // Shared interfaces.
  interfaces: Record<string, Map<string, FuncSignature>> = {};
  // Shared result types.
  resultTypes: Record<string, GoStructData> = {};
  // Tracks if a result type should have TypeScript definition generated.
  tsResultTypes = new Set<string>();

  // Actions that have been built.
  actions = new Set<mm.TableActions>();
  // Tables that have been built.
  tables = new Set<mm.Table>();

  addSharedInterface(name: string, funcSig: FuncSignature) {
    const { interfaces } = this;
    if (interfaces[name] === undefined) {
      interfaces[name] = new Map<string, FuncSignature>();
    }
    interfaces[name]?.set(funcSig.sig, funcSig);
  }

  addSharedResultType(name: string, structData: GoStructData, ts: boolean) {
    const { resultTypes } = this;
    const prev = resultTypes[name];
    resultTypes[name] = prev ? prev.merge(structData) : structData;
    if (ts) {
      this.tsResultTypes.add(name);
    }
  }
}
