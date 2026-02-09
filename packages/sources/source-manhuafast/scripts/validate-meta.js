#!/usr/bin/env node
import fs from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// JSON Schema for RegistrySource
const schema = {
  type: 'object',
  required: ['id', 'name', 'version', 'baseUrl', 'description', 'icon', 'author', 'repository', 'downloads', 'integrity', 'metadata', 'legal', 'changelog', 'statistics', 'capabilities'],
  properties: {
    id: { type: 'string', pattern: '^[a-z0-9-]+$' },
    name: { type: 'string', minLength: 1 },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+' },
    baseUrl: { type: 'string', format: 'uri' },
    description: { type: 'string' },
    icon: { type: 'string' },
    author: { type: 'string' },
    repository: { type: 'string' },
    downloads: {
      type: 'object',
      required: ['stable', 'latest', 'versions'],
      properties: {
        stable: { type: 'string' },
        latest: { type: 'string' },
        versions: { type: 'object' }
      }
    },
    integrity: {
      type: 'object',
      required: ['sha256'],
      properties: {
        sha256: { type: 'string', pattern: '^[a-fA-F0-9]{64}$' },
        sha512: { type: 'string' }
      }
    },
    metadata: {
      type: 'object',
      required: ['languages', 'nsfw', 'official', 'tags', 'lastUpdated', 'minCoreVersion', 'websiteUrl', 'supportUrl'],
      properties: {
        languages: { type: 'array', items: { type: 'string' } },
        nsfw: { type: 'boolean' },
        official: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' } },
        lastUpdated: { type: 'string' },
        minCoreVersion: { type: 'string' },
        maxCoreVersion: { type: 'string' },
        websiteUrl: { type: 'string' },
        supportUrl: { type: 'string' }
      }
    },
    legal: {
      type: 'object',
      required: ['disclaimer', 'sourceType', 'requiresAuth'],
      properties: {
        disclaimer: { type: 'string' },
        sourceType: { type: 'string', enum: ['api', 'scraper', 'hybrid'] },
        requiresAuth: { type: 'boolean' },
        termsOfServiceUrl: { type: 'string' }
      }
    },
    changelog: {
      type: 'array',
      items: {
        type: 'object',
        required: ['version', 'date', 'changes', 'breaking'],
        properties: {
          version: { type: 'string' },
          date: { type: 'string' },
          changes: { type: 'array', items: { type: 'string' } },
          breaking: { type: 'boolean' }
        }
      }
    },
    statistics: {
      type: 'object',
      required: ['downloads', 'stars', 'rating', 'activeUsers'],
      properties: {
        downloads: { type: 'number' },
        stars: { type: 'number' },
        rating: { type: 'number' },
        activeUsers: { type: 'number' }
      }
    },
    capabilities: {
      type: 'object',
      required: ['supportsSearch', 'supportsTrending', 'supportsLatest', 'supportsFilters', 'supportsPopular', 'supportsAuth', 'supportsDownload', 'supportsBookmarks'],
      properties: {
        supportsSearch: { type: 'boolean' },
        supportsTrending: { type: 'boolean' },
        supportsLatest: { type: 'boolean' },
        supportsFilters: { type: 'boolean' },
        supportsPopular: { type: 'boolean' },
        supportsAuth: { type: 'boolean' },
        supportsDownload: { type: 'boolean' },
        supportsBookmarks: { type: 'boolean' }
      }
    }
  }
};

const validate = ajv.compile(schema);

const file = join(process.cwd(), 'source-meta.json');
if (!fs.existsSync(file)) {
  console.error('\u274C source-meta.json not found in project root');
  process.exit(1);
}

const raw = fs.readFileSync(file, 'utf-8');
let meta;
try {
  meta = JSON.parse(raw);
} catch (e) {
  console.error('\u274C Invalid JSON:', e.message);
  process.exit(1);
}

const valid = validate(meta);
if (!valid) {
  console.error('\u274C source-meta.json validation failed:');
  for (const err of validate.errors) {
    console.error('  -', err.instancePath || '/', err.message);
  }
  process.exit(1);
}

// Additional warnings
if (meta.integrity.sha256 === 'CHANGE_ME_SHA256') {
  console.warn('\u26A0\uFE0F  Warning: integrity.sha256 is still set to placeholder CHANGE_ME_SHA256');
}

if (!meta.author) {
  console.warn('\u26A0\uFE0F  Warning: author field is empty');
}

if (!meta.repository) {
  console.warn('\u26A0\uFE0F  Warning: repository field is empty');
}

console.log('\u2705 source-meta.json is valid!');
