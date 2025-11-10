#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import prompts from 'prompts';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function create() {
	console.log(chalk.blue.bold('\n🎉 Create JoyBoy Source Parser\n'));

	const response = await prompts([
		{
			type: 'text',
			name: 'name',
			message: 'Source name (e.g., MangaKakalot):',
			validate: value => value.length > 0 || 'Name is required'
		},
		{
			type: 'text',
			name: 'baseUrl',
			message: 'Base URL (e.g., https://mangakakalot.com):',
			validate: value => {
				try {
					new URL(value);
					return true;
				} catch {
					return 'Please enter a valid URL';
				}
			}
		},
		{
			type: 'text',
			name: 'description',
			message: 'Description (optional):',
			initial: ''
		}
	]);

	if (!response.name || !response.baseUrl) {
		console.log(chalk.red('\n✖ Creation cancelled'));
		process.exit(1);
	}

	const sourceId = response.name.toLowerCase().replace(/[^a-z0-9]/g, '');
	const className = response.name.replace(/[^a-zA-Z0-9]/g, '') + 'Source';
	const packageName = `@joyboy/source-${sourceId}`;
	const projectDir = join(process.cwd(), `source-${sourceId}`);

	console.log(chalk.cyan(`\n📦 Creating ${packageName}...`));

	// Create project structure
	mkdirSync(join(projectDir, 'src'), { recursive: true });

	// Copy template
	const templateDir = join(__dirname, '../template');
	const templateFile = join(templateDir, 'src/index.ts.template');
	let template = readFileSync(templateFile, 'utf-8');

	// Replace placeholders
	template = template
		.replace(/{{SOURCE_NAME}}/g, response.name)
		.replace(/{{SOURCE_ID}}/g, sourceId)
		.replace(/{{SOURCE_CLASS_NAME}}/g, className)
		.replace(/{{BASE_URL}}/g, response.baseUrl);

	// Write source file
	writeFileSync(join(projectDir, 'src/index.ts'), template);

	// Create package.json
	const packageJson = {
		name: packageName,
		version: '1.0.0',
		type: 'module',
		description: response.description || `${response.name} parser for JoyBoy`,
		main: './dist/index.js',
		module: './dist/index.js',
		types: './dist/index.d.ts',
		exports: {
			'.': {
				types: './dist/index.d.ts',
				import: './dist/index.js',
				default: './dist/index.js'
			}
		},
		files: ['dist'],
		scripts: {
			build: 'tsup',
			dev: 'tsup --watch',
			test: 'vitest',
			clean: 'rm -rf dist'
		},
		keywords: ['joyboy', 'manga', sourceId, 'parser'],
		license: 'MIT',
		dependencies: {
			'@joyboy/core': '^1.0.0',
			'@joyboy/types': '^1.0.0'
		},
		devDependencies: {
			tsup: '^8.0.1',
			typescript: '^5.3.0',
			vitest: '^1.0.0'
		},
		peerDependencies: {
			'@joyboy/core': '^1.0.0',
			'@joyboy/types': '^1.0.0'
		}
	};

	writeFileSync(
		join(projectDir, 'package.json'),
		JSON.stringify(packageJson, null, 2)
	);

	// Create tsconfig.json
	const tsconfig = {
		extends: '../../tsconfig.base.json',
		compilerOptions: {
			outDir: 'dist',
			rootDir: 'src'
		},
		include: ['src/**/*']
	};

	writeFileSync(
		join(projectDir, 'tsconfig.json'),
		JSON.stringify(tsconfig, null, 2)
	);

	// Create tsup.config.ts
	const tsupConfig = `import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	dts: true,
	clean: true,
	sourcemap: true,
	treeshake: true,
	splitting: false,
	target: 'es2022',
	platform: 'neutral',
	external: ['@joyboy/core', '@joyboy/types']
});
`;

	writeFileSync(join(projectDir, 'tsup.config.ts'), tsupConfig);

	// Create README.md
	const readme = `# ${packageName}

${response.description || `${response.name} parser for the JoyBoy ecosystem.`}

## Installation

\`\`\`bash
npm install ${packageName}
\`\`\`

## Usage

\`\`\`typescript
import { JoyBoy } from '@joyboy/core';

await JoyBoy.loadSource('${packageName}');
const source = JoyBoy.getSource('${sourceId}');

const results = await source.search('query');
const manga = await source.getMangaDetails(results[0].id);
const chapters = await source.getChapters(manga.id);
const pages = await source.getChapterPages(chapters[0].id);
\`\`\`

## Development

1. Implement the parser methods in \`src/index.ts\`
2. Test: \`pnpm test\`
3. Build: \`pnpm build\`

## License

MIT
`;

	writeFileSync(join(projectDir, 'README.md'), readme);

	console.log(chalk.green('\n✓ Source created successfully!\n'));
	console.log(chalk.cyan('Next steps:'));
	console.log(`  cd source-${sourceId}`);
	console.log(`  pnpm install`);
	console.log(`  # Edit src/index.ts to implement your parser`);
	console.log(`  pnpm build\n`);
}

create().catch(console.error);

