// Fails the build when a link inside the generated site points to a page or an anchor that does not exist.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { base } from '../site.mjs';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', '.vitepress', 'dist');

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return path.endsWith('.html') ? [path] : [];
  });

const pages = new Map(); // site path -> set of ids
for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  const sitePath = `/${relative(dist, file).replace(/\\/g, '/')}`.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
  pages.set(sitePath || '/', new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])));
}

const problems = [];
for (const file of htmlFiles(dist)) {
  const from = `/${relative(dist, file).replace(/\\/g, '/')}`;
  const html = readFileSync(file, 'utf8');
  for (const [, href] of html.matchAll(/<a [^>]*href="([^"]+)"/g)) {
    if (!href.startsWith(base) && !href.startsWith('#')) continue; // external link or asset
    const [pathPart, hash] = href.split('#');
    const target = pathPart.startsWith(base) ? `/${pathPart.slice(base.length)}`.replace(/\/$/, '') || '/' : null;
    if (target && /\.[a-z0-9]+$/i.test(target)) continue; // asset
    const ids = target ? pages.get(target) : pages.get(from.replace(/\.html$/, '').replace(/\/index$/, '') || '/');
    if (!ids) problems.push(`${from}: link to a missing page ${href}`);
    else if (hash && !ids.has(hash)) problems.push(`${from}: link to a missing anchor ${href}`);
  }
}

if (!existsSync(dist) || pages.size === 0) throw new Error('No built pages found: run vitepress build first');
if (problems.length) {
  console.error(`${problems.length} broken link(s):\n${[...new Set(problems)].join('\n')}`);
  process.exit(1);
}
console.log(`checked links in ${pages.size} pages: no broken page or anchor links`);
