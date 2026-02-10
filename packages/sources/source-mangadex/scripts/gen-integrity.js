#!/usr/bin/env node
/**
 * Generate SHA-256 integrity hash for the source package
 * Updates both source-meta.json and integrity.json
 * 
 * Usage: pnpm gen-integrity (or node scripts/gen-integrity.js)
 */

import fs from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const distFile = join(process.cwd(), 'dist/index.js');
const sourceMetaFile = join(process.cwd(), 'source-meta.json');
const integrityFile = join(process.cwd(), 'integrity.json');

if (!fs.existsSync(distFile)) {
  console.error('❌ dist/index.js not found. Please run build first:');
  console.error('   pnpm build');
  process.exit(1);
}

const buffer = fs.readFileSync(distFile);
const hash = createHash('sha256').update(buffer).digest('hex');

console.log('\n📦 SHA-256 Hash:', hash, '\n');

// Update source-meta.json if it exists
if (fs.existsSync(sourceMetaFile)) {
  try {
    const meta = JSON.parse(fs.readFileSync(sourceMetaFile, 'utf-8'));
    if (!meta.integrity) {
      meta.integrity = {};
    }
    meta.integrity.sha256 = hash;
    fs.writeFileSync(sourceMetaFile, JSON.stringify(meta, null, 2) + '\n');
    console.log('✅ Updated source-meta.json');
  } catch (error) {
    console.error('❌ Failed to update source-meta.json:', error.message);
  }
}

// Create/update integrity.json
const integrityContent = {
  integrity: {
    sha256: hash
  },
  generatedAt: new Date().toISOString(),
  sourceFile: 'dist/index.js'
};

fs.writeFileSync(integrityFile, JSON.stringify(integrityContent, null, 2) + '\n');
console.log('✅ Updated integrity.json');

console.log('\n✅ Integrity hash generated successfully!');
console.log('   Hash:', hash);
