# Source Registry Tests

Comprehensive test suite for `@joyboy/source-registry` using Vitest.

## Test Coverage

### ✅ 72 Tests Passing

#### SourceCatalog Class (61 tests)

**Constructor & Initialization (3 tests)**
- Initializes with sources from JSON
- Loads at least one source from bundled data
- Correctly loads MangaDex source

**getAllSources (2 tests)**
- Returns array of all sources
- Sources have required properties (id, name, version, baseUrl, packageName)

**getSource (3 tests)**
- Returns source by ID
- Returns undefined for non-existent source
- Returns correct source metadata

**searchSources (8 tests)**
- Returns all sources for empty query
- Searches by name (case-insensitive)
- Searches by ID
- Searches by description
- Searches by package name
- Searches by tags
- Returns empty array for non-matching query

**getSourcesByLanguage (3 tests)**
- Filters sources by language code
- Case-insensitive language matching
- Returns empty array for unsupported languages

**getSourcesByLanguages (3 tests)**
- Filters by multiple languages with OR logic
- Case-insensitive matching
- Handles empty language arrays

**Official/Community Sources (3 tests)**
- Filters official sources only
- Filters community sources only
- Returns arrays correctly

**Tag Filtering (4 tests)**
- Single tag filtering (case-insensitive)
- Multiple tags with AND logic
- Handles empty tag arrays

**NSFW/SFW Filtering (3 tests)**
- Returns only NSFW sources
- Returns only SFW sources
- Ensures no overlap between NSFW/SFW results

**Sorting & Filtering (8 tests)**
- Sorts by rating (highest first)
- Sorts by popularity/downloads
- Filters recently updated sources
- Uses correct default values

**Dynamic Registration (7 tests)**
- Registers new sources
- Overwrites existing sources with same ID
- Unregisters sources successfully
- Returns correct boolean for unregister operations
- Updates source count correctly

**Statistics (6 tests)**
- Returns complete statistics object
- Calculates total sources correctly
- Calculates official/community split
- Calculates NSFW/SFW split
- Generates language distribution
- Generates tag distribution

**Import/Export (6 tests)**
- Exports sources as valid JSON
- Exports all sources
- Imports sources from JSON string
- Throws errors for invalid JSON
- Provides descriptive error messages

**Clear Operation (2 tests)**
- Clears all sources
- Reloads from bundled JSON after clear

#### Singleton Instance (2 tests)
- Exports working singleton instance
- Singleton has sources loaded

#### Convenience Functions (9 tests)
- `getAllSources()` - Returns all sources
- `getSourceById()` - Gets source by ID
- `searchSources()` - Searches with query
- `getSourcesByLanguage()` - Filters by language
- `getOfficialSources()` - Returns official sources
- `getSFWSources()` - Returns SFW sources
- `getStatistics()` - Returns statistics

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run with coverage
pnpm test --coverage

# Run from workspace root
pnpm --filter @joyboy/source-registry test
```

## Test Structure

Tests are organized by functionality:
- **Class methods** - Each public method has dedicated test suite
- **Edge cases** - Empty arrays, undefined values, invalid inputs
- **Case sensitivity** - All search/filter operations test case-insensitivity
- **Data integrity** - Verifies correct data structures and types
- **Singleton behavior** - Tests global instance and convenience functions

## Key Testing Patterns

### Isolation
Each test uses `beforeEach` to create a fresh catalog instance, ensuring no test pollution.

### Data-Driven
Tests adapt to the actual sources.json content, making them resilient to data changes.

### Comprehensive Coverage
- Happy paths ✅
- Edge cases ✅
- Error conditions ✅
- Type safety ✅
- API contracts ✅

## Dependencies

- `vitest` - Fast unit test framework
- Built-in Node.js test environment
- No mocking required (tests use real JSON data)
