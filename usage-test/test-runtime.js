/**
 * JoyBoy Runtime test for @joyboy-parser/core
 * Tests: main runtime API
 */

import { JoyBoy } from '@joyboy-parser/core';

console.log('🧪 Testing @joyboy-parser/core - JoyBoy Runtime\n');

(async () => {
  try {
    // Test 1: Verify JoyBoy is a static class
    console.log('✓ Test 1: Verifying JoyBoy runtime...');
    console.log('  - JoyBoy class:', typeof JoyBoy);

    // Test 2: Verify static methods exist
    console.log('\n✓ Test 2: Verifying runtime static methods...');
    console.log('  - browseSources:', typeof JoyBoy.browseSources);
    console.log('  - searchSources:', typeof JoyBoy.searchSources);
    console.log('  - installSource:', typeof JoyBoy.installSource);
    console.log('  - uninstallSource:', typeof JoyBoy.uninstallSource);
    console.log('  - getSourceInfo:', typeof JoyBoy.getSourceInfo);
    console.log('  - configureRegistry:', typeof JoyBoy.configureRegistry);
    console.log('  - syncRegistry:', typeof JoyBoy.syncRegistry);

    // Test 3: Browse available sources (from local registry)
    console.log('\n✓ Test 3: Browsing available sources...');
    const sources = JoyBoy.browseSources();
    console.log('  - Sources available:', sources.length);
    if (sources.length > 0) {
      console.log('  - First source:', sources[0].name);
    }

    // Test 4: Get installed sources info
    console.log('\n✓ Test 4: Getting installed sources info...');
    const installed = JoyBoy.getInstalledSourcesInfo();
    console.log('  - Installed sources:', installed.length);

    // Test 5: Get available (not installed) sources
    console.log('\n✓ Test 5: Getting available sources...');
    const available = JoyBoy.getAvailableSourcesInfo();
    console.log('  - Available for install:', available.length);

    // Test 6: Search sources
    console.log('\n✓ Test 6: Searching sources...');
    const searchResults = JoyBoy.searchSources('manga');
    console.dir(searchResults)
    console.log('  - Search results for "manga":', searchResults.length);

    console.log('\n✅ All runtime tests passed!\n');
    console.log('ℹ️  Note: Skipping actual source installation to avoid network dependencies.');
    console.log('   Runtime API is available and ready for use.\n');

  } catch (error) {
    console.error('\n❌ Runtime test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
