/**
 * Pick some subset of `keys` from the given `obj`.
 * @param obj - The object from which to pick keys.
 * @param keys - Subset of keys in the object.
 */
export function pick<T, Keys extends keyof T>(
  obj: T,
  keys: readonly Keys[],
): Pick<T, Keys> {
  const result: Partial<Pick<T, Keys>> = {};
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result as Pick<T, Keys>;
}
