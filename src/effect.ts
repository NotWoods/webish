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
 * // React & Preact
 * useEffect(withAbortSignal((signal) => {
 *   elementRef.current.addEventListener('click', () => {}, { signal });
 * }), [elementRef])
 */
export function withAbortSignal(
  callback: (signal: AbortSignal) => void | (() => void),
): () => () => void {
  return function effectWithSignal() {
    const controller = new AbortController();
    const cleanup = callback(controller.signal);
    return () => {
      controller.abort();
      cleanup?.();
    };
  };
}
