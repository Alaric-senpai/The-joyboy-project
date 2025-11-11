
# @joyboy-parser/source-registry

Dynamic source registry and catalog for JoyBoy parsers.

## Installation

```bash
npm install @joyboy-parser/source-registry
```

## Features

- 📚 Centralized source catalog
- 🔍 Search and filter sources
- 🏷️ Tag-based organization
- 🌐 Language filtering
- 📊 Registry statistics
- ✅ Official/community distinction

## Usage

```typescript
import { 
  getAllSources, 
  searchSources,
  getSourcesByLanguage,
  sourceCatalog 
} from '@joyboy-parser/source-registry';

// Get all sources
const sources = getAllSources();

// Search sources
const results = searchSources('manga');

// Filter by language
const englishSources = getSourcesByLanguage('en');

// Get official sources
const official = sourceCatalog.getOfficialSources();

// Get SFW sources
const sfw = sourceCatalog.getSFWSources();

// Get statistics
const stats = sourceCatalog.getStatistics();
```

## API

### Functions

- `getAllSources()` - Get all available sources
- `getSourceById(id)` - Get source by ID
- `searchSources(query)` - Search sources
- `getSourcesByLanguage(lang)` - Filter by language
- `getOfficialSources()` - Get official sources
- `getSFWSources()` - Get safe-for-work sources
- `getStatistics()` - Get registry stats

### SourceCatalog Class

```typescript
const catalog = new SourceCatalog();

catalog.getAllSources();
catalog.searchSources('query');
catalog.getSourcesByLanguage('en');
catalog.getSourcesByTag('api');
catalog.getOfficialSources();
catalog.getNSFWSources();
catalog.getSFWSources();
catalog.getStatistics();
```

## Updating the Registry

```bash
cd packages/source-registry
pnpm update-registry
```

This scans all source packages and updates `sources.json`.

## License

MIT
