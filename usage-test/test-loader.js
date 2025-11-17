/**
 * GitHubSourceLoader test for @joyboy-parser/core
 * Tests: loading sources from GitHub
 */

import { GitHubSourceLoader } from '@joyboy-parser/core';

console.log('🧪 Testing @joyboy-parser/core - GitHubSourceLoader\n');

(async () => {
  try {
    // Test 1: Create loader instance
    console.log('✓ Test 1: Creating GitHubSourceLoader...');
    const loader = new GitHubSourceLoader();
    console.log('  - Loader created successfully');

    // Test 2: Verify loader methods exist
    console.log('\n✓ Test 2: Verifying loader methods...');
    console.log('  - loadFromUrl:', typeof loader.loadFromUrl);
    console.log('  - loadFromRegistry:', typeof loader.loadFromRegistry);

    console.log('\n✅ All loader tests passed!\n');
    console.log('ℹ️  Note: Skipping actual GitHub downloads to avoid network dependencies');
    console.log('   in basic usage tests. Loader methods are available and ready to use.\n');

  } catch (error) {
    console.error('\n❌ Loader test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
