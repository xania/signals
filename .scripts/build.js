import { build } from 'esbuild';

async function main() {
  /** @returns {import('esbuild').BuildOptions} */
  function options({ dev = false }) {
    return {
      entryPoints: ['src/index.ts'],
      outfile: `dist/${dev ? 'dev' : 'prod'}/index.js`,
      treeShaking: true,
      format: 'esm',
      bundle: true,
      // minify: true,
      platform: 'browser',
      target: 'esnext',
      mangleProps: !dev ? /^_/ : undefined,
      write: true,
      watch: hasArg('-w'),
      define: {
        __DEV__: dev ? 'true' : 'false',
        __TEST__: 'false',
      },
      external: ['@maverick-js/scheduler'],
    };
  }

  await Promise.all([build(options({ dev: true })), build(options({ dev: false }))]);
}

function hasArg(arg) {
  return process.argv.includes(arg);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
