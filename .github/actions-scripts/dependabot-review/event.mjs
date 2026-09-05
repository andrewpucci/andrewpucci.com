export function workflowRunHeadSha(event) {
  const headSha = event?.workflow_run?.head_sha;
  if (typeof headSha !== 'string' || !headSha)
    throw new Error('workflow_run is missing its head SHA.');
  return headSha;
}

export function pullRequestForWorkflowRun(pullRequests, headSha) {
  const pullRequest = pullRequests.find((item) => item?.head?.sha === headSha);
  return pullRequest ?? null;
}
