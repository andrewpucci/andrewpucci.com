import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { buildReviewCommentFromInput, loadReviewInput } from './review.mjs';

const itemId = '7wzb4oxgtxhukx75lewsbovlqq';
const usage = 'Usage: npm run dependabot:review:dry-run -- <pull-request-number> [--preflight]';
const execFileAsync = promisify(execFile);

const execute = async (command, args) => execFileAsync(command, args, { encoding: 'utf8' });

function outputValue(result, description) {
  const value = result.stdout.trim();
  if (!value) throw new Error(`${description} was empty.`);
  return value;
}

function parseArguments(args) {
  if (
    ![1, 2].includes(args.length) ||
    !/^[1-9]\d*$/.test(args[0]) ||
    (args.length === 2 && args[1] !== '--preflight')
  )
    throw new Error(usage);
  return { number: Number(args[0]), preflight: args[1] === '--preflight' };
}

function writeToStream(stream, value) {
  return new Promise((resolve, reject) => {
    stream.write(value, (error) => (error ? reject(error) : resolve()));
  });
}

function dependencyLabel(count) {
  return `reviewable Dependabot dependency update${count === 1 ? '' : 's'}`;
}

function dependencySummary(packages) {
  const direct = packages.filter((dependency) =>
    dependency.dependencyType.startsWith('direct:')
  ).length;
  return `${direct} direct, ${packages.length - direct} transitive`;
}

export async function runDryReview(
  args,
  {
    buildReviewCommentFromInput: build = buildReviewCommentFromInput,
    loadReviewInput: load = loadReviewInput,
    runCommand = execute,
    write = (value) => writeToStream(process.stdout, value),
    writeStatus = (value) => writeToStream(process.stderr, value),
  } = {}
) {
  const { number, preflight } = parseArguments(args);
  const githubToken = outputValue(await runCommand('gh', ['auth', 'token']), 'GitHub token');
  const repository = outputValue(
    await runCommand('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']),
    'GitHub repository'
  );
  const input = await load({ repository, number, githubToken });
  if (!input)
    throw new Error(`Pull request #${number} has no reviewable Dependabot dependency updates.`);
  if (preflight) {
    await write(
      `Pull request #${number} has ${input.packages.length} ${dependencyLabel(input.packages.length)} (${dependencySummary(input.packages)}).\n`
    );
    return;
  }
  const mistralApiKey = outputValue(
    await runCommand('op', ['item', 'get', itemId, '--fields', 'credential', '--reveal']),
    'Mistral API key'
  );
  const body = await build(input, mistralApiKey);
  await write(`${body}\n`);
  await writeStatus(
    `Generated review for pull request #${number} (${Buffer.byteLength(`${body}\n`)} bytes).\n`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await runDryReview(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
