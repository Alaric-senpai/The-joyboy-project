#!/usr/bin/env node

/**
 * Test script to verify remote registry functionality with jsDelivr CDN
 */

import { createRemoteRegistry, DEFAULT_REGISTRY_URLS } from './dist/index.js';

async function testRemoteRegistry() {
  console.log('🧪 Testing Remote Registry\n');
  
  try {
    // Test 1: Create registry with jsDelivr (default)
    console.log('Test 1: Creating registry with jsDelivr URL (default)');
    const registry = createRemoteRegistry();
    console.log(`✅ Registry URL: ${DEFAULT_REGISTRY_URLS.jsdelivr}\n`);
    
    // Test 2: Fetch registry data
    console.log('Test 2: Fetching registry data...');
    const data = await registry.fetchRegistry();
    console.log(`✅ Fetched ${data.sources.length} sources`);
    console.log(`   Version: ${data.version}`);
    console.log(`   Last Updated: ${data.metadata.lastUpdated}`);
    console.log(`   Total Sources: ${data.metadata.totalSources}\n`);
    
    // Test 3: Get all sources
    console.log('Test 3: Getting all sources...');
    const sources = await registry.getSources();
    console.log(`✅ Retrieved ${sources.length} sources:`);
    sources.forEach(source => {
      console.log(`   - ${source.name} (${source.id}) v${source.version}`);
      console.log(`     Download: ${source.downloads.stable}`);
    });
    console.log('');
    
    // Test 4: Get specific source
    console.log('Test 4: Getting MangaDex source...');
    const mangadex = await registry.getSource('mangadex');
    if (mangadex) {
      console.log(`✅ Found: ${mangadex.name}`);
      console.log(`   Base URL: ${mangadex.baseUrl}`);
      console.log(`   Languages: ${mangadex.metadata.languages.join(', ')}`);
      console.log(`   Tags: ${mangadex.metadata.tags.join(', ')}\n`);
    } else {
      console.log('⚠️  MangaDex source not found\n');
    }
    
    // Test 5: Search sources
    console.log('Test 5: Searching for "manga"...');
    const searchResults = await registry.searchSources('manga');
    console.log(`✅ Found ${searchResults.length} results:`);
    searchResults.forEach(source => {
      console.log(`   - ${source.name} (${source.id})`);
    });
    console.log('');
    
    // Test 6: Get sources by category
    console.log('Test 6: Getting sources by category...');
    const apiSources = await registry.getSourcesByCategory('api');
    console.log(`✅ API sources: ${apiSources.length}`);
    apiSources.forEach(source => {
      console.log(`   - ${source.name}`);
    });
    console.log('');
    
    // Test 7: Get featured sources
    console.log('Test 7: Getting featured sources...');
    const featured = await registry.getFeaturedSources();
    console.log(`✅ Featured sources: ${featured.length}`);
    featured.forEach(source => {
      console.log(`   - ${source.name}`);
    });
    console.log('');
    
    // Test 8: Get metadata
    console.log('Test 8: Getting registry metadata...');
    const metadata = await registry.getMetadata();
    console.log(`✅ Metadata:`);
    console.log(`   Maintainer: ${metadata.maintainer}`);
    console.log(`   URL: ${metadata.url}`);
    console.log(`   Description: ${metadata.description}`);
    console.log(`   License: ${metadata.license}\n`);
    
    // Test 9: Get notices
    console.log('Test 9: Getting registry notices...');
    const notices = await registry.getNotices();
    console.log(`✅ Notices: ${notices.length}`);
    notices.forEach(notice => {
      console.log(`   [${notice.type.toUpperCase()}] ${notice.title}`);
      console.log(`   ${notice.message}`);
    });
    console.log('');
    
    // Test 10: Cache info
    console.log('Test 10: Checking cache info...');
    const cacheInfo = registry.getCacheInfo();
    console.log(`✅ Cache status: ${cacheInfo.isCached ? 'Cached' : 'Not cached'}`);
    if (cacheInfo.expiresIn) {
      console.log(`   Expires in: ${Math.round(cacheInfo.expiresIn / 1000 / 60)} minutes\n`);
    }
    
    // Test 11: Test with GitHub URL
    console.log('Test 11: Testing with GitHub URL...');
    const githubRegistry = createRemoteRegistry(DEFAULT_REGISTRY_URLS.github);
    const githubData = await githubRegistry.fetchRegistry();
    console.log(`✅ GitHub registry fetched: ${githubData.sources.length} sources\n`);
    
    console.log('🎉 All tests passed!\n');
    console.log('Summary:');
    console.log(`✅ jsDelivr CDN: ${DEFAULT_REGISTRY_URLS.jsdelivr}`);
    console.log(`✅ GitHub Raw: ${DEFAULT_REGISTRY_URLS.github}`);
    console.log(`✅ Total sources available: ${sources.length}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testRemoteRegistry().catch(console.error);
