import { build, emptyDir } from 'jsr:@deno/dnt@^0.41.2';
import { parse } from 'jsr:@std/jsonc@^0.224.0';

const [denoJson] = await Promise.all([
  Deno.readTextFile('./deno.jsonc'),
  emptyDir('./npm'),
]);

const { name, version, exports } = parse(denoJson) as {
  name: string;
  version: string;
  exports: unknown;
};
if (typeof exports !== 'string') {
  throw new Error('Expected exports field in deno.jsonc to be a string');
}

const runTestsAfterBuild = Deno.args.includes('--test');

await build({
  entryPoints: [exports],
  outDir: './npm',
  importMap: './deno.jsonc',
  shims: {
    // see JS docs for overview and more options
    deno: 'dev',
  },
  package: {
    // package.json properties
    name,
    version,
    description:
      'Dumping group of useful JS concepts and data structures for my projects',
    license: 'MIT',
    sideEffects: false,
    private: false,
    repository: {
      type: 'git',
      url: 'git+https://github.com/NotWoods/webish.git',
    },
    bugs: {
      url: 'https://github.com/NotWoods/webish/issues',
    },
    author: {
      name: 'Tiger Oakes',
      email: 'contact@tigeroakes.com',
    },
  },
  test: runTestsAfterBuild,
  scriptModule: runTestsAfterBuild ? false : 'cjs',
  async postBuild() {
    // steps to run after building and before running the tests
    await Promise.all([
      Deno.copyFile('LICENSE', 'npm/LICENSE'),
      Deno.copyFile('README.md', 'npm/README.md'),
    ]);
  },
});
