#!/usr/bin/env node

/**
 * Generate SHA-256 integrity hash for a source package
 * 
 * This script calculates the SHA-256 hash of the built dist/index.js file
 * and updates both source-meta.json and integrity.json
 * 
 * Usage: 
 *   node scripts/gen-integrity.js                    # Run from source directory
 *   node scripts/gen-integrity.js /path/to/source   # Run with explicit path
 */

import fs from 'fs';
import { join, resolve } from 'path';
import { createHash } from 'crypto';

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
 * Update JSON file with new integrity hash
 * @param {string} filePath - Path to JSON file
 * @param {string} hash - SHA-256 hash
 * @param {string} fileName - File name for logging
 */
function updateJsonFile(filePath, hash, fileName) {
  if (fs.existsSync(filePath)) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (content.integrity) {
        content.integrity.sha256 = hash;
      } else {
        content.integrity = { sha256: hash };
      }
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
      console.log(`✅ Updated ${fileName}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update ${fileName}: ${error.message}`);
      return false;
    }
  }
  return false;
}

/**
 * Generate integrity hash and update metadata files
 * @param {string} sourceDir - Path to source directory
 */
function generateIntegrity(sourceDir) {
  const distFile = join(sourceDir, 'dist/index.js');
  const sourceMetaFile = join(sourceDir, 'source-meta.json');
  const integrityFile = join(sourceDir, 'integrity.json');

  // Check if dist file exists
  if (!fs.existsSync(distFile)) {
    console.error('❌ dist/index.js not found. Please run build first:');
    console.error('   pnpm build');
    process.exit(1);
  }

  // Calculate hash
  const hash = calculateSha256(distFile);
  console.log(`\n📦 SHA-256 Hash: ${hash}\n`);

  let updated = false;

  // Update source-meta.json
  if (updateJsonFile(sourceMetaFile, hash, 'source-meta.json')) {
    updated = true;
  }

  // Update or create integrity.json
  const integrityContent = {
    integrity: {
      sha256: hash
    },
    generatedAt: new Date().toISOString(),
    sourceFile: 'dist/index.js'
  };
  
  fs.writeFileSync(integrityFile, JSON.stringify(integrityContent, null, 2) + '\n');
  console.log('✅ Updated integrity.json');
  updated = true;

  if (updated) {
    console.log('\n✅ Integrity hash generated successfully!');
    console.log(`   Hash: ${hash}`);
  } else {
    console.log('\n⚠️  No files were updated. Make sure source-meta.json exists.');
  }

  return hash;
}

// Main execution
const args = process.argv.slice(2);
const sourceDir = args[0] ? resolve(args[0]) : process.cwd();

console.log(`🔍 Generating integrity for: ${sourceDir}`);
generateIntegrity(sourceDir);
