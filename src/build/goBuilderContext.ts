export class FuncItem {
  constructor(public name: string, public sig: string) {}
}

export default class GoBuilderContext {
  private interfaces: { [name: string]: FuncItem[] } = {};
  handleInterfaceMember(intName: string, funcName: string, sig: string) {
    if (!this.interfaces[intName]) {
      this.interfaces[intName] = [];
    }
    this.interfaces[intName].push(new FuncItem(funcName, sig));
  }
}
