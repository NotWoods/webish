/**
 * @example
 * count(3).map((_, i) => i);
 */
export function count(n: number): never[] {
    return Array.from({ length: n });
}