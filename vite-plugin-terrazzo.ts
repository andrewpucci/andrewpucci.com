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
 * Terrazzo ships as a CLI). This wraps the CLI so `tokens/tokens.json` compiles
 * to `src/lib/tokens/tokens.css` automatically on every dev/build, matching the
 * "regenerates automatically" behavior ADR-0006 describes.
 */
export function terrazzo(): Plugin {
  return {
    name: 'terrazzo-tokens',
    buildStart() {
      runTerrazzoBuild();
    },
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
