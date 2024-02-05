interface MemoizeCacheEntry<Func extends (...args: unknown[]) => unknown> {
    readonly args: Parameters<Func>;
    readonly result: ReturnType<Func>;
}

/**
 * Creates a copy of `fn` that caches the last result.
 * If called again with the same parameters, the cached result is returned.
 * @param [cacheSize=1] How many recent entries to memoize.
 */
export function memoize<Func extends (...args: any[]) => unknown>(
    fn: Func,
    cacheSize = 1,
) {
    const cache: MemoizeCacheEntry<Func>[] = [];

    return function (...args: Parameters<Func>): ReturnType<Func> {
        for (const { args: lastArgs, result: lastResult } of cache) {
            if (lastArgs.every((arg, i) => arg === args[i])) {
                return lastResult;
            }
        }

        const entry: MemoizeCacheEntry<Func> = {
            args,
            result: fn(...args) as ReturnType<Func>,
        };
        cache.push(entry);
        while (cache.length > cacheSize) {
            cache.shift();
        }

        return entry.result;
    };
}