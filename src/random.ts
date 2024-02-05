/**
 * Pick a random integer between `min` and `max`, inclusive.
 * @param min - The minimum value, inclusive.
 * @param max - The maximum value, inclusive.
 *
 * @example
 * randomInteger(0, 2); // 0, 1, or 2
 * randomInteger(3, 5); // 3, 4, or 5
 */
export function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Returns a random item from the given array.
 * @template T - The type of the array items.
 * @param items - The array from which to pick a random item.
 */
export function randomItem<T>(items: ArrayLike<T>): T {
  return items[randomInteger(0, items.length - 1)];
}
