# Source Template Generator - Quick Start

## Creating a New Source

```bash
cd packages/source-template
node scripts/create.js
```

You'll be prompted for:
- Source name (e.g., "MangaDex", "MangaKakalot")
- Base URL (e.g., "https://mangadex.org")
- Description (optional)
- Author name (defaults to git user.name)
- Repository URL (optional, e.g., "https://github.com/user/source-mangadex")

## Generated Project Structure

```
source-<name>/
├── src/
│   ├── index.ts          # Main source implementation
│   └── demo.ts           # Demo/testing file
├── scripts/
│   └── validate-meta.js  # Metadata validator
├── dist/                 # Built files (after build)
├── source-meta.json      # Registry metadata
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

## Development Workflow

### 1. Install Dependencies
```bash
cd source-<name>
pnpm install
```

### 2. Implement Parser Methods

Edit `src/index.ts` and implement the required methods:
- `search(query)` - Search for manga
- `getMangaDetails(id)` - Get manga details  
- `getChapters(mangaId)` - Get chapter list
- `getChapterPages(chapterId)` - Get page images
- `getbyPage(label, page)` - Paginated search
- `listAll(options)` - List all manga
- `extractPaginationInfo(url)` - Extract pagination

Each method has inline comments with examples.

### 3. Test Locally

```bash
# Build the source
pnpm build

# Run demo (builds and executes demo.ts)
pnpm run demo
```

The demo will show:
```
Source id: <your-source-id>
Demo search failed (this is expected until you implement methods): Search not implemented
```

### 4. Update Metadata

Edit `source-meta.json` and update:
- `icon` - URL to source logo
- `author` - Your name/organization
- `repository` - GitHub repo URL
- `downloads.stable` - CDN URL for stable build
- `downloads.latest` - CDN URL for latest build
- `integrity.sha256` - SHA-256 hash of dist/index.js
- `metadata.languages` - Supported language codes
- `metadata.tags` - Categorization tags
- `metadata.websiteUrl` - Source website
- `metadata.supportUrl` - Support/issues URL
- `legal.disclaimer` - Legal disclaimer text

### 5. Validate Metadata

```bash
pnpm run validate-meta
```

Success:
```
✅ source-meta.json is valid!
```

Failure example:
```
❌ source-meta.json validation failed:
  - /integrity/sha256 must match pattern "^[a-fA-F0-9]{64}$"
  - /metadata/websiteUrl must be string
```

### 6. Calculate Integrity Hash

After building, calculate SHA-256 of your dist/index.js:

```bash
# macOS/Linux
shasum -a 256 dist/index.js

# Or use Node.js
node -e "const fs=require('fs'),crypto=require('crypto');console.log(crypto.createHash('sha256').update(fs.readFileSync('dist/index.js')).digest('hex'))"
```

Copy the hash to `source-meta.json` → `integrity.sha256`

### 7. Build for Production

```bash
pnpm clean
pnpm build
```

Verify `dist/` contains:
- `index.js` - Main source code
- `index.js.map` - Source map
- `index.d.ts` - TypeScript definitions

## Publishing to Registry

### Prerequisites
1. ✅ All methods implemented and tested
2. ✅ `source-meta.json` fully populated
3. ✅ Metadata validation passes
4. ✅ `dist/` folder built and contains all files
5. ✅ SHA-256 hash calculated and set

### Important
When submitting to the registry, **include the compiled `dist/` folder**. The registry needs:
- `dist/index.js` - Runtime code
- `dist/index.d.ts` - Type definitions

### Submission
1. Upload your built source to a CDN (jsDelivr, unpkg, etc.)
2. Update `downloads.stable` and `downloads.latest` URLs in source-meta.json
3. Submit `source-meta.json` to the registry repository
4. The registry will validate and index your source

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build source to dist/ |
| `pnpm build:demo` | Build demo file only |
| `pnpm dev` | Build in watch mode |
| `pnpm demo` | Build and run demo |
| `pnpm test` | Run unit tests |
| `pnpm validate-meta` | Validate source-meta.json |
| `pnpm clean` | Remove dist/ folder |

## Example Implementation

See generated `src/index.ts` for:
- Method signatures
- Type imports
- Helper method usage
- Error creation patterns
- HTML parsing examples

## Troubleshooting

### Build Errors
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Validation Errors
- Check `source-meta.json` against error messages
- Ensure all required fields are present
- Verify SHA-256 is exactly 64 hex characters
- Confirm URLs are valid and accessible

### Demo Not Working
```bash
# Rebuild demo
pnpm build:demo
node dist/demo.js
```

## Tips

- Use `@ts-nocheck` at top of file during early development
- Test with real website data incrementally
- Use `this.fetchHtml()` for fetching HTML
- Use `this.parseHtml()` helper for parsing
- Use `this.createError()` for consistent errors
- Use `this.buildUrl()` for URL construction
- Enable capabilities flags as you implement features

## Support

For help with:
- Template issues: Check GENERATOR_IMPROVEMENTS.md
- Core API: See @joyboy-parser/core documentation
- Types: See @joyboy-parser/types documentation
- Registry: See packages/source-registry/README.md
