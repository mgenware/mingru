import * as mm from 'mingru-models';
import { FuncSignature, GoStructData } from './goCodeUtil.js';

// Carries shared information during building. Used in `CoreBuilder`.
export default class CoreBuilderContext {
  // Shared interfaces.
  #interfaces: Record<string, Map<string, FuncSignature>> = {};
  // Shared result types.
  #resultTypes: Record<string, GoStructData> = {};
  // Tracks if a result type should have TypeScript definition generated.
  #tsResultTypes = new Set<string>();

  // Actions that have been built.
  #actions = new Set<mm.TableActions>();
  // Tables that have been built.
  #tables = new Set<mm.Table>();

  get interfaces(): Readonly<Record<string, Map<string, FuncSignature>>> {
    return this.#interfaces;
  }

  get resultTypes(): Readonly<Record<string, GoStructData>> {
    return this.#resultTypes;
  }

  get tsResultTypes(): readonly string[] {
    return [...this.#tsResultTypes];
  }

  get actions(): readonly mm.TableActions[] {
    return [...this.#actions];
  }

  get tables(): readonly mm.Table[] {
    return [...this.#tables];
  }

  addSharedInterface(name: string, funcSig: FuncSignature) {
    if (this.#interfaces[name] === undefined) {
      this.#interfaces[name] = new Map<string, FuncSignature>();
    }
    this.#interfaces[name]?.set(funcSig.sig, funcSig);
  }

  addSharedResultType(name: string, structData: GoStructData, ts: boolean) {
    const prev = this.#resultTypes[name];
    this.#resultTypes[name] = prev ? prev.merge(structData) : structData;
    if (ts) {
      this.#tsResultTypes.add(name);
    }
  }

  addAction(action: mm.TableActions) {
    this.#actions.add(action);
  }

  addTable(table: mm.Table) {
    this.#tables.add(table);
  }

  hasAction(action: mm.TableActions) {
    return this.#actions.has(action);
  }

  hasTable(table: mm.Table) {
    return this.#tables.has(table);
  }

  hasTsResultType(type: string) {
    return this.#tsResultTypes.has(type);
  }
}
