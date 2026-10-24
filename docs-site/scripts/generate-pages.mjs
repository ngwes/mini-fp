// Builds the VitePress source pages from the repository README, which stays the single source of truth.
//
// - every `##` section of the README becomes a page and a sidebar entry
// - headings keep the anchor ids GitHub generates, so the README's own links keep working
// - links to `#anchors` are rewritten to point to the page that holds the heading
// - the table of contents is dropped (the sidebar replaces it)
// - anything between the docs-site skip markers is removed (README-only content)
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import GithubSlugger from 'github-slugger';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const readmePath = join(siteRoot, '..', 'README.md');
const srcDir = join(siteRoot, 'src');
const sidebarPath = join(siteRoot, '.vitepress', 'sidebar.generated.json');

const SKIP_START = '<!-- docs-site:skip-start -->';
const SKIP_END = '<!-- docs-site:skip-end -->';
const DROPPED_SECTIONS = new Set(['table of contents']);

const escapeHtml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// What GitHub renders for a heading, which is what its anchor id is computed from
const headingText = (raw) =>
  raw
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\\(.)/g, '$1')
    .trim();

const source = readFileSync(readmePath, 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(new RegExp(`${SKIP_START}[\\s\\S]*?${SKIP_END}\\n?`, 'g'), '');

// 1. classify every line, ignoring anything inside a code fence
const slugger = new GithubSlugger();
let inFence = false;
const lines = source.split('\n').map((text) => {
  if (/^\s*(```|~~~)/.test(text)) {
    inFence = !inFence;
    return { text, fence: true };
  }
  if (inFence) return { text, fence: true };
  const heading = text.match(/^(#{1,6})\s+(.+?)\s*$/);
  if (!heading) return { text, fence: false };
  const title = headingText(heading[2]);
  return { text, fence: false, heading: { level: heading[1].length, raw: heading[2], title, slug: slugger.slug(title) } };
});

// 2. split into an index page (everything before the first `##`) and one page per `##` section
const firstSection = lines.findIndex((line) => line.heading?.level === 2);
if (firstSection < 0) throw new Error('The README has no "##" section to build pages from');

const pages = [{ slug: 'index', title: 'Introduction', lines: lines.slice(0, firstSection) }];
for (const line of lines.slice(firstSection)) {
  if (line.heading?.level === 2) {
    pages.push({ slug: line.heading.slug, title: line.heading.title, lines: [] });
  }
  pages[pages.length - 1].lines.push(line);
}
const kept = pages.filter((page) => !DROPPED_SECTIONS.has(page.title.toLowerCase()));

// 3. remember which page holds each anchor, to rewrite the in-page links
const pageOfAnchor = new Map();
for (const page of kept) {
  for (const line of page.lines) if (line.heading) pageOfAnchor.set(line.heading.slug, page);
}

const rewriteLinks = (text, page) =>
  text.replace(/\]\(#([^)\s]+)\)/g, (match, anchor) => {
    const target = pageOfAnchor.get(anchor);
    if (!target) {
      console.warn(`warning: no heading for the link "#${anchor}" (page "${page.title}")`);
      return match;
    }
    if (target === page) return match;
    const isPageTitle = target.slug === anchor;
    return `](/${target.slug === 'index' ? '' : target.slug}${isPageTitle ? '' : `#${anchor}`})`;
  });

const renderLine = (line, page) => {
  if (line.fence) return line.text;
  if (line.heading) {
    const { level, raw, slug } = line.heading;
    // index page keeps its levels; section pages promote `##` to the page title
    const shown = page.slug === 'index' ? level : Math.max(1, level - 1);
    return `${'#'.repeat(shown)} ${raw} {#${slug}}`;
  }
  // `{{` would be read as a Vue interpolation outside code
  return rewriteLinks(line.text, page).replace(/\{\{/g, '&#123;&#123;');
};

const trimRules = (rendered) => {
  const out = rendered.slice();
  while (out.length && /^(---|\s*)$/.test(out[out.length - 1])) out.pop();
  return out;
};

// 4. write the pages and the sidebar
rmSync(srcDir, { recursive: true, force: true });
mkdirSync(srcDir, { recursive: true });

const sidebar = [];
for (const page of kept) {
  let body = trimRules(page.lines.map((line) => renderLine(line, page)));
  if (page.slug === 'index') {
    const sections = kept.filter((other) => other.slug !== 'index');
    body = body.concat(['', '## Documentation', '', ...sections.map((other) => `- [${other.title.replace(/[<>]/g, (c) => `\\${c}`)}](/${other.slug})`)]);
  }
  writeFileSync(join(srcDir, `${page.slug}.md`), `${body.join('\n')}\n`);
  sidebar.push({ text: escapeHtml(page.title), link: page.slug === 'index' ? '/' : `/${page.slug}` });
}
writeFileSync(sidebarPath, `${JSON.stringify(sidebar, null, 2)}\n`);

console.log(`generated ${kept.length} pages from ${readmePath}`);
