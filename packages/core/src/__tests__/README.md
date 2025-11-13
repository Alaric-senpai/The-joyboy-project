# Core Package Tests

Comprehensive test suite for the `@joyboy-parser/core` package.

## Test Files

### 1. `registry.test.ts` - SourceRegistry Tests
Tests for the source registry that manages loaded parser instances.

**Coverage:**
- Singleton pattern implementation
- Source registration and unregistration
- Source retrieval and listing
- Capability-based filtering
- Edge cases and concurrency

**Test Count:** ~30 tests

### 2. `github-loader.test.ts` - GitHubSourceLoader Tests
Tests for the dynamic source loader that fetches sources from remote URLs.

**Coverage:**
- Loading sources from registry entries
- Loading sources from direct URLs
- Loading sources from code strings
- Caching mechanisms
- Source validation and verification
- Integrity checking
- Error handling
- Concurrent operations

**Test Count:** ~35 tests

### 3. `base-source.test.ts` - BaseSource Tests
Tests for the base source class that all parsers extend.

**Coverage:**
- Required properties and methods
- Search functionality
- Manga details retrieval
- Chapter and page fetching
- Pagination support
- Optional methods (trending, latest, popular)
- HTML parsing utilities
- Edge cases with special characters

**Test Count:** ~40 tests

### 4. `runtime.test.ts` - JoyBoy Runtime Tests
Tests for the main JoyBoy runtime class.

**Coverage:**
- Runtime initialization
- Registry configuration
- Source browsing and searching
- Source installation and uninstallation
- Source updates
- Registry synchronization
- Error handling
- Concurrent operations

**Test Count:** ~40 tests

### 5. `index.test.ts` - Package Exports Tests
Tests for the package's public API and exports.

**Coverage:**
- Main class exports
- Type exports
- Utility function exports
- Error type exports
- Package structure validation
- Type compatibility
- Integration tests

**Test Count:** ~25 tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- registry.test.ts

# Run with coverage
npm test -- --coverage
```

## Test Structure

All tests follow the AAA pattern:
- **Arrange**: Set up test data and mocks
- **Act**: Execute the functionality being tested
- **Assert**: Verify the expected outcomes

## Mocking Strategy

### External Dependencies
- `fetch` API is mocked globally for network operations
- Registry responses are mocked with realistic data structures

### Test Isolation
- `beforeEach` hooks reset state between tests
- Registry is cleared before each runtime test
- Loader cache is cleared for independent testing

## Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 85%

## Test Data

Mock data includes:
- Sample manga sources (MangaDex, MangaFire)
- Complete registry responses with metadata
- Valid source code snippets for loading tests
- Edge cases: special characters, empty arrays, malformed data

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Release builds

## Adding New Tests

When adding new functionality:

1. Create tests alongside the new code
2. Follow existing test patterns
3. Include both happy path and error cases
4. Test edge cases and boundary conditions
5. Update this README if adding new test files

## Common Testing Patterns

### Testing Async Operations
```typescript
it('should handle async operation', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Handling
```typescript
it('should throw error on invalid input', async () => {
  await expect(someFunction()).rejects.toThrow('Expected error message');
});
```

### Testing Progress Callbacks
```typescript
it('should track progress', async () => {
  const progressSteps: number[] = [];
  await operation((progress) => {
    progressSteps.push(progress);
  });
  expect(progressSteps[0]).toBe(0);
  expect(progressSteps[progressSteps.length - 1]).toBe(100);
});
```

## Debugging Tests

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run single test
npm test -- -t "test name"

# Debug in VS Code
# Use the built-in debugger with the test file open
```

## Test Utilities

All tests use Vitest with the following utilities:
- `describe`: Group related tests
- `it`/`test`: Individual test cases
- `expect`: Assertions
- `beforeEach`/`afterEach`: Setup and teardown
- `vi.fn()`: Mock functions
- `vi.mock()`: Module mocking

## Future Improvements

- [ ] Add performance benchmarks
- [ ] Add integration tests with real sources
- [ ] Add E2E tests for complete workflows
- [ ] Increase test coverage to > 90%
- [ ] Add visual regression tests for error messages
- [ ] Add load testing for concurrent operations
