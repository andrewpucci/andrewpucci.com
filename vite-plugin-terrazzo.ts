import { execFileSync } from 'node:child_process';
import path from 'node:path';
import type { Plugin } from 'vite';

const TOKENS_SOURCE = path.resolve('tokens/tokens.json');
const TERRAZZO_BIN = path.resolve('node_modules/.bin/tz');

function runTerrazzoBuild() {
  execFileSync(TERRAZZO_BIN, ['build'], { stdio: 'inherit' });
}

/**
 * There's no official Terrazzo Vite plugin (`@terrazzo/vite` doesn't exist;
 * Terrazzo ships as a CLI). This wraps the CLI so `tokens/tokens.json`
 * recompiles automatically while `vite dev` is running.
 *
 * Deliberately does nothing at startup (no buildStart, no unconditional call
 * in configureServer) -- only reacts to tokens.json changing. Two failure
 * modes ruled that out:
 *   1. A `buildStart` call broke SvelteKit's client/server build
 *      coordination outright: pages built fine but threw "Cannot read
 *      properties of undefined (reading 'data')" during hydration, on every
 *      route, with no other change.
 *   2. An unconditional call in `configureServer` (to cover the "first `vite
 *      dev` of the session" case) caused a restart storm: writing
 *      src/lib/tokens/tokens.css from inside configureServer appears to
 *      itself qualify as a reason for Vite to restart, which re-runs
 *      configureServer, which writes the file again -- dozens of `tz build`
 *      processes spawned within seconds.
 * `npm run dev`/`build`/`check` all run `tokens:build` as their own
 * sequential step first instead, so the initial file always exists before
 * Vite (or this plugin) ever touches it.
 */
export function terrazzo(): Plugin {
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
