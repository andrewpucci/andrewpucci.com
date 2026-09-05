/**
 * @param {unknown} event
 * @param {{ repository?: string; githubHeaders?: HeadersInit; fetchLike?: typeof fetch }} [options]
 */
export async function pullRequestNumber(
  event,
  { repository, githubHeaders = {}, fetchLike = fetch } = {}
) {
  const run = event?.workflow_run;
  const number = run?.pull_requests?.[0]?.number;
  if (Number.isInteger(number)) return number;

  const [owner] = typeof repository === 'string' ? repository.split('/') : [];
  if (!owner || typeof run?.head_branch !== 'string' || typeof run.head_sha !== 'string')
    throw new Error('workflow_run is not associated with a pull request.');

  // workflow_run does not reliably expose the upstream pull request.
  const api = new URL(`https://api.github.com/repos/${repository}/pulls`);
  api.searchParams.set('state', 'open');
  api.searchParams.set('head', `${owner}:${run.head_branch}`);
  const response = await fetchLike(api.toString(), { headers: githubHeaders });
  if (!response.ok)
    throw new Error(`Unable to find workflow run pull request (${response.status}).`);
  const pulls = await response.json();
  const pullRequest = Array.isArray(pulls)
    ? pulls.find((pull) => pull?.head?.sha === run.head_sha && Number.isInteger(pull.number))
    : undefined;
  if (!pullRequest) throw new Error('workflow_run is not associated with a pull request.');
  return pullRequest.number;
}
