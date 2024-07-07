import { assertEquals, assertInstanceOf } from '@std/assert';
import { DOMParser } from 'jsr:@b-fuze/deno-dom@^0.1.0';
import { renderHook } from 'npm:@testing-library/preact';
import { useEffect } from 'npm:preact/hooks';
import { withAbortSignal } from './effect.ts';

const document = new DOMParser().parseFromString('', 'text/html');
// @ts-ignore mocking for test
globalThis.document = document;

Deno.test('withAbortSignal works with useEffect', () => {
  let signal: AbortSignal | undefined;
  let cleanedUp = false;
  const { unmount } = renderHook(() =>
    useEffect(withAbortSignal((s) => {
      signal = s;
      return () => {
        cleanedUp = true;
      };
    }))
  );

  assertInstanceOf(signal, AbortSignal);
  assertEquals(signal.aborted, false);
  assertEquals(cleanedUp, false);

  unmount();

  assertEquals(signal.aborted, true);
  assertEquals(cleanedUp, true);
});
