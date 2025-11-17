#!/bin/bash

# Quick External Test Script
# Tests packages installed from npm

echo "🧪 Testing JoyBoy packages from npm"
echo "===================================="
echo ""

# Create temp directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

echo "📁 Test directory: $TEST_DIR"
echo ""

# Create package.json
cat > package.json << 'EOF'
{
  "name": "joyboy-external-test",
  "version": "1.0.0",
  "type": "module"
}
EOF

# Install packages
echo "📦 Installing packages from npm..."
npm install @joyboy-parser/core@1.1.1 @joyboy-parser/source-registry@1.1.1 @joyboy-parser/types@1.1.1

if [ $? -ne 0 ]; then
    echo "❌ Installation failed!"
    exit 1
fi

echo ""
echo "✅ Packages installed successfully"
echo ""

# Create test file
cat > test.js << 'EOF'
import { JoyBoy } from '@joyboy-parser/core';

console.log('🔍 Testing source browsing and installation...\n');

async function test() {
  try {
    // Browse sources
    const sources = await JoyBoy.browseSources();
    console.log(`✅ Found ${sources.length} source(s)\n`);
    
    if (sources.length > 0) {
      const source = sources[0];
      console.log(`📦 Installing ${source.name}...`);
      
      const installed = await JoyBoy.installSource(
        source.id,
        (progress, status) => {
          console.log(`  [${progress}%] ${status}`);
        }
      );
      
      console.log(`\n✅ Successfully installed: ${installed.name}`);
      console.log(`   Version: ${installed.version}`);
      console.log(`   ID: ${installed.id}\n`);
      
      // Quick search test
      console.log('🔍 Testing search...');
      const results = await installed.search({ query: 'test' });
      console.log(`✅ Search works! Found ${results.length} results\n`);
      
      console.log('🎉 All tests passed!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
EOF

# Run test
echo "🚀 Running test..."
echo ""
node test.js

# Cleanup
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ External test successful!"
    echo ""
    echo "🧹 Cleaning up..."
    cd /
    rm -rf "$TEST_DIR"
    echo "✨ Done!"
else
    echo ""
    echo "❌ Test failed! Test directory preserved at: $TEST_DIR"
    exit 1
fi
