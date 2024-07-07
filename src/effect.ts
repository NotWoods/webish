/**
 * Returns a function that, when called, will provide an AbortSignal that aborts when the cleanup function is called.
 *
 * @example
 * // Svelte 5
 * $effect(withAbortSignal((signal) => {
 *   element.addEventListener('click', () => {}, { signal });
 * }))
 *
 * @example
 * // Svelte Store
 * const store = readable(undefined, withAbortSignal((signal, set, update) => {
 *   element.addEventListener('click', () => update(n => n + 1), { signal });
 * }))
 *
 * @example
 * // React & Preact
 * useEffect(withAbortSignal((signal) => {
 *   elementRef.current.addEventListener('click', () => {}, { signal });
 * }), [elementRef])
 */
export function withAbortSignal<Args extends unknown[] = []>(
  callback: (signal: AbortSignal, ...args: Args) => void | (() => void),
): (...args: Args) => () => void {
  return function effectWithSignal(...args): () => void {
    const controller = new AbortController();
    const cleanup = callback(controller.signal, ...args);
    return () => {
      controller.abort();
      cleanup?.();
    };
  };
}
