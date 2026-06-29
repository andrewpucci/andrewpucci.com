#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { extname } from 'path';

// Avoid blocking when run interactively without piped stdin
if (process.stdin.isTTY) process.exit(0);

let input;
try {
  input = JSON.parse(readFileSync('/dev/stdin', 'utf8'));
} catch {
  process.exit(0);
}

const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const cwd = process.cwd();

const run = (bin, ...args) => {
  const result = spawnSync(`./node_modules/.bin/${bin}`, [...args, filePath], {
    stdio: 'pipe',
    cwd,
  });
  if (result.error?.code === 'ENOENT') {
    process.stderr.write(`lint-on-save: ${bin} not found in node_modules/.bin\n`);
  }
};

const ext = extname(filePath);
if (['.js', '.mjs', '.cjs'].includes(ext)) {
  run('oxlint', '--fix');
  run('oxfmt');
} else if (['.json', '.scss', '.css', '.html'].includes(ext)) {
  run('oxfmt');
} else if (ext === '.md') {
  run('markdownlint-cli2', '--fix');
}
