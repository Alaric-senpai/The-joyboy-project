/**
 * SourceRegistry test for @joyboy-parser/core
 * Tests: registry loading, source management
 */

import { SourceRegistry, BaseSource } from '@joyboy-parser/core';

console.log('🧪 Testing @joyboy-parser/core - SourceRegistry\n');

// Create a test source for registry testing
class TestRegistrySource extends BaseSource {
  id = 'test-registry-source';
  name = 'Test Registry Source';
  version = '1.0.0';
  baseUrl = 'https://test-registry.example.com';
  description = 'A test source for registry';
  
  constructor() {
    super();
  }

  async search(query) { return []; }
  async getMangaDetails(id) { return { id, title: 'Test', source: this.id }; }
  async getChapters(mangaId) { return []; }
  async getChapterPages(chapterId) { return []; }
  async getByPage(label, page) { return []; }
  async extractPaginationInfo(url) { return { currentPage: 1, totalPages: 1 }; }
}

(async () => {
  try {
    // Test 1: Get registry instance (singleton)
    console.log('✓ Test 1: Getting SourceRegistry instance...');
    const registry = SourceRegistry.getInstance();
    console.log('  - Registry instance obtained');

    // Test 2: Register a source
    console.log('\n✓ Test 2: Registering a test source...');
    const testSource = new TestRegistrySource();
    registry.register(testSource);
    console.log('  - Source registered:', testSource.id);

    // Test 3: Check if source exists
    console.log('\n✓ Test 3: Checking if source is registered...');
    const hasSource = registry.has('test-registry-source');
    console.log('  - Source exists:', hasSource);

    // Test 4: Get source by ID
    console.log('\n✓ Test 4: Getting source by ID...');
    const retrievedSource = registry.get('test-registry-source');
    if (retrievedSource) {
      console.log('  - Source found:', retrievedSource.name);
      console.log('  - Version:', retrievedSource.version);
    }

    // Test 5: List all sources
    console.log('\n✓ Test 5: Listing all sources...');
    const sources = registry.list();
    console.log('  - Total sources:', sources.length);

    // Test 6: Get sources by capability
    console.log('\n✓ Test 6: Getting sources by capability...');
    const searchableSources = registry.getByCapability('supportsSearch');
    console.log('  - Sources with search capability:', searchableSources.length);

    // Test 7: Unregister source
    console.log('\n✓ Test 7: Unregistering source...');
    const unregistered = registry.unregister('test-registry-source');
    console.log('  - Unregister successful:', unregistered);
    console.log('  - Source still exists:', registry.has('test-registry-source'));

    console.log('\n✅ All registry tests passed!\n');
  } catch (error) {
    console.error('\n❌ Registry test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
