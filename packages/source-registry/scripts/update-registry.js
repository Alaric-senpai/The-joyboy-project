#!/usr/bin/env node

/**
 * Script to automatically update sources.json by scanning workspace packages
 * 
 * Usage: node scripts/update-registry.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagesDir = join(__dirname, '../../../packages');
const sourcesFile = join(__dirname, '../sources.json');
const registryFile = join(__dirname, '../../../registry/sources.json');

// Source metadata mapping
const sourceMetadataMap = {
  'mangadex': {
    baseUrl: 'https://api.mangadex.org',
    icon: 'https://mangadex.org/favicon.ico',
    websiteUrl: 'https://mangadex.org',
    termsOfServiceUrl: 'https://mangadex.org/terms',
    languages: ['en', 'ja', 'es', 'fr', 'de', 'pt', 'ru', 'zh', 'ko', 'it'],
    tags: ['manga', 'api', 'multi-language', 'popular', 'official'],
    sourceType: 'api',
    requiresAuth: false,
    capabilities: {
      supportsSearch: true,
      supportsTrending: false,
      supportsLatest: true,
      supportsFilters: true,
      supportsPopular: true,
      supportsAuth: false,
      supportsDownload: true,
      supportsBookmarks: true
    }
  },
  'mangafire': {
    baseUrl: 'https://mangafire.to',
    icon: 'https://mangafire.to/favicon.ico',
    websiteUrl: 'https://mangafire.to',
    languages: ['en'],
    tags: ['manga', 'scraper', 'english'],
    sourceType: 'scraper',
    requiresAuth: false,
    capabilities: {
      supportsSearch: true,
      supportsTrending: true,
      supportsLatest: true,
      supportsFilters: true,
      supportsPopular: true,
      supportsAuth: false,
      supportsDownload: true,
      supportsBookmarks: true
    }
  },
  'manhuafast': {
    baseUrl: 'https://manhuafast.com',
    icon: 'https://manhuafast.com/favicon.ico',
    websiteUrl: 'https://manhuafast.com',
    languages: ['en'],
    tags: ['manhua', 'scraper', 'english'],
    sourceType: 'scraper',
    requiresAuth: false,
    capabilities: {
      supportsSearch: true,
      supportsTrending: true,
      supportsLatest: true,
      supportsFilters: false,
      supportsPopular: true,
      supportsAuth: false,
      supportsDownload: true,
      supportsBookmarks: true
    }
  }
};

/**
 * Calculate SHA-256 hash of a file
 */
function calculateHash(filePath) {
  try {
    if (!existsSync(filePath)) {
      return 'pending';
    }
    const content = readFileSync(filePath);
    return createHash('sha256').update(content).digest('hex');
  } catch (error) {
    console.warn(`⚠️  Could not calculate hash for ${filePath}: ${error.message}`);
    return 'pending';
  }
}

/**
 * Extract source metadata from package
 */
function extractSourceMetadata(packagePath, packageJson) {
  const sourceId = packageJson.name.replace('@joyboy-parser/source-', '');
  const metadata = sourceMetadataMap[sourceId] || {};
  
  const distPath = join(packagePath, 'dist/index.js');
  const sha256 = calculateHash(distPath);
  
  const baseRepoUrl = 'https://github.com/Alaric-senpai/The-joyboy-project';
  const cdnBaseUrl = 'https://cdn.jsdelivr.net/gh/Alaric-senpai/The-joyboy-project@main';
  
  return {
    id: sourceId,
    name: packageJson.description?.split(' parser')[0] || 
          sourceId.charAt(0).toUpperCase() + sourceId.slice(1),
    version: packageJson.version,
    baseUrl: metadata.baseUrl || 'https://example.com',
    description: packageJson.description || `${sourceId} parser for JoyBoy`,
    icon: metadata.icon || `https://${sourceId}.com/favicon.ico`,
    author: 'JoyBoy Community',
    repository: `${baseRepoUrl}/tree/main/packages/source-${sourceId}`,
    downloads: {
      stable: `${cdnBaseUrl}/packages/source-${sourceId}/dist/index.js`,
      latest: `${cdnBaseUrl}/packages/source-${sourceId}/dist/index.js`,
      versions: {
        [packageJson.version]: `${cdnBaseUrl}/packages/source-${sourceId}/dist/index.js`
      }
    },
    integrity: {
      sha256: sha256
    },
    metadata: {
      languages: metadata.languages || ['en'],
      nsfw: false,
      official: true,
      tags: metadata.tags || ['manga'],
      lastUpdated: new Date().toISOString(),
      minCoreVersion: packageJson.dependencies?.['@joyboy-parser/core']?.replace(/[\^~]/g, '') || '1.0.0',
      maxCoreVersion: '2.0.0',
      websiteUrl: metadata.websiteUrl || `https://${sourceId}.com`,
      supportUrl: `${baseRepoUrl}/issues`
    },
    legal: {
      disclaimer: `This parser uses ${metadata.sourceType === 'api' ? 'the official API' : 'web scraping'} of ${metadata.websiteUrl || sourceId}. Please respect their terms of service and rate limits. This is an unofficial parser.`,
      sourceType: metadata.sourceType || 'scraper',
      requiresAuth: metadata.requiresAuth || false,
      termsOfServiceUrl: metadata.termsOfServiceUrl
    },
    changelog: [
      {
        version: packageJson.version,
        date: new Date().toISOString(),
        changes: [
          'Initial release',
          'Search functionality',
          'Manga details',
          'Chapter listing',
          'Page loading',
          'Cross-platform compatibility (Web, Node.js, React Native, Expo)'
        ],
        breaking: false
      }
    ],
    statistics: {
      downloads: 0,
      stars: 0,
      rating: 0,
      activeUsers: 0
    },
    capabilities: metadata.capabilities || {
      supportsSearch: true,
      supportsTrending: false,
      supportsLatest: true,
      supportsFilters: false,
      supportsPopular: true,
      supportsAuth: false,
      supportsDownload: true,
      supportsBookmarks: true
    }
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
        console.log(`✅ Added: ${metadata.name} (${metadata.id})`);
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
    
    // Build categories
    const categories = {
      official: sources.filter(s => s.metadata.official).map(s => s.id),
      community: sources.filter(s => !s.metadata.official).map(s => s.id),
      api: sources.filter(s => s.legal.sourceType === 'api').map(s => s.id),
      scraper: sources.filter(s => s.legal.sourceType === 'scraper').map(s => s.id),
      'multi-language': sources.filter(s => s.metadata.languages.length > 1).map(s => s.id),
      'english-only': sources.filter(s => s.metadata.languages.length === 1 && s.metadata.languages[0] === 'en').map(s => s.id),
      nsfw: sources.filter(s => s.metadata.nsfw).map(s => s.id),
      sfw: sources.filter(s => !s.metadata.nsfw).map(s => s.id)
    };
    
    // Build complete registry structure
    const registry = {
      version: '1.0.0',
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalSources: sources.length,
        maintainer: 'JoyBoy Community',
        url: 'https://github.com/Alaric-senpai/The-joyboy-project',
        description: 'Official JoyBoy source registry - Cross-platform manga parser sources',
        license: 'MIT'
      },
      sources,
      categories,
      featured: sources.slice(0, 3).map(s => s.id), // Feature first 3 sources
      deprecated: [],
      notices: [
        {
          type: 'info',
          title: 'Welcome to JoyBoy Registry',
          message: 'This is the official source registry for JoyBoy parsers. All sources are cross-platform compatible with Web, Node.js, React Native, and Expo. Sources are dynamically loaded at runtime for maximum flexibility.',
          date: new Date().toISOString(),
          dismissible: true
        }
      ]
    };
    
    // Add source-specific notices
    if (sources.some(s => s.id === 'mangadex')) {
      registry.notices.push({
        type: 'info',
        title: 'MangaDex Source Available',
        message: 'The official MangaDex API parser is now available! Features include advanced search, multi-language support, and comprehensive metadata. This source uses the official MangaDex API and respects all rate limits.',
        date: new Date().toISOString(),
        dismissible: true
      });
    }
    
    // Write to package sources.json
    writeFileSync(sourcesFile, JSON.stringify(registry, null, 2) + '\n');
    console.log(`✅ Package registry updated: ${sourcesFile}`);
    
    // Write to root registry sources.json
    if (existsSync(dirname(registryFile))) {
      writeFileSync(registryFile, JSON.stringify(registry, null, 2) + '\n');
      console.log(`✅ Root registry updated: ${registryFile}`);
    }
    
    console.log(`\n✅ Registry updated successfully!`);
    console.log(`   Total sources: ${sources.length}`);
    console.log(`   Featured: ${registry.featured.join(', ')}`);
    console.log(`   Categories: ${Object.keys(categories).length}`);
    
  } catch (error) {
    console.error('\n❌ Failed to update registry:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the update
updateRegistry().catch(console.error);