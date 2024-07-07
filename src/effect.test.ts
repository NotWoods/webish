import { assertEquals, assertInstanceOf } from '@std/assert';
import { DOMParser } from 'jsr:@b-fuze/deno-dom@^0.1.0';
import { renderHook } from 'npm:@testing-library/preact@^3.2.0';
import { useEffect } from 'npm:preact@^10.0.0/hooks';
import { readable } from 'npm:svelte@^4.0.0/store';
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

Deno.test('withAbortSignal works with readable store', () => {
  let signal: AbortSignal | undefined;
  let setter: (value: number) => void;
  let cleanedUp = false;
  const store = readable<number>(
    0,
    withAbortSignal((s, set) => {
      signal = s;
      setter = set;
      return () => {
        cleanedUp = true;
      };
    }),
  );

  let value: number | undefined;
  let unsubscribe = store.subscribe((v) => {
    value = v;
  });

  assertInstanceOf(signal, AbortSignal);
  assertEquals(signal.aborted, false);
  assertEquals(cleanedUp, false);
  assertEquals(value, 0);

  setter!(1);
  assertEquals(signal.aborted, false);
  assertEquals(cleanedUp, false);
  assertEquals(value, 1);

  unsubscribe();

  assertEquals(signal.aborted, true);
  assertEquals(cleanedUp, true);
  assertEquals(value, 1);
});
