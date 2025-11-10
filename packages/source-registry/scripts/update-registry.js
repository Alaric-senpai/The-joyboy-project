#!/usr/bin/env node

/**
 * Script to automatically update sources.json by scanning workspace packages
 * 
 * Usage: node scripts/update-registry.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagesDir = join(__dirname, '../../../packages');
const sourcesFile = join(__dirname, '../sources.json');

/**
 * Extract source metadata from package
 */
function extractSourceMetadata(packagePath, packageJson) {
  const sourceId = packageJson.name.replace('@joyboy/source-', '');
  
  // Try to load built source to get metadata
  const distPath = join(packagePath, 'dist/index.js');
  let sourceMetadata = {};
  
  // For now, extract from package.json
  // In production, you might want to import the built module
  
  return {
    id: sourceId,
    name: packageJson.description?.split(' parser')[0] || 
          sourceId.charAt(0).toUpperCase() + sourceId.slice(1),
    version: packageJson.version,
    baseUrl: 'https://example.com', // Should be extracted from source
    packageName: packageJson.name,
    description: packageJson.description || `${sourceId} parser for JoyBoy`,
    official: true,
    tags: packageJson.keywords?.filter(k => 
      k !== 'joyboy' && k !== 'parser' && k !== 'manga'
    ) || [],
    repository: packageJson.repository?.url || packageJson.repository || 
                'https://github.com/yourusername/joyboy',
    installCommand: `npm install ${packageJson.name}`,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Main update function
 */
async function updateRegistry() {
  console.log('🔍 Scanning workspace for source packages...\n');
  
  const sources = [];
  
  try {
    if (!existsSync(packagesDir)) {
      console.error(`❌ Packages directory not found: ${packagesDir}`);
      process.exit(1);
    }

    const packages = readdirSync(packagesDir);
    
    for (const pkg of packages) {
      // Only process source-* packages
      if (!pkg.startsWith('source-') || 
          pkg === 'source-template' || 
          pkg === 'source-registry') {
        continue;
      }
      
      const pkgPath = join(packagesDir, pkg);
      const pkgJsonPath = join(pkgPath, 'package.json');
      
      if (!existsSync(pkgJsonPath)) {
        console.warn(`⚠️  Skipping ${pkg}: package.json not found`);
        continue;
      }
      
      try {
        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
        const metadata = extractSourceMetadata(pkgPath, pkgJson);
        
        sources.push(metadata);
        console.log(`✅ Added: ${metadata.name} (${metadata.packageName})`);
      } catch (error) {
        console.warn(`⚠️  Skipping ${pkg}: ${error.message}`);
      }
    }
    
    if (sources.length === 0) {
      console.warn('\n⚠️  No source packages found');
      return;
    }
    
    // Sort sources by name
    sources.sort((a, b) => a.name.localeCompare(b.name));
    
    // Write to sources.json
    writeFileSync(sourcesFile, JSON.stringify(sources, null, 2) + '\n');
    
    console.log(`\n✅ Registry updated successfully!`);
    console.log(`   Total sources: ${sources.length}`);
    console.log(`   Output: ${sourcesFile}`);
    
  } catch (error) {
    console.error('\n❌ Failed to update registry:', error.message);
    process.exit(1);
  }
}

// Run the update
updateRegistry().catch(console.error);