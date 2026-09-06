const responseDetail = async (response) => {
  const detail = (await response.text()).replaceAll(/\s+/g, ' ').trim();
  const acceptedPermissions = response.headers.get('x-accepted-github-permissions');
  const permissions = acceptedPermissions
    ? ` Accepted GitHub permissions: ${acceptedPermissions}.`
    : '';
  return detail ? `: ${detail.slice(0, 500)}${permissions}` : permissions;
};

async function ensureSuccess(response, action) {
  if (!response.ok)
    throw new Error(`Unable to ${action} (${response.status})${await responseDetail(response)}`);
  return response;
}

export async function upsertComment({
  api,
  body,
  headers,
  author = 'github-actions[bot]',
  fetchLike = fetch,
}) {
  const comments = await ensureSuccess(
    await fetchLike(api, { headers }),
    'list Dependabot review comments'
  ).then((response) => response.json());
  const existing = comments.find(
    (comment) =>
      comment.user?.login === author &&
      comment.body?.includes('<!-- dependabot-intelligent-review -->')
  );
  const action = existing ? 'update' : 'create';
  const commentApi = existing
    ? api.replace(/\/issues\/\d+\/comments$/, `/issues/comments/${existing.id}`)
    : api;
  await ensureSuccess(
    await fetchLike(commentApi, {
      method: existing ? 'PATCH' : 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    }),
    `${action} Dependabot review comment`
  );
}
