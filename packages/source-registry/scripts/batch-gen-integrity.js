#!/usr/bin/env node

/**
 * Batch update integrity hashes for all sources in the workspace
 * 
 * This script scans all source packages, builds them if needed,
 * and updates their integrity hashes in source-meta.json and integrity.json
 * 
 * Usage: 
 *   node scripts/batch-gen-integrity.js           # Update all sources
 *   node scripts/batch-gen-integrity.js --build   # Build first, then update
 */

import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcesDir = join(__dirname, '../../sources');

/**
 * Calculate SHA-256 hash of a file
 * @param {string} filePath - Path to the file
 * @returns {string} SHA-256 hash in hex format
 */
function calculateSha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Find all source packages in the workspace
 * @returns {Array<{name: string, path: string}>} Array of source info
 */
function findSourcePackages() {
  const sources = [];
  
  if (!fs.existsSync(sourcesDir)) {
    console.warn('⚠️  Sources directory not found:', sourcesDir);
    return sources;
  }

  const dirs = fs.readdirSync(sourcesDir, { withFileTypes: true });
  
  for (const dir of dirs) {
    if (dir.isDirectory() && dir.name.startsWith('source-')) {
      const packageJsonPath = join(sourcesDir, dir.name, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        sources.push({
          name: dir.name,
          path: join(sourcesDir, dir.name)
        });
      }
    }
  }

  return sources;
}

/**
 * Update integrity for a single source
 * @param {string} sourcePath - Path to the source directory
 * @param {boolean} shouldBuild - Whether to build before generating hash
 * @returns {{success: boolean, hash: string|null}}
 */
function updateSourceIntegrity(sourcePath, shouldBuild = false) {
  const distFile = join(sourcePath, 'dist/index.js');
  const sourceMetaFile = join(sourcePath, 'source-meta.json');
  const integrityFile = join(sourcePath, 'integrity.json');

  // Build if requested
  if (shouldBuild) {
    try {
      console.log('   Building...');
      execSync('pnpm build', { cwd: sourcePath, stdio: 'pipe' });
    } catch (error) {
      console.error(`   ❌ Build failed: ${error.message}`);
      return { success: false, hash: null };
    }
  }

  // Check if dist file exists
  if (!fs.existsSync(distFile)) {
    console.warn('   ⚠️  dist/index.js not found (run with --build)');
    return { success: false, hash: null };
  }

  // Calculate hash
  const hash = calculateSha256(distFile);

  // Update source-meta.json
  if (fs.existsSync(sourceMetaFile)) {
    try {
      const content = JSON.parse(fs.readFileSync(sourceMetaFile, 'utf-8'));
      if (!content.integrity) {
        content.integrity = {};
      }
      content.integrity.sha256 = hash;
      fs.writeFileSync(sourceMetaFile, JSON.stringify(content, null, 2) + '\n');
    } catch (error) {
      console.error(`   ❌ Failed to update source-meta.json: ${error.message}`);
    }
  }

  // Update integrity.json
  const integrityContent = {
    integrity: {
      sha256: hash
    },
    generatedAt: new Date().toISOString(),
    sourceFile: 'dist/index.js'
  };
  fs.writeFileSync(integrityFile, JSON.stringify(integrityContent, null, 2) + '\n');

  return { success: true, hash };
}

// Main execution
const args = process.argv.slice(2);
const shouldBuild = args.includes('--build');

console.log('🔍 Scanning for source packages...\n');

const sources = findSourcePackages();

if (sources.length === 0) {
  console.log('No source packages found.');
  process.exit(0);
}

console.log(`Found ${sources.length} source package(s):\n`);

const results = [];

for (const source of sources) {
  console.log(`📦 ${source.name}`);
  const result = updateSourceIntegrity(source.path, shouldBuild);
  
  if (result.success) {
    console.log(`   ✅ Hash: ${result.hash}`);
    results.push({ name: source.name, hash: result.hash, success: true });
  } else {
    results.push({ name: source.name, hash: null, success: false });
  }
  console.log('');
}

// Summary
const successful = results.filter(r => r.success).length;
const failed = results.filter(r => !r.success).length;

console.log('━'.repeat(50));
console.log(`\n✅ ${successful} succeeded, ❌ ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
