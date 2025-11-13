 # Source Registry Developer Quick Reference

## Quick Commands

```bash
# Update the registry from workspace packages
npm run update-registry

# Build the package
npm run build

# Test remote registry functionality
npm run test:remote

# Watch mode for development
npm run dev
```

## Default Registry URLs

```typescript
import { DEFAULT_REGISTRY_URLS } from '@joyboy-parser/source-registry';

// jsDelivr CDN (default, recommended)
DEFAULT_REGISTRY_URLS.jsdelivr
// https://cdn.jsdelivr.net/gh/Alaric-senpai/The-joyboy-project@main/registry/sources.json

// GitHub Raw (fallback)
DEFAULT_REGISTRY_URLS.github
// https://raw.githubusercontent.com/Alaric-senpai/The-joyboy-project/main/registry/sources.json

// Custom API endpoint
DEFAULT_REGISTRY_URLS.custom
// https://api.joyboy.dev/registry
```

## Basic Usage Examples

### 1. Fetch Remote Registry (jsDelivr)

```typescript
import { createRemoteRegistry } from '@joyboy-parser/source-registry';

// Uses jsDelivr CDN by default
const registry = createRemoteRegistry();

// Get all sources
const sources = await registry.getSources();
console.log(`Found ${sources.length} sources`);

// Get specific source
const mangadex = await registry.getSource('mangadex');
console.log(mangadex.name); // "MangaDex"
```

### 2. Search Sources

```typescript
// Search by keyword
const results = await registry.searchSources('manga');

// Get by category
const apiSources = await registry.getSourcesByCategory('api');

// Get featured sources
const featured = await registry.getFeaturedSources();
```

### 3. Use Local Catalog

```typescript
import { SourceCatalog } from '@joyboy-parser/source-registry';

// Create catalog (uses bundled sources.json)
const catalog = new SourceCatalog();

// Get all sources
const sources = catalog.getAllSources();

// Search
const results = catalog.searchSources('manga');

// Filter by language
const englishSources = catalog.getSourcesByLanguage('en');
```

### 4. Sync with Remote

```typescript
// Create catalog with remote sync
const catalog = new SourceCatalog();

// Sync with remote registry
await catalog.syncWithRemote();

// Now catalog uses remote sources
const sources = catalog.getAllSources();
```

## Source Metadata Structure

Each source in the registry includes:

```typescript
{
  // Basic Info
  id: string;              // e.g., "mangadex"
  name: string;            // e.g., "MangaDex"
  version: string;         // e.g., "1.0.0"
  baseUrl: string;         // e.g., "https://api.mangadex.org"
  description: string;
  icon: string;            // Icon URL
  author: string;
  repository: string;      // GitHub URL
  
  // Downloads (jsDelivr CDN)
  downloads: {
    stable: string;        // Stable release URL
    latest: string;        // Latest release URL
    versions: {
      "1.0.0": string;     // Version-specific URLs
    }
  };
  
  // Integrity
  integrity: {
    sha256: string;        // SHA-256 hash of dist file
  };
  
  // Metadata
  metadata: {
    languages: string[];   // e.g., ["en", "ja", "es"]
    nsfw: boolean;
    official: boolean;
    tags: string[];        // e.g., ["manga", "api"]
    lastUpdated: string;   // ISO 8601
    minCoreVersion: string;
    maxCoreVersion: string;
    websiteUrl: string;
    supportUrl: string;
  };
  
  // Legal
  legal: {
    disclaimer: string;
    sourceType: "api" | "scraper" | "hybrid";
    requiresAuth: boolean;
    termsOfServiceUrl?: string;
  };
  
  // Changelog
  changelog: Array<{
    version: string;
    date: string;
    changes: string[];
    breaking: boolean;
  }>;
  
  // Statistics
  statistics: {
    downloads: number;
    stars: number;
    rating: number;
    activeUsers: number;
  };
  
  // Capabilities
  capabilities: {
    supportsSearch: boolean;
    supportsTrending: boolean;
    supportsLatest: boolean;
    supportsFilters: boolean;
    supportsPopular: boolean;
    supportsAuth: boolean;
    supportsDownload: boolean;
    supportsBookmarks: boolean;
  };
}
```

## Adding a New Source

### Step 1: Create Source Package

```bash
# Use the template
cd packages
cp -r source-template source-mynewsource
cd source-mynewsource
npm install
```

### Step 2: Update Metadata Map

Edit `scripts/update-registry.js` and add your source to `sourceMetadataMap`:

```javascript
const sourceMetadataMap = {
  'mynewsource': {
    baseUrl: 'https://mynewsource.com',
    icon: 'https://mynewsource.com/favicon.ico',
    websiteUrl: 'https://mynewsource.com',
    termsOfServiceUrl: 'https://mynewsource.com/terms',
    languages: ['en'],
    tags: ['manga', 'scraper'],
    sourceType: 'scraper',
    requiresAuth: false,
    capabilities: {
      supportsSearch: true,
      supportsTrending: true,
      supportsLatest: true,
      supportsFilters: false,
      supportsPopular: true,
      supportsAuth: false,
      supportsDownload: true,
      supportsBookmarks: true
    }
  }
};
```

### Step 3: Build and Update Registry

```bash
# Build your source
npm run build

# Update the registry
npm run update-registry
```

### Step 4: Verify

```bash
# Test that your source is in the registry
npm run test:remote
```

## Registry Categories

Sources are automatically categorized:

- **official**: Official/verified sources
- **community**: Community-maintained sources
- **api**: Sources using official APIs
- **scraper**: Sources using web scraping
- **multi-language**: Sources supporting multiple languages
- **english-only**: English-only sources
- **nsfw**: NSFW content sources
- **sfw**: SFW (safe) sources

## Cache Management

```typescript
// Get cache info
const cacheInfo = registry.getCacheInfo();
console.log(`Cached: ${cacheInfo.isCached}`);
console.log(`Expires in: ${cacheInfo.expiresIn}ms`);

// Clear cache
registry.clearCache();

// Force refresh
const freshData = await registry.refresh();
```

## Configuration Options

```typescript
import { RemoteRegistry } from '@joyboy-parser/source-registry';

const registry = new RemoteRegistry({
  registryUrl: 'https://cdn.jsdelivr.net/gh/user/repo@main/registry/sources.json',
  cacheDuration: 3 * 60 * 60 * 1000, // 3 hours (default)
  timeout: 30000,                     // 30 seconds (default)
  fetchImplementation: customFetch    // Optional custom fetch
});
```

## Platform Compatibility

✅ **Web Browsers** (Chrome, Firefox, Safari, Edge)
- Uses native `fetch` API
- AbortController for timeouts

✅ **Node.js 18+**
- Uses built-in `fetch` API
- Full support for all features

✅ **Node.js < 18**
- Requires `node-fetch` polyfill
- Pass as `fetchImplementation` option

✅ **React Native**
- Uses React Native's `fetch` API
- Full compatibility

✅ **Expo**
- Works out of the box
- No additional configuration needed

## Troubleshooting

### Issue: Registry fetch fails

**Solution**: Check network connectivity and URL accessibility

```typescript
try {
  const sources = await registry.getSources();
} catch (error) {
  console.error('Failed to fetch registry:', error);
  // Fall back to bundled sources
  const catalog = new SourceCatalog();
  const sources = catalog.getAllSources();
}
```

### Issue: CORS errors in browser

**Solution**: jsDelivr CDN supports CORS by default. GitHub Raw also allows CORS.

### Issue: Timeout errors

**Solution**: Increase timeout or use different CDN

```typescript
const registry = createRemoteRegistry(DEFAULT_REGISTRY_URLS.jsdelivr, {
  timeout: 60000 // 60 seconds
});
```

### Issue: Old cached data

**Solution**: Force refresh

```typescript
await registry.refresh(); // Bypasses cache
```

## Testing

### Unit Tests

```bash
npm test
```

### Remote Registry Test

```bash
npm run test:remote
```

### Manual Testing

```typescript
import { createRemoteRegistry } from '@joyboy-parser/source-registry';

const registry = createRemoteRegistry();

// Test basic fetch
const data = await registry.fetchRegistry();
console.log(`Version: ${data.version}`);
console.log(`Sources: ${data.sources.length}`);

// Test search
const results = await registry.searchSources('manga');
console.log(`Search results: ${results.length}`);

// Test categories
const apiSources = await registry.getSourcesByCategory('api');
console.log(`API sources: ${apiSources.length}`);
```

## CI/CD Integration

### Auto-update Registry on Push

Add to `.github/workflows/update-registry.yml`:

```yaml
name: Update Registry

on:
  push:
    paths:
      - 'packages/source-*/**'

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: cd packages/source-registry && npm run update-registry
      - run: git add registry/sources.json packages/source-registry/sources.json
      - run: git commit -m "chore: auto-update registry"
      - run: git push
```

## Best Practices

1. ✅ Always use jsDelivr CDN for better performance
2. ✅ Fall back to bundled sources if remote fetch fails
3. ✅ Cache registry data to minimize network requests
4. ✅ Validate source integrity using SHA-256 hashes
5. ✅ Keep source metadata up to date
6. ✅ Test sources before adding to registry
7. ✅ Use semantic versioning for sources
8. ✅ Document breaking changes in changelog

---

**Package**: `@joyboy-parser/source-registry`  
**Version**: 1.0.0  
**License**: MIT
