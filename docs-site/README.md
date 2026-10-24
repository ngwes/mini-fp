# Documentation site

The documentation site is built with [VitePress](https://vitepress.dev) and published on GitHub Pages at
<https://ngwes.github.io/mini-fp/>.

**The repository README is the single source of truth.** Nothing is written here by hand: `scripts/generate-pages.mjs`
splits `../README.md` into one page per `##` section (the generated pages go to `src/`, which is git-ignored), keeps
the anchor ids that GitHub generates so the README links keep working, and builds the sidebar. To change the
documentation, edit the README.

Content that belongs to the README only (such as the link to this site) goes between the
`<!-- docs-site:skip-start -->` and `<!-- docs-site:skip-end -->` markers: it is removed from the site.

## Working on it locally

```bash
cd docs-site
npm ci
npm run dev      # generates the pages and serves the site with hot reload
npm run build    # generates, builds and checks every internal link and anchor of the built site
```

`npm run build` fails when a link points to a page or an anchor that does not exist. The `Docs` workflow runs it for
pull requests that touch the README or this folder, and deploys the site when they land on `main`.
