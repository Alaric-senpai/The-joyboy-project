
# @joyboy-parser/source-registry

Dynamic source registry and catalog for JoyBoy parsers.

This package provides a central catalog of available parser packages (sources) for the JoyBoy ecosystem. It offers programmatic discovery, search, filtering, statistics, optional synchronization with a remote GitHub-backed registry, **and dynamic runtime source loading compatible with Web, Node.js, and React Native/Expo**.

## Installation

Install from npm:

```bash
npm install @joyboy-parser/source-registry
```

## Platform Support

✅ **Web** (browsers, modern ESM)  
✅ **Node.js** (v16+)  
✅ **React Native** (with Expo or bare workflow)  
✅ **Expo** (SDK 45+)

## Quick Start

### Basic Catalog Usage

```ts
import {
  getAllSources,
  getSourceById,
  searchSources,
  getSourcesByLanguage,
  sourceCatalog 
} from '@joyboy-parser/source-registry';

// Get all bundled sources
const all = getAllSources();

// Search
const results = searchSources('manga');

// Use the singleton catalog
const stats = sourceCatalog.getStatistics();
console.log(`Total sources: ${stats.totalSources}`);

// Create a catalog that syncs with a remote registry
const remoteCatalog = new SourceCatalog('https://raw.githubusercontent.com/yourorg/yourrepo/main/registry/sources.json');
await remoteCatalog.syncWithRemote();
```

### Dynamic Remote Source Loading

Load parser sources dynamically at runtime from CDN or GitHub:

```ts
import { RemoteSourceLoader } from '@joyboy-parser/source-registry';
import { BaseSource } from '@joyboy-parser/core';

// Create loader (works in Web, Node.js, and React Native)
const loader = new RemoteSourceLoader({
  baseSourceClass: BaseSource,
  strictValidation: true,
});

// Load a source from URL
const sourceUrl = 'https://cdn.example.com/sources/mangadex.js';
const SourceClass = await loader.loadSourceClass(sourceUrl);

// Instantiate and use
const source = new SourceClass();
const results = await source.search('one piece');
```

**React Native/Expo Example:**

```tsx
import { RemoteSourceLoader } from '@joyboy-parser/source-registry';
import { BaseSource } from '@joyboy-parser/core';

function MyApp() {
  const [source, setSource] = useState(null);

  useEffect(() => {
    async function loadSource() {
      const loader = new RemoteSourceLoader({
        baseSourceClass: BaseSource,
      });
      
      const SourceClass = await loader.loadSourceClass(
        'https://cdn.example.com/sources/mangadex.js'
      );
      
      setSource(new SourceClass());
    }
    loadSource();
  }, []);

  // Use source...
}
```

See [REMOTE_LOADER_EXAMPLES.md](./REMOTE_LOADER_EXAMPLES.md) for comprehensive examples for all platforms.

## API Overview

### Catalog Functions

- `getAllSources(): RegistryEntry[]` — return all registered sources.
- `getSourceById(id: string): RegistryEntry | undefined` — lookup by ID.
- `searchSources(query: string): RegistryEntry[]` — fuzzy search across id/name/description/tags.
- `getSourcesByLanguage(lang: string): RegistryEntry[]` — filter by language code (e.g., `en`, `ja`).
- `getOfficialSources()` / `getCommunitySources()` — split by official flag.
- `getSFWSources()` / `getNSFWSources()` — filter by NSFW flag.
- `getStatistics(): RegistryStats` — registry-level counts and distributions.
- `SourceCatalog` — class with the above instance methods plus `registerSource`, `unregisterSource`, `syncWithRemote()`.

### RemoteSourceLoader

```ts
class RemoteSourceLoader {
  constructor(config?: RemoteLoaderConfig);
  
  // Load source from URL
  loadFromUrl(url: string): Promise<any>;
  loadSourceClass(url: string): Promise<any>;
  
  // Download source code
  downloadSource(url: string): Promise<string>;
  
  // Validation
  validateSource(code: string): boolean;
  
  // Runtime detection
  getRuntime(): 'web' | 'node' | 'react-native' | 'unknown';
  
  // Cache management
  clearCache(): void;
  clearModuleCache(): void;
  clearAllCaches(): void;
  
  // Configuration
  setConfig(config: Partial<RemoteLoaderConfig>): void;
}

interface RemoteLoaderConfig {
  baseSourceClass?: any;        // BaseSource class to inject
  globals?: Record<string, any>; // Additional globals
  strictValidation?: boolean;    // Enable validation (default: true)
}
```

## Remote Registry Sync

The package optionally supports syncing with a remote registry JSON (for example a GitHub raw file or a CDN). Construct `new SourceCatalog(remoteUrl)` and call `syncWithRemote()` to fetch and merge remote entries. The remote registry should be an array of `RegistryEntry` objects (see `sources.json` for the bundled format).

## Bundled Data

This package includes a `sources.json` file containing the bundled list of known sources. The `update-registry` script (if present) can be used during development to regenerate the list from the workspace.

## Contributing

If you maintain a source package and want it listed in the registry:

1. Open a PR adding or updating the entry in `packages/source-registry/sources.json`.
2. Follow the `RegistryEntry` shape (id, name, packageName, baseUrl, description, languages, tags, repository, installCommand, lastUpdated, official, etc.).

If you want automatic publishing of the registry from a GitHub repo, add a workflow to update `sources.json` and publish to the raw CDN.

## Runtime Compatibility Notes

- **Web**: Uses Blob URLs, data URLs, or Function constructor (automatically selected)
- **Node.js**: Uses data URLs or Function constructor  
- **React Native/Expo**: Uses Function constructor (most reliable for RN)
- The loader automatically detects the runtime and selects the appropriate loading strategy
- All methods cache downloaded code and loaded modules for performance

## Security

⚠️ **Important**: The `RemoteSourceLoader` uses dynamic code evaluation. Only load sources from **trusted URLs** (your own CDN, official GitHub repos, etc.). Never load arbitrary user-provided URLs.

## License

MIT

---

**Need help?** See [REMOTE_LOADER_EXAMPLES.md](./REMOTE_LOADER_EXAMPLES.md) for detailed usage examples across all platforms.
