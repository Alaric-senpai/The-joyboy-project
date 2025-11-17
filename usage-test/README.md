# Usage Test Suite

Comprehensive test suite and examples for validating `@joyboy-parser/core` functionality.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm run test:all

# Run comprehensive example
npm run example
```

## Structure

- `test-basic.js` - Tests core exports, BaseSource, utilities, error handling
- `test-registry.js` - Tests SourceRegistry functionality
- `test-loader.js` - Tests GitHubSourceLoader
- `test-runtime.js` - Tests JoyBoy runtime
- `example-comprehensive.js` - Complete real-world usage demonstration
- `TEST_RESULTS.md` - Detailed test results and findings

## Running Tests

```bash
# Run individual tests
npm run test:basic       # Core functionality tests
npm run test:registry    # Registry management tests
npm run test:loader      # GitHub loader tests
npm run test:runtime     # JoyBoy runtime tests

# Run all tests sequentially
npm run test:all

# Run comprehensive example
npm run example
```

## Test Coverage

### ✅ Basic Tests (11 tests)
- Core module imports and exports
- BaseSource class extension and implementation
- RequestManager and CacheManager functionality
- Error utilities (HttpError, NetworkError, formatError, etc.)
- Source operations (search, getMangaDetails, getChapters, getPages)
- Cache operations (set, get, size, clear)

### ✅ Registry Tests (7 tests)
- SourceRegistry singleton instantiation
- Source registration and retrieval
- Source listing and existence checking
- Capability-based filtering
- Source unregistration

### ✅ Loader Tests (2 tests)
- GitHubSourceLoader instantiation
- Loader method availability
- *(Network operations skipped in basic tests)*

### ✅ Runtime Tests (6 tests)
- JoyBoy static runtime API
- Source browsing and searching
- Installed vs available source tracking
- Registry configuration methods
- *(Source installation skipped to avoid network dependencies)*

### ✅ Comprehensive Example
Demonstrates:
1. Creating custom sources extending BaseSource
2. Registering sources with SourceRegistry
3. Using sources for manga operations
4. JoyBoy runtime API usage
5. Error handling patterns
6. Request and cache management

## Test Results

**Status:** ✅ All tests passing  
**Total Tests:** 26/26 passed  
**Coverage:** All major APIs validated

See `TEST_RESULTS.md` for detailed findings and recommendations.

## Example Usage

The comprehensive example (`example-comprehensive.js`) shows:

```javascript
import { JoyBoy, BaseSource, SourceRegistry } from '@joyboy-parser/core';

// 1. Create a custom source
class MySource extends BaseSource {
  id = 'my-source';
  name = 'My Manga Source';
  version = '1.0.0';
  baseUrl = 'https://example.com';
  // ... implement required methods
}

// 2. Register the source
const registry = SourceRegistry.getInstance();
const source = new MySource();
registry.register(source);

// 3. Use the source
const results = await source.search('one piece');
const manga = await source.getMangaDetails('manga-id');
const chapters = await source.getChapters('manga-id');
const pages = await source.getChapterPages('chapter-id');

// 4. Use JoyBoy runtime
const sources = JoyBoy.browseSources();
const mangaSources = JoyBoy.searchSources('manga');
```

## Issues Found & Fixed

During testing, we identified and fixed several API mismatches:

1. **BaseSource API** - Uses direct properties, not an `info` object
2. **Search Return Type** - Returns `Manga[]` directly, not wrapped object
3. **Cache API** - Uses `get()/size()`, not `has()`
4. **Registry Pattern** - Singleton with specific method names
5. **Runtime Pattern** - Static-only class, not instantiable

All issues have been documented in `TEST_RESULTS.md`.

## Development

These tests serve as:
- ✅ Validation of core functionality
- ✅ Documentation through working examples
- ✅ Quick smoke tests during development
- ✅ Reference implementation for source developers

## Next Steps

1. Add these tests to main CI/CD pipeline
2. Create additional integration tests with real sources
3. Add performance benchmarks
4. Expand error handling test coverage

