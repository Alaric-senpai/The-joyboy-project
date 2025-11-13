# Source Template Generator Improvements

## Overview
Enhanced the JoyBoy source template generator to provide a complete, production-ready scaffolding system for creating new manga source parsers.

## Changes Made

### 1. Template Source File (`template/src/index.ts.template`)
**Added:**
- All required BaseSource abstract methods with clear stubs:
  - `search()` - Search for manga
  - `getMangaDetails()` - Get manga details
  - `getChapters()` - Get chapter list
  - `getChapterPages()` - Get page images
  - `getbyPage()` - Pagination helper
  - `listAll()` - List all manga
  - `extractPaginationInfo()` - Extract pagination metadata
- Added `PaginationBase` import from types
- Protected `parseHtml()` helper method showing how to use `transformToHtml`
- Comprehensive inline documentation and TODO markers
- Example usage patterns in comments

**Why:** Ensures generated sources compile immediately and provide clear implementation guidance.

### 2. Create Script (`scripts/create.js`)
**Enhanced package.json generation:**
- Bumped version from 1.0.0 to **1.0.1**
- Added new scripts:
  - `validate-meta` - Validates source-meta.json
  - `demo` - Runs demo with auto-build
  - `build:demo` - Builds demo file separately
- Added `ajv` and `ajv-formats` to devDependencies for schema validation

**Enhanced tsconfig.json:**
- Replaced `extends` pattern with full standalone config
- Includes all necessary compiler options (ES2022, strict mode, etc.)
- Self-contained for generated packages

**Enhanced README.md:**
- Added "Publishing / Registry" section
- Explains need to include `dist` folder when publishing
- Mentions `source-meta.json` and validation workflow
- Updated development workflow

**New prompts added:**
- Author name (with default from git config or "Unknown")
- Repository URL (optional)

### 3. Generated Files

#### `src/demo.ts`
- Instantiates the source class
- Attempts a test search
- Shows expected error messages for unimplemented methods
- TypeScript-safe error handling

#### `source-meta.json`
- Complete registry metadata template matching `RegistrySource` schema
- Pre-filled fields from prompts (id, name, baseUrl, author, repository)
- Placeholder values clearly marked (e.g., `CHANGE_ME_SHA256`)
- Includes all required sections:
  - downloads, integrity, metadata, legal, changelog, statistics, capabilities

#### `scripts/validate-meta.js`
- Full JSON Schema validation using AJV
- Validates all required fields and types
- Pattern matching for:
  - Source ID (lowercase alphanumeric with hyphens)
  - Version (semver format)
  - Base URL (valid URI)
  - SHA256 (64-character hex)
  - Source type enum (api/scraper/hybrid)
- Detailed error reporting with field paths
- Exits with code 1 on validation failure

#### `LICENSE`
- MIT license template
- Auto-populated with current year and source name

#### `CONTRIBUTING.md`
- Step-by-step contribution guide
- Build and validation workflow
- Clear instructions for metadata updates

## Testing

Created test source `source-dummy`:
```bash
cd packages/source-template
node scripts/create.js
# Answered prompts: dummy, https://dummy.com, dumm (author)
```

**Verification steps performed:**
1. ✅ All files generated correctly
2. ✅ Dependencies installed via pnpm
3. ✅ Validator detects invalid SHA256 placeholder
4. ✅ Source builds successfully (dist folder created)
5. ✅ Demo runs and shows expected "not implemented" error
6. ✅ All generated files are properly formatted

## Usage

### Creating a new source:
```bash
cd packages/source-template
node scripts/create.js
```

### In generated package:
```bash
cd source-<name>

# Install dependencies
pnpm install

# Implement parser in src/index.ts
# Update source-meta.json with real values

# Validate metadata
pnpm run validate-meta

# Build
pnpm build

# Test locally
pnpm run demo
```

### Before publishing to registry:
1. Ensure `dist/` folder exists and contains compiled JS + type definitions
2. Update `source-meta.json`:
   - Fill in download URLs
   - Calculate and set integrity.sha256 hash
   - Add repository, websiteUrl, supportUrl
   - Update author, tags, languages
3. Run `pnpm run validate-meta` to verify
4. Include `dist/` contents when pushing to registry

## Schema Validation Details

The validator checks:
- **Required fields:** All top-level RegistrySource fields present
- **Type validation:** Strings, numbers, booleans, arrays, objects
- **Format validation:**
  - URLs (baseUrl, websiteUrl, supportUrl)
  - Dates (ISO 8601 format in changelog and metadata)
  - Patterns (id, version, sha256)
- **Enum validation:** sourceType must be 'api', 'scraper', or 'hybrid'
- **Nested objects:** All required properties in downloads, integrity, metadata, legal, etc.

## Files Modified

1. `packages/source-template/template/src/index.ts.template` - Full method stubs
2. `packages/source-template/scripts/create.js` - Enhanced generator
3. `packages/source-template/GENERATOR_IMPROVEMENTS.md` - This document

## Benefits

- **Zero-config start:** Generated sources compile immediately
- **Type safety:** Full TypeScript support with proper imports
- **Validation:** Catch metadata errors before submission
- **Documentation:** Clear examples and TODOs guide implementation
- **Testing:** Demo file for quick local testing
- **Standards compliance:** Matches registry schema exactly
- **Developer experience:** Interactive prompts, helpful error messages
