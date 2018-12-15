export default class NameContext {
  map: { [name: string]: number } = {};

  get(name: string): string {
    const { map } = this;
    let result = name;
    if (!map[name]) {
      map[name] = 2;
    } else {
      result = name + map[name];
      map[name] += 1;
    }
    return result;
  }
}
