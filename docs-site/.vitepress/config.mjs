import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitepress';
import { base, npmPackage, repo } from '../site.mjs';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const sidebar = JSON.parse(readFileSync(new URL('./sidebar.generated.json', import.meta.url), 'utf8'));

export default defineConfig({
  title: 'mini-fp',
  description: pkg.description,
  base,
  srcDir: 'src',
  cleanUrls: true,
  markdown: {
    config(md) {
      // The README writes generics such as Option<T> in plain text: never read them as HTML
      md.set({ html: false });
    },
  },
  themeConfig: {
    nav: [
      { text: 'npm', link: npmPackage },
      { text: 'Agent skills', link: 'https://github.com/ngwes/mini-fp-skills' },
    ],
    sidebar: [{ text: 'Documentation', items: sidebar }],
    outline: [2, 3],
    search: { provider: 'local' },
    // The pages are generated, so every page points to the README that they come from
    editLink: {
      pattern: `${repo}/edit/main/README.md`,
      text: 'Edit the README on GitHub',
    },
    socialLinks: [{ icon: 'github', link: repo }],
    footer: { message: 'Generated from the README of the repository.' },
  },
});
