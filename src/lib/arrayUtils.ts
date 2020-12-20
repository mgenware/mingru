export function forEachWithSlots<T>(
  array: ReadonlyArray<T>,
  callback: (item: T) => void,
  slotCallback: () => void,
) {
  if (array.length === 1) {
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
