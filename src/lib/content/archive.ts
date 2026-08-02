import { marked } from 'marked';
import type { CaseStudyMetadata } from '$lib/types/case-study';

export interface ArchiveCaseStudy {
  metadata: CaseStudyMetadata;
  html: string;
}

type ArchiveCaseStudyRecord = Record<string, Omit<CaseStudyMetadata, 'slug'>>;

const rawArchiveModules = import.meta.glob('./archive/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const archiveMetadata: ArchiveCaseStudyRecord = {
  'bookmooch-social-networking-survey': {
    title: 'BookMooch Social Networking Survey - Andrew Pucci',
    description: 'Portfolio piece showing how a set of surveys was completed for BookMooch.',
    hero: '/img/archive/card/bookmooch-survey.png',
    heroTitle: 'BookMooch Social Networking Survey',
    team: [
      { name: 'Andrew Pucci (me!)' },
      { name: 'Cathy King', link: 'https://www.linkedin.com/in/kingcathy/' },
      { name: 'Brett Friedman', link: 'https://www.linkedin.com/in/bretterson/' },
      { name: 'Holly Sander', link: 'https://www.linkedin.com/in/holly-murphy-sander-0174a71b/' },
    ],
    responsibilities: ['Survey Design', 'Remote Interviews'],
    tools: [{ name: 'Qualtrics' }, { name: 'Microsoft Excel' }, { name: 'Skype' }],
  },
  'carnation-city-mall-blueprints': {
    title: 'Carnation City Mall Blueprints - Andrew Pucci',
    description: 'Portfolio piece showing how blueprints were created for Carnation City Mall.',
    hero: '/img/archive/card/carnation-blueprint.png',
    heroTitle: 'Carnation City Mall Blueprints',
    team: [
      { name: 'Andrew Pucci (me!)' },
      {
        name: 'David Cunningham',
        link: 'https://www.linkedin.com/in/david-cunningham-61677940/',
      },
      { name: 'Linda Hart' },
      { name: 'Jeff Kreger', link: 'https://www.linkedin.com/in/jeffkreger/' },
      { name: 'Nathan Rogers', link: 'https://www.linkedin.com/in/narogers/' },
    ],
    responsibilities: ['Competitive Analysis', 'Blueprints'],
    tools: [{ name: 'OpenOffice Draw' }],
  },
  'employee-tool': {
    title: 'Society of Grownups Employee Tool - Andrew Pucci',
    description:
      'Portfolio piece showing how usability studies were conducted to improve an internal tool at Society of Grownups.',
    hero: '/img/archive/card/employee-tool.png',
    heroTitle: 'Society of Grownups Employee Tool',
    team: [
      { name: 'Andrew Pucci (me!)' },
      { name: 'Kim Miller', link: 'https://www.linkedin.com/in/kim-miller-a14ba033/' },
      { name: 'Michael Pelletier', link: 'https://www.linkedin.com/in/mkpelletier/' },
    ],
    responsibilities: ['In-person usability studies'],
    tools: [{ name: 'Github' }, { name: 'HTML/CSS' }],
  },
  'local-yokel-foods-paper-prototype': {
    title: 'Local Yokel Foods Paper Prototype - Andrew Pucci',
    description:
      'Portfolio piece showing how a paper prototype was used to improve the Local Yokel Foods website.',
    hero: '/img/archive/card/paper-prototype.png',
    heroTitle: 'Local Yokel Foods Paper Prototype',
    team: [
      { name: 'Andrew Pucci (me!)' },
      { name: 'Linda Hart' },
      { name: 'Jeff Kreger', link: 'https://www.linkedin.com/in/jeffkreger/' },
    ],
    responsibilities: ['Wireframes', 'Usability Study'],
    tools: [
      { name: 'Posterboard' },
      { name: 'Sharpies' },
      { name: 'Post-it notes' },
      { name: 'Highlighters' },
    ],
  },
  'revamping-course-registration': {
    title: 'Revamping Course Registration  - Andrew Pucci',
    description: 'Portfolio piece showing the process used to revamp academic course registration.',
    hero: '/img/archive/card/course-selection.png',
    heroTitle: 'Revamping Course Registration',
    team: [
      { name: 'Andrew Pucci (me!)' },
      { name: 'Brian Buirge', link: 'https://www.linkedin.com/in/brian-buirge-4255368/' },
      { name: 'Nisha Somnath', link: 'https://www.linkedin.com/in/nisom/' },
    ],
    responsibilities: ['Persona Development', 'User Flows', 'Interactive Prototype'],
    tools: [{ name: 'LovelyCharts' }, { name: 'OpenOffice Draw & Impress' }, { name: 'Axure RP' }],
  },
  'society-of-grownups-website': {
    title: 'Society of Grownups Website - Andrew Pucci',
    description: 'Portfolio piece showing the design process for the Society of Grownups website.',
    hero: '/img/archive/card/grownup-goals.png',
    heroTitle: 'Society of Grownups Website',
    team: [
      { name: 'Andrew Pucci (me!)' },
      { name: 'Kim Miller', link: 'https://www.linkedin.com/in/kim-miller-a14ba033/' },
      { name: 'Michael Pelletier', link: 'https://www.linkedin.com/in/mkpelletier/' },
      { name: 'Monica Hirst', link: 'https://www.linkedin.com/in/monica-hirst-8399318/' },
      { name: 'Bocoup', link: 'https://bocoup.com/' },
    ],
    responsibilities: ['Mockups', 'Prototypes', 'Minor Development'],
    tools: [
      { name: 'Balsamiq' },
      { name: 'Adobe Creative Cloud (mainly Photoshop)' },
      { name: 'InVision' },
      { name: 'HTML/CSS' },
    ],
  },
  'understanding-justcode-users': {
    title: 'Understanding JustCode Users - Andrew Pucci',
    description:
      'Portfolio piece showing how surveys and interviews were used to understand JustCode users.',
    hero: '/img/archive/card/improving-justcode.png',
    heroTitle: 'Understanding JustCode Users',
    team: [
      { name: 'Andrew Pucci (me!)' },
      { name: 'Chris Sells', link: 'https://www.linkedin.com/in/csells/' },
    ],
    responsibilities: ['Participant Recruitment', 'Usability Studies', 'Wireframes'],
    tools: [
      { name: 'Qualtrics' },
      { name: 'Doodle (for participant scheduling)' },
      { name: 'Skype and join.me' },
      { name: 'Camtasia' },
      { name: 'Photoshop' },
    ],
  },
  'young-professionals-of-akron-usability-study': {
    title: 'Young Professionals of Akron Usability Study - Andrew Pucci',
    description:
      'Portfolio piece showing how eye-tracking was used to improve the Young Professionals of Akron website.',
    hero: '/img/archive/card/ypa-eyetracking.png',
    heroTitle: 'Young Professionals of Akron Usability Study',
    team: [
      { name: 'Andrew Pucci (me!)' },
      { name: 'Heather Knable', link: 'https://www.linkedin.com/in/heather-johnson-9289a750/' },
      { name: 'Tess Megla', link: 'https://www.linkedin.com/in/tessweavermegla' },
    ],
    responsibilities: ['Usability Study'],
    tools: [{ name: 'Tobii (Eyetracking)' }],
  },
};

const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;
const IMAGE_SHORTCODE_PATTERN =
  /\{%\s*image\s+"([^"]+)",\s*"([^"]*)"(?:,\s*"[^"]*")?(?:,\s*"[^"]*")?(?:,\s*\[[^\]]*])?\s*%}/g;
const IFRAME_PATTERN = /<iframe[^>]*src="([^"]+)"[^>]*title="([^"]*)"[^>]*><\/iframe>/g;
const BUTTON_PATTERN = /<button[\s\S]*?<\/button>/g;
// The legacy tables open with a `<th>&nbsp;</th>` corner cell, which axe flags
// as an empty header. The three occurrences sit above different row-header
// columns (survey questions in one table, participant names in the other two),
// so no single label is correct for all of them. An empty `<td>` is the correct
// markup for the corner of a table with both row and column headers, and it
// resolves the empty-header violation without inventing a wrong label.
const EMPTY_TABLE_HEADER_PATTERN = /<th>&nbsp;<\/th>/g;
const EMPTY_TABLE_HEADER_REPLACEMENT = '<td></td>';
const LEGACY_ICON_REPLACEMENTS = [
  {
    pattern: /<i class="fas fa-check-circle fa-fw"><\/i>/g,
    replacement: '✓',
  },
  {
    pattern: /<i class="fas fa-times-circle fa-fw"><\/i>/g,
    replacement: '✕',
  },
  {
    pattern: /<i class="fas fa-arrow-down fa-fw"><\/i>/g,
    replacement: '↓',
  },
];

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function toArchiveImagePath(legacyPath: string): string {
  return `/img/archive/${legacyPath.split('/').pop()}`;
}

function stripFrontmatter(raw: string): string {
  return raw.replace(FRONTMATTER_PATTERN, '').trim();
}

function imageShortcodeToHtml(_match: string, legacyPath: string, alt: string): string {
  // These are raw multi-megabyte legacy screenshots served straight from
  // static/, and the flattened carousel markup renders every slide at once
  // rather than one at a time. Without lazy loading a single archive page
  // eagerly downloads all of them (~21 MB on society-of-grownups-website).
  const src = toArchiveImagePath(legacyPath);
  return `<img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`;
}

function iframeToLink(_match: string, src: string, title: string): string {
  const label = title ? `View ${title}` : 'View presentation';
  return `<p><a href="${escapeHtml(src)}">${escapeHtml(label)}</a></p>`;
}

function transformLegacyArchiveMarkdown(raw: string): string {
  let transformed = stripFrontmatter(raw)
    .replace(IMAGE_SHORTCODE_PATTERN, imageShortcodeToHtml)
    .replace(IFRAME_PATTERN, iframeToLink)
    .replace(EMPTY_TABLE_HEADER_PATTERN, EMPTY_TABLE_HEADER_REPLACEMENT)
    .replace(BUTTON_PATTERN, '');

  for (const { pattern, replacement } of LEGACY_ICON_REPLACEMENTS) {
    transformed = transformed.replace(pattern, replacement);
  }

  return transformed;
}

const archiveEntries = new Map<string, ArchiveCaseStudy>();

for (const [path, raw] of Object.entries(rawArchiveModules)) {
  const slug = path.replace('./archive/', '').replace(/\.md$/, '');
  const metadata = archiveMetadata[slug];

  if (!metadata) {
    throw new Error(`Missing archive metadata for "${slug}".`);
  }

  const html = marked.parse(transformLegacyArchiveMarkdown(raw)) as string;
  archiveEntries.set(slug, { metadata: { ...metadata, slug }, html });
}

for (const slug of Object.keys(archiveMetadata)) {
  if (!archiveEntries.has(slug)) {
    throw new Error(`Missing archive markdown source for "${slug}".`);
  }
}

export function getArchiveCaseStudy(slug: string): ArchiveCaseStudy | undefined {
  return archiveEntries.get(slug);
}

export function getArchiveCaseStudySlugs(): string[] {
  return [...archiveEntries.keys()].sort();
}
