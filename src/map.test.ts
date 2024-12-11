import { assertEquals } from '@std/assert';
import { getOrDefault, transformMap, transformMapAsync } from './map.ts';

Deno.test('transformMap transforms values', () => {
  const input = new Map(
    Object.entries({
      foo: 'bar',
      bar: 'foo',
    }),
  );

  const output = transformMap(input, (val) => val.toUpperCase());

  assertEquals(Object.fromEntries(output), {
    foo: 'BAR',
    bar: 'FOO',
  });
});

Deno.test('transformMapAsync transforms values', async () => {
  const input = new Map(
    Object.entries({
      foo: 'bar',
      bar: 'foo',
    }),
  );

  const output = await transformMapAsync(input, (val) => val.toUpperCase());

  assertEquals(Object.fromEntries(output), {
    foo: 'BAR',
    bar: 'FOO',
  });
});

Deno.test('getOrDefault gets and inserts values', () => {
  const input = new Map<number, string[]>().set(1, ['foo']);

  const one = getOrDefault(input, 1, []);
  const two = getOrDefault(input, 2, []);
  const three = getOrDefault(input, 3, []);
  two.push('bar');

  assertEquals(one, ['foo']);
  assertEquals(two, ['bar']);
  assertEquals(three, []);

  assertEquals(Object.fromEntries(input), {
    1: ['foo'],
    2: ['bar'],
    3: [],
  });
});
