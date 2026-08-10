import { marked } from 'marked';
import { parseFrontmatter } from '$lib/utils/frontmatter';
import type { ResumeEntryData } from '$lib/types/resume';

type RawResumeFrontmatter = {
  title: string;
  organization?: string;
  organizationUrl?: string;
  location?: string;
  start: string;
  end?: string;
};

function loadEntries(files: Record<string, string>): ResumeEntryData[] {
  const entries = Object.values(files).map((raw) => {
    const { data, content } = parseFrontmatter<RawResumeFrontmatter>(raw);
    return {
      ...data,
      contentHtml: content ? (marked.parse(content, { async: false }) as string) : undefined,
    };
  });

  // Oldest-first; content components (EntryList) reverse this for display.
  return entries.sort((a, b) => a.start.localeCompare(b.start));
}

export const workEntries = loadEntries(
  import.meta.glob('./resume/work/*.md', { eager: true, query: '?raw', import: 'default' })
);

export const educationEntries = loadEntries(
  import.meta.glob('./resume/education/*.md', { eager: true, query: '?raw', import: 'default' })
);

export const speakingEntries = loadEntries(
  import.meta.glob('./resume/speaking/*.md', { eager: true, query: '?raw', import: 'default' })
);

export const volunteeringEntries = loadEntries(
  import.meta.glob('./resume/volunteering/*.md', { eager: true, query: '?raw', import: 'default' })
);
