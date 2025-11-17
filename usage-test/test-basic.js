/**
 * Basic functionality test for @joyboy-parser/core
 * Tests: imports, BaseSource, utilities
 */

import {
  BaseSource,
  RequestManager,
  CacheManager,
  HttpError,
  NetworkError,
  isSourceError,
  formatError,
  isRetryableError,
  ErrorType,
  createSourceError
} from '@joyboy-parser/core';

console.log('🧪 Testing @joyboy-parser/core - Basic Functionality\n');

// Test 1: Verify exports
console.log('✓ Test 1: Core exports loaded successfully');
console.log('  - BaseSource:', typeof BaseSource);
console.log('  - RequestManager:', typeof RequestManager);
console.log('  - CacheManager:', typeof CacheManager);
console.log('  - HttpError:', typeof HttpError);
console.log('  - NetworkError:', typeof NetworkError);
console.log('  - Utilities:', typeof isSourceError, typeof formatError, typeof isRetryableError);
console.log('  - Error helpers:', typeof ErrorType, typeof createSourceError);

// Test 2: Create a mock source extending BaseSource
class TestSource extends BaseSource {
  id = 'test-source';
  name = 'Test Source';
  version = '1.0.0';
  baseUrl = 'https://test.example.com';
  description = 'A test source for validation';
  icon = 'test.png';
  
  constructor() {
    super({ enableCache: true });
    this.supportsSearch = true;
    this.supportsPopular = true;
    this.supportsLatest = true;
  }

  async search(query, options = {}) {
    return [
      {
        id: 'test-manga-1',
        title: `Search result for: ${query}`,
        cover: 'https://test.example.com/cover.jpg',
        url: 'https://test.example.com/manga/1',
        source: this.id
      }
    ];
  }

  async getMangaDetails(mangaId) {
    return {
      id: mangaId,
      title: 'Test Manga',
      cover: 'https://test.example.com/cover.jpg',
      url: 'https://test.example.com/manga/' + mangaId,
      source: this.id,
      description: 'A test manga',
      status: 'ongoing',
      chapters: []
    };
  }

  async getChapters(mangaId) {
    return [
      {
        id: 'chapter-1',
        mangaId: mangaId,
        title: 'Chapter 1',
        number: 1,
        url: 'https://test.example.com/chapter/1',
        releaseDate: new Date().toISOString()
      }
    ];
  }

  async getPages(chapterId) {
    return [
      {
        url: 'https://test.example.com/page/1.jpg',
        index: 0
      },
      {
        url: 'https://test.example.com/page/2.jpg',
        index: 1
      }
    ];
  }

  async getChapterPages(chapterId) {
    return this.getPages(chapterId);
  }

  async getByPage(searchLabel, pageNumber) {
    return [];
  }

  async extractPaginationInfo(url) {
    return {
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }
}

console.log('\n✓ Test 2: BaseSource extension created');

// Test 3: Instantiate and use TestSource
const testSource = new TestSource();
console.log('\n✓ Test 3: TestSource instantiated');
console.log('  - ID:', testSource.id);
console.log('  - Name:', testSource.name);
console.log('  - Version:', testSource.version);
console.log('  - Base URL:', testSource.baseUrl);

// Test 4: Test search functionality
(async () => {
  try {
    console.log('\n✓ Test 4: Testing search functionality...');
    const searchResults = await testSource.search('test query');
    console.log('  - Results:', searchResults.length);
    console.log('  - First result:', searchResults[0]?.title);

    // Test 5: Get manga details
    console.log('\n✓ Test 5: Testing getMangaDetails...');
    const manga = await testSource.getMangaDetails('test-manga-1');
    console.log('  - Manga ID:', manga.id);
    console.log('  - Manga Title:', manga.title);

    // Test 6: Get chapters
    console.log('\n✓ Test 6: Testing getChapters...');
    const chapters = await testSource.getChapters('test-manga-1');
    console.log('  - Chapters:', chapters.length);
    console.log('  - First chapter:', chapters[0]?.title);

    // Test 7: Get pages
    console.log('\n✓ Test 7: Testing getPages...');
    const pages = await testSource.getPages('chapter-1');
    console.log('  - Pages:', pages.length);
    console.log('  - First page URL:', pages[0]?.url);

    // Test 8: Error handling
    console.log('\n✓ Test 8: Testing error utilities...');
    const testError = createSourceError(ErrorType.NETWORK_ERROR, 'Test network error', 'test-source');
    console.log('  - Created error type:', testError.type);
    console.log('  - Is source error:', isSourceError(testError));
    console.log('  - Is retryable:', isRetryableError(testError));
    console.log('  - Formatted error:', formatError(testError));

    // Test 9: HTTP Errors
    console.log('\n✓ Test 9: Testing HTTP error classes...');
    const httpError = new HttpError('Not Found', 404, 'https://test.com');
    console.log('  - HTTP Error message:', httpError.message);
    console.log('  - HTTP Error status:', httpError.statusCode);
    
    const networkError = new NetworkError('Connection timeout', 'https://test.com');
    console.log('  - Network Error message:', networkError.message);

    // Test 10: RequestManager
    console.log('\n✓ Test 10: Testing RequestManager...');
    const requestManager = new RequestManager({
      timeout: 10000,
      maxRetries: 3,
      retryDelay: 1000
    });
    console.log('  - RequestManager created with timeout:', 10000);

    // Test 11: CacheManager
    console.log('\n✓ Test 11: Testing CacheManager...');
    const cacheManager = new CacheManager({ ttl: 60000, maxSize: 100 });
    cacheManager.set('test-key', { data: 'test value' });
    const cached = cacheManager.get('test-key');
    console.log('  - Cache set and retrieved:', cached?.data);
    console.log('  - Cache size:', cacheManager.size());
    cacheManager.clear();
    console.log('  - Cache cleared, size:', cacheManager.size());
    
    console.log('\n✅ All basic tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
