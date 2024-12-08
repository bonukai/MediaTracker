import esbuild from 'esbuild';
import { spawn } from 'child_process';
import { globSync } from 'glob';
import { parseArgs } from 'node:util';
import { watch } from 'node:fs/promises';

const {
  values: { watch: watchMode, 'start-server': startServer },
} = parseArgs({
  options: {
    watch: {
      type: 'boolean',
    },
    'start-server': {
      type: 'boolean',
    },
  },
});

/** @type {import('child_process').ChildProcess} */
let server;

/** @type {import('esbuild').Plugin} */
const startServerPlugin = {
  name: 'startServer',
  setup(build) {
    build.onEnd((e) => {
      if (server) {
        server.kill('SIGINT');
      }

      if (e.errors?.length > 0) {
        return;
      }

      server = spawn(
        'node',
        ['--enable-source-maps', 'build/index.js', 'start-server'],
        {
          stdio: 'inherit',
        }
      );
    });
  },
};

/** @type {(watchMode: boolean)=> Promise<void>} */
const rebuild = async (watchMode) => {
  try {
    const ctx = await esbuild.context({
      entryPoints: globSync('src/**/*.ts'),
      outdir: 'build',
      platform: 'node',
      bundle: false,
      sourcemap: 'linked',
      format: 'esm',
      logLevel: 'info',
      target: 'es2022',
      metafile: true,
      plugins: startServer ? [startServerPlugin] : [],
    });

    await ctx.rebuild();
    await ctx.dispose();

    console.log(`rebuilded`);
  } catch (error) {}
};

if (watchMode) {
  const ac = new AbortController();

  await rebuild(true);

  try {
    const watcher = watch('src', {
      recursive: true,
      signal: ac.signal,
    });

    for await (const event of watcher) {
      await rebuild(true);
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      throw err;
    }
  }
}
