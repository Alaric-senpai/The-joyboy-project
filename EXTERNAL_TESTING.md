# Testing JoyBoy Parser Outside the Monorepo

This guide shows how to test the JoyBoy parser packages after publishing to npm.

## Installation

### Create a new project

```bash
mkdir joyboy-test
cd joyboy-test
npm init -y
```

### Install the packages

```bash
npm install @joyboy-parser/core @joyboy-parser/source-registry @joyboy-parser/types
```

### Set up package.json for ES modules

Edit `package.json` and add:
```json
{
  "type": "module"
}
```

## Basic Usage

### Example 1: Browse and Install a Source

Create `test-install.js`:

```javascript
import { JoyBoy } from '@joyboy-parser/core';

async function testInstallation() {
  console.log('🔍 Browsing available sources...\n');
  
  // Browse available sources
  const sources = await JoyBoy.browseSources();
  console.log(`Found ${sources.length} source(s):\n`);
  
  sources.forEach((source, index) => {
    console.log(`${index + 1}. ${source.name} (${source.id})`);
    console.log(`   Version: ${source.version}`);
    console.log(`   Base URL: ${source.baseUrl}`);
    console.log(`   Download: ${source.downloads.stable}\n`);
  });
  
  // Install the first source
  if (sources.length > 0) {
    const sourceToInstall = sources[0];
    console.log(`📦 Installing ${sourceToInstall.name}...\n`);
    
    const installedSource = await JoyBoy.installSource(
      sourceToInstall.id,
      (progress, status) => {
        console.log(`  [${progress}%] ${status}`);
      }
    );
    
    console.log(`\n✅ Successfully installed: ${installedSource.name}`);
    console.log(`   ID: ${installedSource.id}`);
    console.log(`   Version: ${installedSource.version}`);
  }
}

testInstallation().catch(console.error);
```

Run:
```bash
node test-install.js
```

### Example 2: Search for Manga

Create `test-search.js`:

```javascript
import { JoyBoy, SourceRegistry } from '@joyboy-parser/core';

async function testSearch() {
  // Install a source first (MangaDex)
  console.log('📦 Installing MangaDex source...\n');
  
  const mangadex = await JoyBoy.installSource('mangadex', (progress, status) => {
    console.log(`  [${progress}%] ${status}`);
  });
  
  console.log('\n✅ Source installed!\n');
  
  // Get the source from registry
  const registry = SourceRegistry.getInstance();
  const source = registry.get('mangadex');
  
  // Search for manga
  console.log('🔍 Searching for "one piece"...\n');
  
  const results = await source.search({ query: 'one piece' });
  
  console.log(`Found ${results.length} result(s):\n`);
  
  results.slice(0, 3).forEach((manga, index) => {
    console.log(`${index + 1}. ${manga.title}`);
    console.log(`   ID: ${manga.id}`);
    console.log(`   URL: ${manga.url}`);
    console.log(`   Description: ${manga.description?.substring(0, 100)}...\n`);
  });
  
  // Get details for first result
  if (results.length > 0) {
    console.log('📖 Getting details for first result...\n');
    
    const details = await source.getMangaDetails(results[0].id);
    
    console.log(`Title: ${details.title}`);
    console.log(`Status: ${details.status}`);
    console.log(`Author: ${details.author}`);
    console.log(`Genres: ${details.genres?.join(', ')}`);
    
    // Get chapters
    console.log('\n📚 Getting chapters...\n');
    
    const chapters = await source.getChapters(results[0].id);
    console.log(`Found ${chapters.length} chapter(s)`);
    
    if (chapters.length > 0) {
      console.log('\nFirst 3 chapters:');
      chapters.slice(0, 3).forEach((chapter, index) => {
        console.log(`  ${index + 1}. ${chapter.title || 'Chapter ' + chapter.number}`);
        console.log(`     ID: ${chapter.id}`);
        console.log(`     Number: ${chapter.number}`);
      });
      
      // Get pages from first chapter
      console.log('\n📄 Getting pages from first chapter...\n');
      
      const pages = await source.getChapterPages(chapters[0].id);
      console.log(`Found ${pages.length} page(s)`);
      
      if (pages.length > 0) {
        console.log('\nFirst 3 page URLs:');
        pages.slice(0, 3).forEach((page, index) => {
          console.log(`  ${index + 1}. ${page}`);
        });
      }
    }
  }
}

testSearch().catch(console.error);
```

Run:
```bash
node test-search.js
```

### Example 3: Using Source Registry Directly

Create `test-registry.js`:

```javascript
import { SourceCatalog } from '@joyboy-parser/source-registry';

async function testRegistry() {
  console.log('📚 Testing Source Registry\n');
  
  // Get all sources
  const sources = SourceCatalog.getAllSources();
  
  console.log(`Total sources in registry: ${sources.length}\n`);
  
  sources.forEach(source => {
    console.log(`📦 ${source.name}`);
    console.log(`   ID: ${source.id}`);
    console.log(`   Version: ${source.version}`);
    console.log(`   Languages: ${source.languages.join(', ')}`);
    console.log(`   Features:`);
    console.log(`     - Search: ${source.supportsSearch}`);
    console.log(`     - Latest: ${source.supportsLatest}`);
    console.log(`     - Popular: ${source.supportsPopular}`);
    console.log(`     - Trending: ${source.supportsTrending}`);
    console.log(`   Download URL: ${source.downloads.stable}`);
    console.log(`   SHA-256: ${source.integrity.sha256}\n`);
  });
  
  // Search by language
  console.log('🔍 Sources supporting English:\n');
  const englishSources = SourceCatalog.getSourcesByLanguage('en');
  englishSources.forEach(source => {
    console.log(`  - ${source.name} (${source.id})`);
  });
}

testRegistry().catch(console.error);
```

Run:
```bash
node test-registry.js
```

## Expected Output

### Installation Test
```
🔍 Browsing available sources...

Found 1 source(s):

1. MangaDex (mangadex)
   Version: 1.0.0
   Base URL: https://api.mangadex.org
   Download: https://cdn.jsdelivr.net/gh/...

📦 Installing MangaDex...

  [0%] Starting installation...
  [20%] Downloading source code...
  [50%] Verifying integrity...
  [70%] Loading source...
  [80%] Instantiating source...
  [90%] Caching source...
  [100%] Installation complete

✅ Successfully installed: MangaDex
   ID: mangadex
   Version: 1.0.0
```

### Search Test
```
📦 Installing MangaDex source...
  [100%] Installation complete

✅ Source installed!

🔍 Searching for "one piece"...

Found 20 result(s):

1. One Piece (Official Colored)
   ID: a2c1d849-af05-4bbc-b2a7-866ebb10331f
   URL: https://mangadex.org/title/...
   Description: Gol D. Roger, a man referred to as the "Pirate King,"...

[... more results ...]

📖 Getting details for first result...

Title: One Piece (Official Colored)
Status: ongoing
Author: Oda Eiichiro
Genres: Award Winning, Sci-Fi, Action, Adventure...

📚 Getting chapters...

Found 764 chapter(s)
```

## Troubleshooting

### Module Not Found
If you get "Cannot find module" errors, ensure:
- `"type": "module"` is in your package.json
- You're using `.js` extension (not `.mjs`) for your test files
- You're using `import` syntax, not `require()`

### Integrity Verification Failed
This usually means:
- Network issue during download
- Registry has outdated SHA-256 hash
- Source file was modified after registry update

The core package will auto-convert GitHub tree URLs to raw URLs, but you may see a warning.

### Source Loading Failed
Check:
- The source is properly built and published
- The download URL is accessible
- Node.js version is 18+ (for native fetch support)

## Version Information

- **@joyboy-parser/core**: 1.1.0
- **@joyboy-parser/source-registry**: 1.1.0
- **@joyboy-parser/types**: 1.1.0
- **@joyboy-parser/source-mangadex**: 1.0.2

## Next Steps

After successful testing:
1. Integrate into your application
2. Add error handling
3. Implement caching strategies
4. Add progress indicators for UX
5. Consider building your own custom sources

## Documentation

- [API Reference](../README.md)
- [Creating Custom Sources](../packages/source-template/README.md)
- [Source Registry Guide](../packages/source-registry/README.md)
