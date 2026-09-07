import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { buildReviewComment } from './review.mjs';

const itemId = '7wzb4oxgtxhukx75lewsbovlqq';
const usage = 'Usage: npm run dependabot:review:dry-run -- <pull-request-number>';
const execFileAsync = promisify(execFile);

const execute = async (command, args) => execFileAsync(command, args, { encoding: 'utf8' });

function outputValue(result, description) {
  const value = result.stdout.trim();
  if (!value) throw new Error(`${description} was empty.`);
  return value;
}

export async function runDryReview(
  args,
  {
    buildReviewComment: build = buildReviewComment,
    runCommand = execute,
    write = process.stdout.write.bind(process.stdout),
  } = {}
) {
  if (args.length !== 1 || !/^[1-9]\d*$/.test(args[0])) throw new Error(usage);
  const number = Number(args[0]);
  const githubToken = outputValue(await runCommand('gh', ['auth', 'token']), 'GitHub token');
  const repository = outputValue(
    await runCommand('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']),
    'GitHub repository'
  );
  const mistralApiKey = outputValue(
    await runCommand('op', ['item', 'get', itemId, '--fields', 'credential', '--reveal']),
    'Mistral API key'
  );
  const body = await build({ repository, number, githubToken, mistralApiKey });
  if (!body)
    throw new Error(`Pull request #${number} has no reviewable Dependabot dependency updates.`);
  write(`${body}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await runDryReview(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
