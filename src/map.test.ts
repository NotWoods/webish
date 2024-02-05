import { assertEquals } from "https://deno.land/std@0.214.0/assert/mod.ts";
import { transformMap, transformMapAsync } from '../map.ts';

Deno.test('transformMap transforms values', () => {
	const input = new Map(
		Object.entries({
			foo: 'bar',
			bar: 'foo'
		})
	);

	const output = transformMap(input, (val) => val.toUpperCase());

	assertEquals(Object.fromEntries(output), {
		foo: 'BAR',
		bar: 'FOO'
	});
});

Deno.test('transformMapAsync transforms values', async () => {
	const input = new Map(
		Object.entries({
			foo: 'bar',
			bar: 'foo'
		})
	);

	const output = await transformMapAsync(input, (val) => val.toUpperCase());

	assertEquals(Object.fromEntries(output), {
		foo: 'BAR',
		bar: 'FOO'
	});
});
