const allowedPath = (path) =>
  !/(^|\/)\.env(?:\.|$)/.test(path) &&
  ([
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'vite.config.ts',
    'svelte.config.js',
  ].includes(path) ||
    /^\.github\/workflows\/[^/]+\.ya?ml$/.test(path) ||
    /^src\/.+\.(?:[cm]?[jt]sx?|svelte)$/.test(path));
const maximumFacts = 20;

function excerptFor(text, name, ecosystem) {
  const lines = text.split('\n');
  const index = lines.findIndex((line) => line.includes(name));
  if (index < 0) return null;
  const excerpt = [lines[index].trimStart().replace(/^-\s*/, '')];
  if (ecosystem === 'actions') {
    for (const line of lines.slice(index + 1, index + 4)) {
      if (!/^\s/.test(line)) break;
      excerpt.push(line);
    }
  }
  const value = excerpt.join('\n');
  return { value: value.slice(0, 500), truncated: value.length > 500 };
}

export async function collectRepositoryContext(packages, { paths, readFile }) {
  const readablePaths = paths.filter(allowedPath);
  const files = await Promise.all(
    readablePaths.map(async (path) => {
      try {
        return { path, text: await readFile(path) };
      } catch {
        return null;
      }
    })
  );
  return packages.map(({ name, ecosystem }) => {
    const allFacts = files.flatMap((file) => {
      if (!file || typeof file.text !== 'string') return [];
      const excerpt = excerptFor(file.text, name, ecosystem);
      return excerpt
        ? [
            {
              kind: ecosystem === 'actions' ? 'workflow-action' : 'package-usage',
              path: file.path,
              excerpt: excerpt.value,
              truncated: excerpt.truncated,
            },
          ]
        : [];
    });
    return {
      name,
      status:
        allFacts.length > maximumFacts || allFacts.some((fact) => fact.truncated)
          ? 'partial'
          : allFacts.length
            ? 'available'
            : 'unavailable',
      facts: allFacts.slice(0, maximumFacts).map(({ truncated: _truncated, ...fact }) => fact),
    };
  });
}
