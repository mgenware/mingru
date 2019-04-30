export default class NameContext {
  private map = new Set<string>();

  get(name: string): string {
    const { map } = this;
    if (map.has(name)) {
      throw new Error(`The name "${name}" already exists`);
    }
    map.add(name);
    return name;
  }
}
