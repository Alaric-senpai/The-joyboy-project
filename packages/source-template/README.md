# @joyboy-parser/source-template

CLI tool and template for creating new JoyBoy source parsers. Quickly scaffold a production-ready parser with complete boilerplate, validation, and testing tools.

## Features

✨ **Complete Source Template** - All BaseSource abstract methods implemented  
🔍 **Metadata Validation** - JSON Schema validator with AJV  
🧪 **Demo Testing** - Built-in demo file for rapid local testing  
📦 **Registry Ready** - Generated metadata matches RegistrySource schema  
📝 **Full Documentation** - README, LICENSE, CONTRIBUTING.md included  
⚡ **Fast Build** - tsup configuration for ESM bundling  

## Quick Start

```bash
cd packages/source-template
node scripts/create.js
```

You'll be prompted for:
- **Source name** (e.g., "MangaDex", "MangaKakalot")
- **Base URL** (e.g., "https://mangadex.org")
- **Description** (optional)
- **Author name** (defaults to git user.name)
- **Repository URL** (optional, e.g., "https://github.com/user/source-mangadex")

## Generated Project Structure

```
source-<name>/
├── src/
│   ├── index.ts          # Main source implementation (all BaseSource methods)
│   └── demo.ts           # Demo/testing file with TypeScript-safe error handling
├── scripts/
│   └── validate-meta.js  # AJV-based JSON Schema metadata validator
├── dist/                 # Built files (generated after build)
│   ├── index.js          # ESM bundle
│   ├── index.js.map      # Source map
│   └── index.d.ts        # TypeScript declarations
├── source-meta.json      # Registry metadata (RegistrySource schema)
├── package.json          # With all scripts (build, demo, validate-meta, etc.)
├── tsconfig.json         # Full standalone config (ES2022, strict mode)
├── tsup.config.ts        # Build configuration
├── LICENSE               # MIT license
├── CONTRIBUTING.md       # Contribution guidelines
└── README.md             # Complete documentation with publishing workflow
```

## Development Workflow

### 1. Install Dependencies

```bash
cd source-<name>
npm install  # or pnpm install
```

### 2. Implement Parser Methods

Edit `src/index.ts` - all 7 BaseSource methods are included with stubs:

```typescript
// ✅ Already included in template
async search(query: string, options?: SearchOptions): Promise<Manga[]>
async getMangaDetails(id: string): Promise<Manga>
async getChapters(mangaId: string): Promise<Chapter[]>
async getChapterPages(chapterId: string): Promise<Page[]>
async getbyPage(page: number): Promise<Manga[]>
async listAll(): Promise<Manga[]>
extractPaginationInfo(html: string): PaginationBase
```

Each method includes:
- ✅ Proper type signatures
- ✅ Inline documentation
- ✅ Usage examples
- ✅ TODO markers

### 3. Test Locally

```bash
# Build the source
npm run build

# Run demo (builds and executes demo.ts)
npm run demo
```

**Expected output:**
```
Source id: <your-source-id>
Demo search failed (this is expected until you implement methods): Search not implemented
```

### 4. Update Metadata

Edit `source-meta.json` and replace placeholders:

```json
{
  "id": "your-source",
  "icon": "https://example.com/icon.png",  // ← Update
  "author": "Your Name",                    // ← Update
  "repository": "https://github.com/...",   // ← Update
  "integrity": {
    "sha256": "CHANGE_ME_SHA256"            // ← Calculate after build
  },
  // ... more fields
}
```

### 5. Validate Metadata

```bash
npm run validate-meta
```

**Success:**
```
✅ source-meta.json is valid!
```

**Failure example:**
```
❌ source-meta.json validation failed:
  - /integrity/sha256 must match pattern "^[a-fA-F0-9]{64}$"
```

### 6. Calculate Integrity Hash

After building, calculate SHA-256 of `dist/index.js`:

```bash
# macOS/Linux
shasum -a 256 dist/index.js

# Or use Node.js
node -e "const fs=require('fs'),crypto=require('crypto');console.log(crypto.createHash('sha256').update(fs.readFileSync('dist/index.js')).digest('hex'))"
```

Copy the hash to `source-meta.json` → `integrity.sha256`

### 7. Build for Production

```bash
npm run clean
npm run build
```

**Verify `dist/` contains:**
- ✅ `index.js` (1-2 KB) - Runtime code
- ✅ `index.d.ts` - Type definitions  
- ✅ `index.js.map` - Source maps

## Publishing to Registry

### Prerequisites Checklist

- ✅ All methods implemented and tested
- ✅ `source-meta.json` fully populated (no placeholders)
- ✅ Metadata validation passes (`npm run validate-meta`)
- ✅ `dist/` folder built successfully
- ✅ SHA-256 hash calculated and set
- ✅ Demo runs without errors

### Important: Include dist/ Folder

When submitting to the registry, **you must include the compiled `dist/` folder**. The registry needs:
- `dist/index.js` - Runtime code for loading
- `dist/index.d.ts` - Type definitions for TypeScript users

### Submission Steps

1. Upload your built source to a CDN (jsDelivr, unpkg, GitHub Pages, etc.)
2. Update `downloads.stable` and `downloads.latest` URLs in `source-meta.json`
3. Ensure integrity hash matches your built file
4. Submit `source-meta.json` to the registry repository
5. Registry will validate and index your source

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **build** | `npm run build` | Build production bundle to dist/ |
| **build:demo** | `npm run build:demo` | Build demo file only (faster, no .d.ts) |
| **demo** | `npm run demo` | Build and run demo script |
| **dev** | `npm run dev` | Build in watch mode for development |
| **test** | `npm run test` | Run unit tests with Vitest |
| **validate-meta** | `npm run validate-meta` | Validate source-meta.json against schema |
| **clean** | `npm run clean` | Remove dist/ folder |

## Template Features

### Complete BaseSource Implementation

The generated `src/index.ts` includes all abstract methods:

```typescript
import { BaseSource } from '@joyboy-parser/core';
import type { Manga, Chapter, Page, SearchOptions, PaginationBase } from '@joyboy-parser/types';

export default class YourSource extends BaseSource {
  id = 'your-source';
  name = 'YourSource';
  version = '1.0.1';
  baseUrl = 'https://example.com';
  
  // ✅ All 7 abstract methods included with implementation guides
  
  async search(query: string, options?: SearchOptions): Promise<Manga[]> {
    // TODO: Implement search logic
    // Example: Fetch search results page and parse manga list
    throw this.createError('Search not implemented', 'NOT_IMPLEMENTED');
  }
  
  async getMangaDetails(id: string): Promise<Manga> {
    // TODO: Fetch and parse manga details page
    throw this.createError('getMangaDetails not implemented', 'NOT_IMPLEMENTED');
  }
  
  async getChapters(mangaId: string): Promise<Chapter[]> {
    // TODO: Fetch and parse chapter list
    throw this.createError('getChapters not implemented', 'NOT_IMPLEMENTED');
  }
  
  async getChapterPages(chapterId: string): Promise<Page[]> {
    // TODO: Fetch and parse chapter pages/images
    throw this.createError('getChapterPages not implemented', 'NOT_IMPLEMENTED');
  }
  
  async getbyPage(page: number): Promise<Manga[]> {
    // TODO: Fetch paginated manga list
    throw this.createError('getbyPage not implemented', 'NOT_IMPLEMENTED');
  }
  
  async listAll(): Promise<Manga[]> {
    // TODO: Fetch all available manga
    throw this.createError('listAll not implemented', 'NOT_IMPLEMENTED');
  }
  
  extractPaginationInfo(html: string): PaginationBase {
    // TODO: Extract pagination information from HTML
    return {  totalPages: 1 };
  }
  
  // ✅ Helper method included
  private parseHtml(html: string) {
    return this.transformToHtml(html);
  }
}
```

### Metadata Validation

The `scripts/validate-meta.js` uses AJV to validate against the complete RegistrySource schema:

**Validates:**
- ✅ All 15 required top-level fields
- ✅ Pattern matching (id, version, SHA256 hash format)
- ✅ Format validation (URIs, ISO dates)
- ✅ Enum validation (sourceType: "scraper" | "api")
- ✅ Nested object structures (downloads, metadata, legal, etc.)

**Example validation:**
```bash
$ npm run validate-meta

❌ source-meta.json validation failed:
  - /integrity/sha256 must match pattern "^[a-fA-F0-9]{64}$"
  - /metadata/websiteUrl must be string
  - /legal/sourceType must be equal to one of the allowed values
```

### Demo File

The `src/demo.ts` provides TypeScript-safe testing:

```typescript
import yourSource from './index';

async function run() {
  const source = new yourSource();
  console.log('Source id:', source.id);
  
  try {
    const results = await source.search('test');
    console.log('Search results (sample):', results.slice(0, 3));
  } catch (err) {
    const error = err as Error;  // ✅ TypeScript-safe
    console.error('Demo search failed:', error.message || error);
  }
}

run().catch(console.error);
```

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Validation Errors

Check `source-meta.json` against error messages:
- Ensure all required fields are present
- Verify SHA-256 is exactly 64 hex characters (a-f, 0-9)
- Confirm all URLs are valid and accessible
- Check `sourceType` is either "scraper" or "api"

### Demo Not Working

```bash
# Rebuild demo
npm run build:demo
node dist/demo.js
```

If getting module errors, ensure dependencies are installed:
```bash
npm install
```

## Tips & Best Practices

- 🔍 **Incremental Development**: Implement and test one method at a time
- 🧪 **Use Demo Script**: Run `npm run demo` frequently during development
- 📝 **Update Metadata Early**: Fill in `source-meta.json` as you progress
- ✅ **Validate Often**: Run `npm run validate-meta` before submitting
- 🎯 **Follow Patterns**: Use helper methods like `this.fetchHtml()`, `this.parseHtml()`
- ⚡ **Enable Capabilities**: Update capability flags as you implement features
- 🔒 **Handle Errors**: Use `this.createError()` for consistent error handling

## Examples

See the generated template files for:
- Complete method signatures and types
- HTML parsing examples with transformToHtml
- Error creation patterns
- URL construction helpers
- Pagination extraction logic

## Additional Resources

- 📘 **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** - Detailed step-by-step usage guide
- 🔧 **[GENERATOR_IMPROVEMENTS.md](./GENERATOR_IMPROVEMENTS.md)** - Technical implementation details
- ✅ **[VERIFICATION_REPORT.md](./VERIFICATION_REPORT.md)** - Test results and validation
- 📚 **[@joyboy-parser/core](../core/README.md)** - Core API reference
- 📦 **[@joyboy-parser/types](../types/README.md)** - Type definitions
- 🗂️ **[@joyboy-parser/source-registry](../source-registry/README.md)** - Registry documentation

## Support

For issues or questions:
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Alaric-senpai/The-joyboy-project/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Alaric-senpai/The-joyboy-project/discussions)
- 📖 **Documentation**: [Project README](../../README.md)

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./template/CONTRIBUTING.md) for guidelines.

## License

MIT © [Alaric-senpai](https://devcharles.me)

---

**Generated sources are production-ready with:**
- ✅ Complete BaseSource implementation
- ✅ JSON Schema validation
- ✅ Demo testing capabilities
- ✅ Registry-compatible metadata
- ✅ Full documentation
- ✅ TypeScript support
