import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const TOKENS_SOURCE = path.resolve('tokens/tokens.json');
const TOKENS_OUTPUT = path.resolve('src/lib/tokens/tokens.css');
const TERRAZZO_BIN = path.resolve('node_modules/.bin/tz');
const TERRAZZO_BUILD_ACTIVE = 'TERRAZZO_BUILD_ACTIVE';

function runTerrazzoBuild() {
  execFileSync(TERRAZZO_BIN, ['build'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      [TERRAZZO_BUILD_ACTIVE]: '1',
    },
  });
}

function needsTerrazzoBuild() {
  if (!existsSync(TOKENS_OUTPUT)) {
    return true;
  }

  return statSync(TOKENS_SOURCE).mtimeMs > statSync(TOKENS_OUTPUT).mtimeMs;
}

function ensureTerrazzoBuild() {
  if (process.env[TERRAZZO_BUILD_ACTIVE] === '1') {
    return;
  }

  if (needsTerrazzoBuild()) {
    runTerrazzoBuild();
  }
}

/**
 * There's no official Terrazzo Vite plugin (`@terrazzo/vite` doesn't exist;
 * Terrazzo ships as a CLI). This wraps the CLI so `tokens/tokens.json`
 * recompiles automatically while `vite dev` is running.
 *
 * Initial generation now happens in two places:
 *   1. `postinstall` seeds the generated file for metadata-only commands
 *      like `vp check`, which do not load Vite plugins because `lazyPlugins`
 *      intentionally skips them.
 *   2. The plugin itself does a one-time freshness check when Vite starts
 *      real work (`vp dev`, `vp build`, `vp preview`, tests) so direct `vp`
 *      commands do not depend on `npm` wrapper scripts.
 *
 * Deliberately does not build from `buildStart` or unconditionally inside
 * `configureServer`. Those both caused real failures here:
 *   1. `buildStart` broke SvelteKit's client/server build coordination
 *      outright: pages built fine but every route hydrated with
 *      "Cannot read properties of undefined (reading 'data')".
 *   2. An unconditional `configureServer` build caused a restart storm:
 *      writing `src/lib/tokens/tokens.css` from inside that hook appears to
 *      qualify as a reason for Vite to restart, which re-enters
 *      `configureServer`, which writes the file again.
 */
export function terrazzo(): Plugin {
  ensureTerrazzoBuild();

  return {
    name: 'terrazzo-tokens',
    configureServer(server) {
      server.watcher.add(TOKENS_SOURCE);
      server.watcher.on('change', (file) => {
        if (path.resolve(file) === TOKENS_SOURCE) {
          runTerrazzoBuild();
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}
