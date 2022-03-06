export function forEachWithSlots<T>(
  array: ReadonlyArray<T>,
  callback: (item: T) => void,
  slotCallback: () => void,
) {
  if (array.length === 1 && array[0] !== undefined) {
    callback(array[0]);
    return;
  }
  array.forEach((element, i) => {
    callback(element);
    if (i !== array.length - 1) {
      slotCallback();
    }
  });
}

export function join2DArrays<T>(matrix: T[][], item: T): T[] {
  const res: T[] = [];
  forEachWithSlots(
    matrix,
    (array) => res.push(...array),
    () => res.push(item),
  );
  return res;
}

export function dedup<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function throwOnEmptyArray<T>(arr: T[] | readonly T[], name: string) {
  if (!arr.length) {
    throw new Error(`The argument ${name} cannot be an empty array`);
  }
}
