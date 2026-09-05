export function pullRequestNumber(event) {
  const number = event?.workflow_run?.pull_requests?.[0]?.number;
  if (!Number.isInteger(number))
    throw new Error('workflow_run is not associated with a pull request.');
  return number;
}
