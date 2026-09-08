const requestDefaults = { maxConcurrency: 2, maxRequests: 160 };

function urlString(input) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return typeof input?.url === 'string' ? input.url : '';
}

function githubApiRequest(input) {
  try {
    return new URL(urlString(input)).hostname === 'api.github.com';
  } catch {
    return false;
  }
}

function requestMethod(input, options) {
  return (options?.method ?? input?.method ?? 'GET').toUpperCase();
}

function authorizationScope(input, options) {
  const headers = new Headers(input?.headers);
  for (const [name, value] of new Headers(options?.headers)) headers.set(name, value);
  return headers.get('authorization') ?? '';
}

function numberHeader(headers, name) {
  const value = Number(headers.get(name));
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function rateLimit(response) {
  if (![403, 429].includes(response.status)) return null;
  return {
    status: response.status,
    resource: response.headers.get('x-ratelimit-resource') ?? null,
    remaining: numberHeader(response.headers, 'x-ratelimit-remaining'),
    reset: numberHeader(response.headers, 'x-ratelimit-reset'),
    retryAfter: numberHeader(response.headers, 'retry-after'),
  };
}

export class GithubRequestLimitError extends Error {
  constructor(limit) {
    super(`GitHub request collection stopped: ${limit.status}.`);
    this.name = 'GithubRequestLimitError';
    this.limit = limit;
  }
}

/**
 * Bounds and de-duplicates read requests to api.github.com without governing
 * other fetch destinations, such as the public npm registry.
 */
export function createGithubRequestGovernor(fetchLike = fetch, options = {}) {
  const { maxConcurrency, maxRequests } = { ...requestDefaults, ...options };
  if (!Number.isSafeInteger(maxConcurrency) || maxConcurrency < 1)
    throw new RangeError('GitHub request concurrency must be a positive integer.');
  if (!Number.isSafeInteger(maxRequests) || maxRequests < 1)
    throw new RangeError('GitHub request budget must be a positive integer.');
  const state = { active: 0, requests: 0, limit: null, pending: [] };
  const reads = new Map();

  const stop = (limit) => {
    if (!state.limit) {
      state.limit = limit;
      for (const task of state.pending.splice(0)) task();
    }
    return state.limit;
  };
  const diagnostics = () => ({ requests: state.requests, limit: state.limit });
  const next = () => {
    while (!state.limit && state.active < maxConcurrency && state.pending.length) {
      const task = state.pending.shift();
      if (task) task();
    }
  };
  const dispatch = (input, options) =>
    new Promise((resolve, reject) => {
      const execute = async () => {
        if (state.limit) {
          reject(new GithubRequestLimitError(state.limit));
          return;
        }
        if (state.requests >= maxRequests) {
          reject(new GithubRequestLimitError(stop({ status: 'request_budget_exhausted' })));
          return;
        }
        state.active += 1;
        state.requests += 1;
        try {
          const response = await fetchLike(input, options);
          const limit = rateLimit(response);
          if (limit) stop(limit);
          resolve(response);
        } catch (error) {
          reject(error);
        } finally {
          state.active -= 1;
          next();
        }
      };
      if (state.limit) {
        reject(new GithubRequestLimitError(state.limit));
        return;
      }
      if (state.active < maxConcurrency) execute();
      else state.pending.push(execute);
    });
  const governedFetch = (input, options) => {
    if (!githubApiRequest(input)) return fetchLike(input, options);
    if (state.limit) return Promise.reject(new GithubRequestLimitError(state.limit));
    const method = requestMethod(input, options);
    if (method !== 'GET') return dispatch(input, options);
    const key = `${authorizationScope(input, options)}\u0000${urlString(input)}`;
    const request = reads.get(key) ?? dispatch(input, options);
    reads.set(key, request);
    return request.then((response) => response.clone());
  };
  return { fetch: governedFetch, diagnostic: diagnostics };
}

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

const nextPage = (link) => /<([^>]+)>;\s*rel="next"/.exec(link ?? '')?.[1];

export async function fetchAllPages({ api, headers, fetchLike = fetch, action, maxPages = 30 }) {
  const entries = [];
  let page = api;
  for (let index = 0; page && index < maxPages; index += 1) {
    const response = await ensureSuccess(await fetchLike(page, { headers }), action);
    const body = await response.json();
    if (!Array.isArray(body))
      throw new TypeError(`Unable to ${action}: expected an array response.`);
    entries.push(...body);
    page = nextPage(response.headers.get('link'));
  }
  if (page) throw new Error(`Unable to ${action}: exceeded ${maxPages} pages.`);
  return entries;
}

const managedComment = (comments, author) =>
  comments.find(
    (comment) =>
      comment.user?.login === author &&
      comment.body?.includes('<!-- dependabot-intelligent-review -->')
  );

const commentApi = (api, comment) =>
  api.replace(/\/issues\/\d+\/comments$/, `/issues/comments/${comment.id}`);

export async function findReviewComment({
  api,
  headers,
  author = 'github-actions[bot]',
  fetchLike = fetch,
}) {
  const comments = await ensureSuccess(
    await fetchLike(api, { headers }),
    'list Dependabot review comments'
  ).then((response) => response.json());
  return managedComment(comments, author) ?? null;
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
  const existing = managedComment(comments, author);
  const action = existing ? 'update' : 'create';
  const targetApi = existing ? commentApi(api, existing) : api;
  await ensureSuccess(
    await fetchLike(targetApi, {
      method: existing ? 'PATCH' : 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    }),
    `${action} Dependabot review comment`
  );
}

export async function deleteReviewComment({
  api,
  headers,
  author = 'github-actions[bot]',
  fetchLike = fetch,
}) {
  const comments = await ensureSuccess(
    await fetchLike(api, { headers }),
    'list Dependabot review comments'
  ).then((response) => response.json());
  const existing = managedComment(comments, author);
  if (!existing) return;
  await ensureSuccess(
    await fetchLike(commentApi(api, existing), { method: 'DELETE', headers }),
    'delete Dependabot review comment'
  );
}
