import { build, emptyDir } from 'https://deno.land/x/dnt@0.40.0/mod.ts';

await emptyDir('./npm');

await build({
  entryPoints: ['./src/mod.ts'],
  outDir: './npm',
  importMap: './deno.jsonc',
  shims: {
    // see JS docs for overview and more options
    deno: 'dev',
  },
  package: {
    // package.json properties
    name: '@notwoods/webish',
    version: Deno.args[0]?.replace(/^v/, ''),
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
  async postBuild() {
    // steps to run after building and before running the tests
    await Promise.all([
      Deno.copyFile('LICENSE', 'npm/LICENSE'),
      Deno.copyFile('README.md', 'npm/README.md'),
    ]);
  },
});
