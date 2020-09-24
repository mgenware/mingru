export function joinArrayWithItem<T>(array: T[], item: T): T[] {
  const res: T[] = [];
  array.forEach((element, i) => {
    res.push(element);
    if (i !== array.length - 1) {
      res.push(item);
    }
  });
  return res;
}
