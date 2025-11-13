# Quick Test Reference Card

## Run All Tests
```bash
npm test              # Watch mode
npm test -- --run     # Single run, all tests
```

## Run Specific Test Files
```bash
npm test index.test.ts              # Package exports
npm test source-catalog.test.ts     # Source catalog
npm test remote-registry.test.ts    # Remote registry
npm test remote-loader.test.ts      # Remote loader
```

## Test Remote Registry (Live)
```bash
npm run test:remote   # Tests actual CDN access
```

## Build & Verify
```bash
npm run build         # Build package
npm run update-registry  # Update sources.json
```

## Test Coverage

| Component | Tests | Status |
|-----------|-------|--------|
| Package Exports | 18 | ✅ |
| Remote Registry | 29 | ✅ |
| Source Catalog | 47 | ✅ |
| Remote Loader | 5 | ✅ |
| **Total** | **99** | **✅** |

## What's Tested

### ✅ Remote Registry
- Fetch & caching
- Error handling
- Search & filtering
- Categories & featured
- Metadata & notices
- Cache management

### ✅ Source Catalog
- Basic CRUD operations
- Search (by name, ID, tags)
- Language filtering
- Source filtering (official, NSFW, etc.)
- Statistics & distributions
- Remote sync
- Import/Export
- Sorting (by rating, popularity)

### ✅ Remote Loader
- Runtime detection
- Source download & caching
- Code validation
- Custom configuration

### ✅ Package Exports
- All public APIs
- URL configuration
- Integration tests

## Common Test Patterns

### Testing a new catalog method
```typescript
it('should do something', () => {
  const catalog = new SourceCatalog();
  const result = catalog.someMethod();
  expect(result).toBeDefined();
});
```

### Testing remote sync
```typescript
it('should sync with remote', async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => mockRegistryData,
  });
  
  await catalog.syncWithRemote();
  expect(catalog.getAllSources()).toHaveLength(3);
});
```

### Testing error handling
```typescript
it('should handle errors', async () => {
  mockFetch.mockRejectedValue(new Error('Network error'));
  
  await expect(registry.fetchRegistry()).rejects.toThrow();
});
```

## Quick Checks

Before committing:
```bash
npm test -- --run     # All tests pass
npm run build         # Builds successfully
npm run test:remote   # CDN accessible
```

## Debugging Tests

### Watch a specific test
```bash
npm test -- --watch source-catalog.test.ts
```

### Run with coverage
```bash
npm test -- --coverage
```

### Verbose output
```bash
npm test -- --reporter=verbose
```

## Test Files Location

```
packages/source-registry/src/__tests__/
├── index.test.ts              # Package exports
├── source-catalog.test.ts     # Source catalog
├── remote-registry.test.ts    # Remote registry
├── remote-loader.test.ts      # Remote loader
└── README.md                  # Test documentation
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Test Source Registry
  run: |
    cd packages/source-registry
    npm test -- --run
    npm run build
```

### Pre-commit Hook
```bash
#!/bin/sh
cd packages/source-registry
npm test -- --run || exit 1
```

## Need Help?

- 📖 See `TEST_SUMMARY.md` for detailed test info
- 📖 See `DEVELOPER_GUIDE.md` for usage examples
- 📖 See `UPDATE_SUMMARY.md` for recent changes

---

**All 99 tests passing ✅**
