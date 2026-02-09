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
		},
		{
			type: 'text',
			name: 'author',
			message: 'Author name (optional):',
			initial: ''
		},
		{
			type: 'text',
			name: 'repository',
			message: 'Repository URL (e.g., https://github.com/user/repo) (optional):',
			initial: ''
		}
	]);

	if (!response.name || !response.baseUrl) {
		console.log(chalk.red('\n✖ Creation cancelled'));
		process.exit(1);
	}

	const sourceId = response.name.toLowerCase().replace(/[^a-z0-9]/g, '');
	const className = response.name.replace(/[^a-zA-Z0-9]/g, '') + 'Source';
	const packageName = `@joyboy-parser/source-${sourceId}`;
	const projectDir = join(process.cwd(), `source-${sourceId}`);

	console.log(chalk.cyan(`\n📦 Creating ${packageName}...`));

	// Create project structure
	mkdirSync(join(projectDir, 'src'), { recursive: true });
	mkdirSync(join(projectDir, 'src/_tests_'), { recursive: true });

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

	// Create test file
	const testTemplateFile = join(templateDir, 'src/_tests_/index.test.ts.template');
	let testTemplate = readFileSync(testTemplateFile, 'utf-8');

	// Replace placeholders in test template
	testTemplate = testTemplate
		.replace(/{{SOURCE_NAME}}/g, response.name)
		.replace(/{{SOURCE_ID}}/g, sourceId)
		.replace(/{{SOURCE_CLASS_NAME}}/g, className)
		.replace(/{{BASE_URL}}/g, response.baseUrl);

	// Write test file
	writeFileSync(join(projectDir, 'src/_tests_/index.test.ts'), testTemplate);

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
			'build:demo': 'tsup src/demo.ts --format esm --target es2022 --no-dts',
			dev: 'tsup --watch',
			test: 'vitest',
			clean: 'rm -rf dist',
			'validate-meta': 'node scripts/validate-meta.js',
			'demo': 'pnpm build:demo && node dist/demo.js',
			'gen-hash': 'pnpm build && shasum -a 256 dist/index.js',
			'gen-integrity': 'node scripts/gen-integrity.js'
		},
		keywords: ['joyboy', 'manga', sourceId, 'parser'],
		license: 'MIT',
		dependencies: {
			'@joyboy-parser/core': '^1.1.7',
			'@joyboy-parser/types': '^1.1.5'
		},
		devDependencies: {
			tsup: '^8.0.1',
			typescript: '^5.3.0',
			vitest: '^1.0.0',
			ajv: '^8.12.0',
			'ajv-formats': '^3.0.1'
		},
		peerDependencies: {
			'@joyboy-parser/core': '^1.1.7',
			'@joyboy-parser/types': '^1.1.5'
		}
	};

	writeFileSync(
		join(projectDir, 'package.json'),
		JSON.stringify(packageJson, null, 2)
	);

	// Create a full tsconfig.json (standalone for generated package)
	const tsconfig = {
		compilerOptions: {
			target: 'ES2022',
			module: 'ES2022',
			moduleResolution: 'Node',
			declaration: true,
			declarationMap: false,
			experimentalDecorators: false,
			emitDecoratorMetadata: false,
			esModuleInterop: true,
			skipLibCheck: true,
			forceConsistentCasingInFileNames: true,
			strict: true,
			outDir: 'dist',
			rootDir: 'src'
		},
		include: ['src/**/*'],
		exclude: ['node_modules', 'dist']
	};

	writeFileSync(join(projectDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

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
	external: ['@joyboy-parser/core', '@joyboy-parser/types']
});
`;

	writeFileSync(join(projectDir, 'tsup.config.ts'), tsupConfig);

	// Create README.md (includes push/publish note)
	const readme = `# ${packageName}

${response.description || `${response.name} parser for the JoyBoy ecosystem.`}

## Installation

\`\`\`bash
npm install ${packageName}
\`\`\`

## Usage

\`\`\`typescript

const source = new ${packageName}();

const results = await source.search('query');
const manga = await source.getMangaDetails(results[0].id);
const chapters = await source.getChapters(manga.id);
const pages = await source.getChapterPages(chapters[0].id);
\`\`\`

## Development

1. Implement the parser methods in \`src/index.ts\`
2. Test: \`pnpm test\`
3. Build: \`pnpm build\`

## Publishing / Registry

When publishing or submitting your source to a registry, make sure to include the compiled \`dist\` folder and its contents (JS files and type declarations). The registry expects the distributable files under the package's \`dist\` folder so they can be loaded by the runtime.

## additional
- generate integrity sha256

pnpm gen-hash


all downlaods links are to be made available via jsdeliver or github rawcontent




Additionally, this template generates a \`source-meta.json\` file containing registry-friendly metadata. Ensure you review and update the generated \`source-meta.json\` before submitting; you can validate it with \`pnpm run validate-meta\`.

## License

MIT
`;

	writeFileSync(join(projectDir, 'README.md'), readme);

	// Create a demo file (src/demo.ts) to help developers try the parser locally
	const demoTs = `import ${className} from './index';

async function run() {
  const source = new ${className}();

  const searchTerm = "one piece"
  console.log('Source id:', source.id);
  try {
    const results = await source.search(searchTerm);
    console.log('Search results (sample):', results.slice(0, 3));
  } catch (err) {
    const error = err as Error;
    console.error('Demo search failed (this is expected until you implement methods):', error.message || error);
  }
}

run().catch(console.error);
`;

	writeFileSync(join(projectDir, 'src/demo.ts'), demoTs);	// Create a source-meta.json file with templated registry metadata
	const sourceMeta = {
		id: sourceId,
		name: response.name,
		version: '1.0.0',
		baseUrl: response.baseUrl,
		description: response.description || `${response.name} parser for JoyBoy`,
		icon: '',
		author: response.author || '',
		repository: response.repository || '',
		downloads: {
			stable: '',
			latest: '',
			versions: {}
		},
		integrity: {
			sha256: 'CHANGE_ME_SHA256'
		},
		metadata: {
			languages: ['en'],
			official: false,
			nsfw: false,
			tags: [],
			lastUpdated: new Date().toISOString(),
			minCoreVersion: '1.0.0',
			maxCoreVersion: '2.0.0',
			websiteUrl: '',
			supportUrl: ''
		},
		legal: {
			disclaimer: '',
			sourceType: 'scraper',
			requiresAuth: false
		},
		changelog: [
			{ version: '1.0.0', date: new Date().toISOString(), changes: ['Initial template'], breaking: false }
		],
		statistics: { downloads: 0, stars: 0, rating: 0, activeUsers: 0 },
		capabilities: {
			supportsSearch: true,
			supportsTrending: false,
			supportsLatest: false,
			supportsFilters: false,
			supportsPopular: false,
			supportsAuth: false,
			supportsDownload: false,
			supportsBookmarks: false
		}
	};

	writeFileSync(join(projectDir, 'source-meta.json'), JSON.stringify(sourceMeta, null, 2));

	// Create a simple metadata validator script at scripts/validate-meta.js
	const validateScript = `#!/usr/bin/env node
import fs from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// JSON Schema for RegistrySource
const schema = {
  type: 'object',
  required: ['id', 'name', 'version', 'baseUrl', 'description', 'icon', 'author', 'repository', 'downloads', 'integrity', 'metadata', 'legal', 'changelog', 'statistics', 'capabilities'],
  properties: {
    id: { type: 'string', pattern: '^[a-z0-9-]+$' },
    name: { type: 'string', minLength: 1 },
    version: { type: 'string', pattern: '^\\\\d+\\\\.\\\\d+\\\\.\\\\d+' },
    baseUrl: { type: 'string', format: 'uri' },
    description: { type: 'string' },
    icon: { type: 'string' },
    author: { type: 'string' },
    repository: { type: 'string' },
    downloads: {
      type: 'object',
      required: ['stable', 'latest', 'versions'],
      properties: {
        stable: { type: 'string' },
        latest: { type: 'string' },
        versions: { type: 'object' }
      }
    },
    integrity: {
      type: 'object',
      required: ['sha256'],
      properties: {
        sha256: { type: 'string', pattern: '^[a-fA-F0-9]{64}$' },
        sha512: { type: 'string' }
      }
    },
    metadata: {
      type: 'object',
      required: ['languages', 'nsfw', 'official', 'tags', 'lastUpdated', 'minCoreVersion', 'websiteUrl', 'supportUrl'],
      properties: {
        languages: { type: 'array', items: { type: 'string' } },
        nsfw: { type: 'boolean' },
        official: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' } },
        lastUpdated: { type: 'string' },
        minCoreVersion: { type: 'string' },
        maxCoreVersion: { type: 'string' },
        websiteUrl: { type: 'string' },
        supportUrl: { type: 'string' }
      }
    },
    legal: {
      type: 'object',
      required: ['disclaimer', 'sourceType', 'requiresAuth'],
      properties: {
        disclaimer: { type: 'string' },
        sourceType: { type: 'string', enum: ['api', 'scraper', 'hybrid'] },
        requiresAuth: { type: 'boolean' },
        termsOfServiceUrl: { type: 'string' }
      }
    },
    changelog: {
      type: 'array',
      items: {
        type: 'object',
        required: ['version', 'date', 'changes', 'breaking'],
        properties: {
          version: { type: 'string' },
          date: { type: 'string' },
          changes: { type: 'array', items: { type: 'string' } },
          breaking: { type: 'boolean' }
        }
      }
    },
    statistics: {
      type: 'object',
      required: ['downloads', 'stars', 'rating', 'activeUsers'],
      properties: {
        downloads: { type: 'number' },
        stars: { type: 'number' },
        rating: { type: 'number' },
        activeUsers: { type: 'number' }
      }
    },
    capabilities: {
      type: 'object',
      required: ['supportsSearch', 'supportsTrending', 'supportsLatest', 'supportsFilters', 'supportsPopular', 'supportsAuth', 'supportsDownload', 'supportsBookmarks'],
      properties: {
        supportsSearch: { type: 'boolean' },
        supportsTrending: { type: 'boolean' },
        supportsLatest: { type: 'boolean' },
        supportsFilters: { type: 'boolean' },
        supportsPopular: { type: 'boolean' },
        supportsAuth: { type: 'boolean' },
        supportsDownload: { type: 'boolean' },
        supportsBookmarks: { type: 'boolean' }
      }
    }
  }
};

const validate = ajv.compile(schema);

const file = join(process.cwd(), 'source-meta.json');
if (!fs.existsSync(file)) {
  console.error('\\u274C source-meta.json not found in project root');
  process.exit(1);
}

const raw = fs.readFileSync(file, 'utf-8');
let meta;
try {
  meta = JSON.parse(raw);
} catch (e) {
  console.error('\\u274C Invalid JSON:', e.message);
  process.exit(1);
}

const valid = validate(meta);
if (!valid) {
  console.error('\\u274C source-meta.json validation failed:');
  for (const err of validate.errors) {
    console.error('  -', err.instancePath || '/', err.message);
  }
  process.exit(1);
}

// Additional warnings
if (meta.integrity.sha256 === 'CHANGE_ME_SHA256') {
  console.warn('\\u26A0\\uFE0F  Warning: integrity.sha256 is still set to placeholder CHANGE_ME_SHA256');
}

if (!meta.author) {
  console.warn('\\u26A0\\uFE0F  Warning: author field is empty');
}

if (!meta.repository) {
  console.warn('\\u26A0\\uFE0F  Warning: repository field is empty');
}

console.log('\\u2705 source-meta.json is valid!');
`;

	// Create integrity generation script
	const integrityScript = `#!/usr/bin/env node
/**
 * Generate SHA-256 integrity hash for the source package
 * Updates both source-meta.json and integrity.json
 * 
 * Usage: pnpm gen-integrity (or node scripts/gen-integrity.js)
 */

import fs from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const distFile = join(process.cwd(), 'dist/index.js');
const sourceMetaFile = join(process.cwd(), 'source-meta.json');
const integrityFile = join(process.cwd(), 'integrity.json');

if (!fs.existsSync(distFile)) {
  console.error('❌ dist/index.js not found. Please run build first:');
  console.error('   pnpm build');
  process.exit(1);
}

const buffer = fs.readFileSync(distFile);
const hash = createHash('sha256').update(buffer).digest('hex');

console.log('\\n📦 SHA-256 Hash:', hash, '\\n');

// Update source-meta.json if it exists
if (fs.existsSync(sourceMetaFile)) {
  try {
    const meta = JSON.parse(fs.readFileSync(sourceMetaFile, 'utf-8'));
    if (!meta.integrity) {
      meta.integrity = {};
    }
    meta.integrity.sha256 = hash;
    fs.writeFileSync(sourceMetaFile, JSON.stringify(meta, null, 2) + '\\n');
    console.log('✅ Updated source-meta.json');
  } catch (error) {
    console.error('❌ Failed to update source-meta.json:', error.message);
  }
}

// Create/update integrity.json
const integrityContent = {
  integrity: {
    sha256: hash
  },
  generatedAt: new Date().toISOString(),
  sourceFile: 'dist/index.js'
};

fs.writeFileSync(integrityFile, JSON.stringify(integrityContent, null, 2) + '\\n');
console.log('✅ Updated integrity.json');

console.log('\\n✅ Integrity hash generated successfully!');
console.log('   Hash:', hash);
`;

	mkdirSync(join(projectDir, 'scripts'), { recursive: true });
	writeFileSync(join(projectDir, 'scripts/validate-meta.js'), validateScript);
	writeFileSync(join(projectDir, 'scripts/gen-integrity.js'), integrityScript);

	// Create LICENSE and CONTRIBUTING.md
	const license = `MIT License

Copyright (c) ${new Date().getFullYear()} ${response.name}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

	writeFileSync(join(projectDir, 'LICENSE'), license);

	const contributing = `# Contributing

Thank you for contributing! Please follow these steps:

1. Implement parser logic in \`src/index.ts\`.
2. Run tests: \`pnpm test\`.
3. Build: \`pnpm build\` and verify \`dist\` contains compiled files and types.
4. Update \`source-meta.json\` with correct metadata and integrity hashes.
5. Validate metadata: \`pnpm run validate-meta\`.
`;

	writeFileSync(join(projectDir, 'CONTRIBUTING.md'), contributing);

	console.log(chalk.green('\n✓ Source created successfully!\n'));
	console.log(chalk.cyan('Next steps:'));
	console.log(`  cd source-${sourceId}`);
	console.log(`  pnpm install`);
	console.log(`  # Edit src/index.ts to implement your parser`);
	console.log(`  pnpm build\n`);
}

create().catch(console.error);

