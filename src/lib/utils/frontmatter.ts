export interface ParsedMarkdown<T> {
  data: T;
  content: string;
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/**
 * Minimal frontmatter parser for the flat, unquoted-or-quoted `key: value`
 * shape used by this repo's resume entries. Not a full YAML parser -- there's
 * no need for one here, and gray-matter (the common alternative) scored 2.5 on
 * OpenSSF Scorecard with no maintenance activity (see ADR-0003).
 */
export function parseFrontmatter<T extends Record<string, string>>(raw: string): ParsedMarkdown<T> {
  const match = raw.match(FRONTMATTER_PATTERN);
  if (!match) return { data: {} as T, content: raw.trim() };

  const [, frontmatter, content] = match;
  const data: Record<string, string> = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    const isQuoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (isQuoted) value = value.slice(1, -1);

    data[key] = value;
  }

  return { data: data as T, content: content.trim() };
}
