/**
 * Wrap an item into an array, or return the array if it's already an array.
 */
export function asArray<T>(items: T | T[]): T[];
export function asArray<T>(items: T | readonly T[]): readonly T[];
export function asArray<T>(items: T | readonly T[]): readonly T[] {
    // @ts-expect-error isArray doesn't handle readonly arrays properly
    return Array.isArray(items) ? items : [items];
}

/**
 * @example
 * count(3).map((_, i) => i);
 */
export function count(n: number): never[] {
    return Array.from({ length: n });
}

/**
 * @returns Sum of all numbers in an array.
 */
export function sum(array: readonly number[]): number {
    return array.reduce((a, b) => a + b, 0);
}
