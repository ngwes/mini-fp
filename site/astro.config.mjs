// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import { base } from './site.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://ngwes.github.io',
	base,
	integrations: [
		starlight({
			title: 'mini-fp',
			description:
				'A minimal TypeScript functional programming library: Option, Either, Try, Validate and their async variants, with zero dependencies.',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/ngwes/mini-fp' },
				{ icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/@ngwes/mini-fp' },
			],
			// Fails the build on a broken page or anchor link. It only checks absolute links (with the
			// `base`), which is what the sync script generates.
			plugins: [starlightLinksValidator()],
			sidebar: [
				{ label: 'Start here', slug: 'index' },
				{ label: 'Documentation', items: [{ autogenerate: { directory: 'guide' } }] },
			],
		}),
	],
});
