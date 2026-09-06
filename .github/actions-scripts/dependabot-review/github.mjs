const responseDetail = async (response) => {
  const detail = (await response.text()).replaceAll(/\s+/g, ' ').trim();
  return detail ? `: ${detail.slice(0, 500)}` : '';
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
  await ensureSuccess(
    await fetchLike(existing ? `${api}/${existing.id}` : api, {
      method: existing ? 'PATCH' : 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    }),
    `${action} Dependabot review comment`
  );
}
