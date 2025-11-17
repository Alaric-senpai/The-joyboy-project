/**
 * Comprehensive example demonstrating real-world usage of @joyboy-parser/core
 */

import {
  JoyBoy,
  SourceRegistry,
  BaseSource,
  RequestManager,
  CacheManager,
  HttpError,
  NetworkError
} from '@joyboy-parser/core';

console.log('🎮 JoyBoy Core - Comprehensive Usage Example\n');
console.log('='.repeat(60));

// ============================================================================
// Example 1: Creating a Custom Source
// ============================================================================

console.log('\n📦 Example 1: Creating a Custom Manga Source\n');

class MyCustomSource extends BaseSource {
  id = 'my-custom-source';
  name = 'My Custom Manga Source';
  version = '1.0.0';
  baseUrl = 'https://example.com';
  description = 'A custom manga source implementation';
  icon = 'custom.png';
  languages = ['en'];
  
  constructor() {
    super({ enableCache: true, cacheTTL: 300000 }); // 5 min cache
    this.supportsSearch = true;
    this.supportsLatest = true;
    this.supportsPopular = true;
  }

  async search(query, options = {}) {
    console.log(`  🔍 Searching for: "${query}"`);
    // In real implementation, this would make HTTP requests
    return [
      {
        id: '1',
        title: `Result for: ${query}`,
        cover: `${this.baseUrl}/covers/1.jpg`,
        url: `${this.baseUrl}/manga/1`,
        source: this.id,
        description: 'A great manga'
      }
    ];
  }

  async getMangaDetails(mangaId) {
    console.log(`  📖 Getting details for manga: ${mangaId}`);
    return {
      id: mangaId,
      title: 'Sample Manga',
      cover: `${this.baseUrl}/covers/${mangaId}.jpg`,
      url: `${this.baseUrl}/manga/${mangaId}`,
      source: this.id,
      description: 'A detailed manga description',
      status: 'ongoing',
      author: 'Sample Author',
      artist: 'Sample Artist',
      genres: ['Action', 'Adventure'],
      chapters: []
    };
  }

  async getChapters(mangaId) {
    console.log(`  📚 Getting chapters for: ${mangaId}`);
    return [
      {
        id: 'ch-1',
        mangaId: mangaId,
        title: 'Chapter 1',
        number: 1,
        url: `${this.baseUrl}/chapter/1`,
        releaseDate: new Date().toISOString()
      },
      {
        id: 'ch-2',
        mangaId: mangaId,
        title: 'Chapter 2',
        number: 2,
        url: `${this.baseUrl}/chapter/2`,
        releaseDate: new Date().toISOString()
      }
    ];
  }

  async getChapterPages(chapterId) {
    console.log(`  📄 Getting pages for: ${chapterId}`);
    return [
      { url: `${this.baseUrl}/pages/${chapterId}/1.jpg`, index: 0 },
      { url: `${this.baseUrl}/pages/${chapterId}/2.jpg`, index: 1 },
      { url: `${this.baseUrl}/pages/${chapterId}/3.jpg`, index: 2 }
    ];
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

  async getLatest(options = {}) {
    console.log('  🆕 Getting latest updates...');
    return [
      {
        id: 'latest-1',
        title: 'Latest Manga 1',
        cover: `${this.baseUrl}/covers/latest-1.jpg`,
        url: `${this.baseUrl}/manga/latest-1`,
        source: this.id
      }
    ];
  }

  async getPopular(options = {}) {
    console.log('  🔥 Getting popular manga...');
    return [
      {
        id: 'popular-1',
        title: 'Popular Manga 1',
        cover: `${this.baseUrl}/covers/popular-1.jpg`,
        url: `${this.baseUrl}/manga/popular-1`,
        source: this.id
      }
    ];
  }
}

// ============================================================================
// Example 2: Using the Source Registry
// ============================================================================

console.log('\n📋 Example 2: Source Registry Management\n');

(async () => {
  try {
    // Get registry instance
    const registry = SourceRegistry.getInstance();
    console.log('  ✓ Registry instance obtained');

    // Register our custom source
    const mySource = new MyCustomSource();
    registry.register(mySource);
    console.log(`  ✓ Registered source: ${mySource.name}`);

    // List all sources
    const allSources = registry.list();
    console.log(`  ✓ Total sources registered: ${allSources.length}`);

    // Get source by ID
    const retrieved = registry.get('my-custom-source');
    console.log(`  ✓ Retrieved source: ${retrieved?.name}`);

    // Get sources by capability
    const searchableSources = registry.getByCapability('supportsSearch');
    console.log(`  ✓ Searchable sources: ${searchableSources.length}`);

    // ============================================================================
    // Example 3: Using the Source
    // ============================================================================

    console.log('\n\n🎯 Example 3: Using a Source for Manga Operations\n');

    // Search for manga
    const searchResults = await mySource.search('one piece');
    console.log(`  ✓ Search returned ${searchResults.length} result(s)`);

    // Get manga details
    const manga = await mySource.getMangaDetails('sample-manga-1');
    console.log(`  ✓ Retrieved manga: ${manga.title}`);

    // Get chapters
    const chapters = await mySource.getChapters('sample-manga-1');
    console.log(`  ✓ Found ${chapters.length} chapter(s)`);

    // Get pages
    const pages = await mySource.getChapterPages('ch-1');
    console.log(`  ✓ Chapter has ${pages.length} page(s)`);

    // Get latest updates
    if (mySource.getLatest) {
      const latest = await mySource.getLatest();
      console.log(`  ✓ Latest updates: ${latest.length} manga(s)`);
    }

    // Get popular manga
    if (mySource.getPopular) {
      const popular = await mySource.getPopular();
      console.log(`  ✓ Popular manga: ${popular.length} manga(s)`);
    }

    // ============================================================================
    // Example 4: Using the JoyBoy Runtime
    // ============================================================================

    console.log('\n\n🎮 Example 4: JoyBoy Runtime API\n');

    // Browse available sources
    const availableSources = JoyBoy.browseSources();
    console.log(`  ✓ Available sources in registry: ${availableSources.length}`);
    if (availableSources.length > 0) {
      console.log(`    - First source: ${availableSources[0].name}`);
    }

    // Search for sources
    const mangaSources = JoyBoy.searchSources('manga');
    console.log(`  ✓ Sources matching 'manga': ${mangaSources.length}`);

    // Get installed sources
    const installed = JoyBoy.getInstalledSourcesInfo();
    console.log(`  ✓ Installed sources: ${installed.length}`);

    // Get available (not installed) sources
    const available = JoyBoy.getAvailableSourcesInfo();
    console.log(`  ✓ Available for install: ${available.length}`);

    // ============================================================================
    // Example 5: Error Handling
    // ============================================================================

    console.log('\n\n⚠️  Example 5: Error Handling\n');

    try {
      throw new HttpError('Resource not found', 404, 'https://example.com/404');
    } catch (error) {
      if (error instanceof HttpError) {
        console.log(`  ✓ HTTP Error caught: ${error.message} (Status: ${error.statusCode})`);
      }
    }

    try {
      throw new NetworkError('Connection timeout', 'https://example.com');
    } catch (error) {
      if (error instanceof NetworkError) {
        console.log(`  ✓ Network Error caught: ${error.message}`);
      }
    }

    // ============================================================================
    // Example 6: Request and Cache Management
    // ============================================================================

    console.log('\n\n🔧 Example 6: Request and Cache Management\n');

    // RequestManager
    const requestManager = new RequestManager({
      timeout: 15000,
      maxRetries: 3,
      retryDelay: 1000
    });
    console.log('  ✓ RequestManager configured (15s timeout, 3 retries)');

    // CacheManager
    const cacheManager = new CacheManager();
    cacheManager.set('user-data', { id: 1, name: 'Test User' }, 60000);
    const cached = cacheManager.get('user-data');
    console.log(`  ✓ Cache test: stored and retrieved data (${cached?.name})`);
    console.log(`  ✓ Cache size: ${cacheManager.size()} item(s)`);

    // Clean up
    console.log('\n\n🧹 Cleanup\n');
    registry.unregister('my-custom-source');
    console.log('  ✓ Unregistered custom source');
    cacheManager.clear();
    console.log('  ✓ Cleared cache');

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All examples completed successfully!\n');

    // ============================================================================
    // Summary
    // ============================================================================

    console.log('📝 Summary of @joyboy-parser/core capabilities:\n');
    console.log('  1. ✓ Custom source creation (extend BaseSource)');
    console.log('  2. ✓ Source registry management (singleton pattern)');
    console.log('  3. ✓ Manga search, details, chapters, and pages');
    console.log('  4. ✓ JoyBoy runtime for source discovery and installation');
    console.log('  5. ✓ Error handling (HttpError, NetworkError)');
    console.log('  6. ✓ Request management with retry logic');
    console.log('  7. ✓ Built-in caching with TTL support');
    console.log('  8. ✓ Type-safe APIs with TypeScript support');
    console.log('\n💡 Ready to build manga parser applications!\n');

  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
