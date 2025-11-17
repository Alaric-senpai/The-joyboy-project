#!/usr/bin/env node

/**
 * Registry Validation Script
 * 
 * Validates the structure and content of registry/sources.json
 * Usage: node validate-registry.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function error(msg) {
  log(colors.red, '❌', msg);
}

function success(msg) {
  log(colors.green, '✅', msg);
}

function warning(msg) {
  log(colors.yellow, '⚠️', msg);
}

function info(msg) {
  log(colors.cyan, 'ℹ️', msg);
}

// Validation functions
function validateSemver(version) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
  return semverRegex.test(version);
}

function validateId(id) {
  const idRegex = /^[a-z][a-z0-9-]*$/;
  return idRegex.test(id);
}

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateSha256(hash) {
  const sha256Regex = /^[a-f0-9]{64}$/;
  return sha256Regex.test(hash);
}

function validateIsoDate(date) {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  if (!isoRegex.test(date)) return false;
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

function validateLanguageCode(code) {
  // ISO 639-1 2-letter codes
  const validCodes = [
    'en', 'ja', 'es', 'fr', 'de', 'pt', 'ru', 'zh', 'ko', 'it',
    'ar', 'nl', 'pl', 'tr', 'vi', 'th', 'id', 'hi', 'sv', 'no',
  ];
  return validCodes.includes(code);
}

function validateRegistry(registry) {
  let errors = 0;
  let warnings = 0;

  // Validate root structure
  info('Validating root structure...');
  
  if (!registry.version) {
    error('Missing registry version');
    errors++;
  } else if (!validateSemver(registry.version)) {
    error(`Invalid registry version format: ${registry.version}`);
    errors++;
  } else {
    success(`Registry version: ${registry.version}`);
  }

  // Validate metadata
  info('\nValidating metadata...');
  
  if (!registry.metadata) {
    error('Missing metadata object');
    errors++;
  } else {
    const meta = registry.metadata;
    
    if (!meta.lastUpdated) {
      error('Missing metadata.lastUpdated');
      errors++;
    } else if (!validateIsoDate(meta.lastUpdated)) {
      error(`Invalid metadata.lastUpdated format: ${meta.lastUpdated}`);
      errors++;
    }

    if (typeof meta.totalSources !== 'number') {
      error('Missing or invalid metadata.totalSources');
      errors++;
    } else if (meta.totalSources !== registry.sources?.length) {
      warning(`metadata.totalSources (${meta.totalSources}) doesn't match actual sources count (${registry.sources?.length})`);
      warnings++;
    }

    if (!meta.maintainer) {
      error('Missing metadata.maintainer');
      errors++;
    }

    if (!meta.url) {
      error('Missing metadata.url');
      errors++;
    } else if (!validateUrl(meta.url)) {
      error(`Invalid metadata.url: ${meta.url}`);
      errors++;
    }

    success(`Metadata validated`);
  }

  // Validate sources
  info('\nValidating sources...');
  
  if (!Array.isArray(registry.sources)) {
    error('sources must be an array');
    errors++;
    return { errors, warnings };
  }

  if (registry.sources.length === 0) {
    warning('No sources in registry');
    warnings++;
  }

  const sourceIds = new Set();

  registry.sources.forEach((source, index) => {
    info(`\n  [${index + 1}/${registry.sources.length}] Validating ${source.name || 'unnamed source'}...`);

    // Core fields
    if (!source.id) {
      error(`    Missing id`);
      errors++;
    } else if (!validateId(source.id)) {
      error(`    Invalid id format: ${source.id}`);
      errors++;
    } else if (sourceIds.has(source.id)) {
      error(`    Duplicate source id: ${source.id}`);
      errors++;
    } else {
      sourceIds.add(source.id);
    }

    if (!source.name) {
      error(`    Missing name`);
      errors++;
    }

    if (!source.version) {
      error(`    Missing version`);
      errors++;
    } else if (!validateSemver(source.version)) {
      error(`    Invalid version format: ${source.version}`);
      errors++;
    }

    if (!source.baseUrl) {
      error(`    Missing baseUrl`);
      errors++;
    } else if (!validateUrl(source.baseUrl)) {
      error(`    Invalid baseUrl: ${source.baseUrl}`);
      errors++;
    }

    if (!source.description) {
      error(`    Missing description`);
      errors++;
    }

    if (!source.author) {
      error(`    Missing author`);
      errors++;
    }

    if (!source.repository) {
      error(`    Missing repository`);
      errors++;
    } else if (!validateUrl(source.repository)) {
      error(`    Invalid repository URL: ${source.repository}`);
      errors++;
    }

    // Downloads
    if (!source.downloads) {
      error(`    Missing downloads object`);
      errors++;
    } else {
      if (!source.downloads.stable) {
        error(`    Missing downloads.stable`);
        errors++;
      } else if (!validateUrl(source.downloads.stable)) {
        error(`    Invalid downloads.stable URL: ${source.downloads.stable}`);
        errors++;
      }
    }

    // Integrity
    if (!source.integrity) {
      error(`    Missing integrity object`);
      errors++;
    } else {
      if (!source.integrity.sha256) {
        error(`    Missing integrity.sha256`);
        errors++;
      } else if (!validateSha256(source.integrity.sha256)) {
        error(`    Invalid SHA-256 hash format: ${source.integrity.sha256}`);
        errors++;
      }
    }

    // Metadata
    if (!source.metadata) {
      error(`    Missing metadata object`);
      errors++;
    } else {
      const meta = source.metadata;

      if (!Array.isArray(meta.languages) || meta.languages.length === 0) {
        error(`    Missing or empty metadata.languages`);
        errors++;
      } else {
        meta.languages.forEach(lang => {
          if (!validateLanguageCode(lang)) {
            warning(`    Invalid language code: ${lang}`);
            warnings++;
          }
        });
      }

      if (typeof meta.nsfw !== 'boolean') {
        error(`    Missing or invalid metadata.nsfw (must be boolean)`);
        errors++;
      }

      if (typeof meta.official !== 'boolean') {
        error(`    Missing or invalid metadata.official (must be boolean)`);
        errors++;
      }

      if (!Array.isArray(meta.tags) || meta.tags.length === 0) {
        error(`    Missing or empty metadata.tags`);
        errors++;
      }

      if (!meta.lastUpdated) {
        error(`    Missing metadata.lastUpdated`);
        errors++;
      } else if (!validateIsoDate(meta.lastUpdated)) {
        error(`    Invalid metadata.lastUpdated format: ${meta.lastUpdated}`);
        errors++;
      }

      if (!meta.minCoreVersion) {
        error(`    Missing metadata.minCoreVersion`);
        errors++;
      } else if (!validateSemver(meta.minCoreVersion)) {
        error(`    Invalid metadata.minCoreVersion format: ${meta.minCoreVersion}`);
        errors++;
      }
    }

    // Legal
    if (!source.legal) {
      error(`    Missing legal object`);
      errors++;
    } else {
      if (!source.legal.sourceType) {
        error(`    Missing legal.sourceType`);
        errors++;
      } else if (!['api', 'scraper', 'hybrid'].includes(source.legal.sourceType)) {
        error(`    Invalid legal.sourceType: ${source.legal.sourceType}`);
        errors++;
      }

      if (typeof source.legal.requiresAuth !== 'boolean') {
        error(`    Missing or invalid legal.requiresAuth (must be boolean)`);
        errors++;
      }
    }

    // Changelog
    if (!Array.isArray(source.changelog) || source.changelog.length === 0) {
      warning(`    Missing or empty changelog`);
      warnings++;
    } else {
      source.changelog.forEach((entry, i) => {
        if (!entry.version || !validateSemver(entry.version)) {
          error(`    Invalid changelog[${i}].version`);
          errors++;
        }
        if (!entry.date || !validateIsoDate(entry.date)) {
          error(`    Invalid changelog[${i}].date`);
          errors++;
        }
        if (!Array.isArray(entry.changes) || entry.changes.length === 0) {
          error(`    Missing or empty changelog[${i}].changes`);
          errors++;
        }
      });
    }
  });

  // Validate categories
  if (registry.categories) {
    info('\nValidating categories...');
    Object.entries(registry.categories).forEach(([category, ids]) => {
      if (!Array.isArray(ids)) {
        error(`Category ${category} must be an array`);
        errors++;
      } else {
        ids.forEach(id => {
          if (!sourceIds.has(id)) {
            error(`Category ${category} references non-existent source: ${id}`);
            errors++;
          }
        });
      }
    });
  }

  // Validate featured
  if (Array.isArray(registry.featured)) {
    info('\nValidating featured sources...');
    registry.featured.forEach(id => {
      if (!sourceIds.has(id)) {
        error(`Featured list references non-existent source: ${id}`);
        errors++;
      }
    });
  }

  // Validate deprecated
  if (Array.isArray(registry.deprecated)) {
    info('\nValidating deprecated sources...');
    registry.deprecated.forEach(id => {
      if (!sourceIds.has(id)) {
        warning(`Deprecated list references non-existent source: ${id}`);
        warnings++;
      }
    });
  }

  return { errors, warnings };
}

// Helper: fetch a remote URL into a Buffer using https
function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    try {
      const req = https.get(url, { timeout: 30000 }, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} when fetching ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy(new Error('Request timed out'));
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Helper: compute sha256 hex digest of a Buffer
function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

// Verify integrity for a single source by downloading stable URL
async function verifySourceIntegrity(source) {
  if (!source?.downloads?.stable) {
    return { ok: false, reason: 'no-stable-url' };
  }

  try {
    const buf = await fetchBuffer(source.downloads.stable);
    const actual = sha256Hex(buf);
    const expected = source.integrity?.sha256?.toLowerCase();
    if (!expected) return { ok: false, reason: 'no-integrity-declared' };
    const ok = actual === expected;
    return { ok, expected, actual };
  } catch (e) {
    return { ok: false, reason: 'fetch-failed', error: e };
  }
}

// Merge remote registry into local registry: verify integrity and replace or add
async function mergeRemoteRegistry(registry, remoteUrl, { dryRun = false } = {}) {
  info(`Fetching remote registry: ${remoteUrl}`);
  let remoteDataRaw;
  try {
    const buf = await fetchBuffer(remoteUrl);
    remoteDataRaw = buf.toString('utf-8');
  } catch (e) {
    error(`Failed to fetch remote registry: ${e.message}`);
    return { added: 0, updated: 0, skipped: 0, errors: 1 };
  }

  let remote;
  try {
    remote = JSON.parse(remoteDataRaw);
  } catch (e) {
    error(`Remote registry JSON parse error: ${e.message}`);
    return { added: 0, updated: 0, skipped: 0, errors: 1 };
  }

  if (!Array.isArray(remote.sources)) {
    error('Remote registry missing sources array');
    return { added: 0, updated: 0, skipped: 0, errors: 1 };
  }

  const localById = new Map((registry.sources || []).map((s) => [s.id, s]));
  let added = 0, updated = 0, skipped = 0, errs = 0;

  for (const rsrc of remote.sources) {
    // basic validation of id and urls
    if (!rsrc.id || !validateId(rsrc.id)) {
      warning(`Skipping remote source with invalid id: ${rsrc.id}`);
      skipped++;
      continue;
    }

    // verify integrity before touching local
    info(`Verifying remote source: ${rsrc.id}`);
    const result = await verifySourceIntegrity(rsrc);
    if (!result.ok) {
      warning(`  Integrity check failed for ${rsrc.id}: ${result.reason || ''} ${result.error ? result.error.message : ''}`);
      skipped++;
      continue;
    }

    const local = localById.get(rsrc.id);
    if (!local) {
      info(`  Adding new source: ${rsrc.id}`);
      if (!dryRun) registry.sources.push(rsrc);
      added++;
      continue;
    }

    // Compare local vs remote. If different, replace local with remote
    const localStr = JSON.stringify(local);
    const remoteStr = JSON.stringify(rsrc);
    if (localStr !== remoteStr) {
      info(`  Replacing existing source ${rsrc.id} with verified remote version`);
      if (!dryRun) {
        const idx = registry.sources.findIndex((s) => s.id === rsrc.id);
        if (idx > -1) registry.sources[idx] = rsrc;
      }
      updated++;
    } else {
      info(`  No changes for ${rsrc.id}`);
    }
  }

  // Update metadata
  if (!dryRun) {
    registry.metadata = registry.metadata || {};
    registry.metadata.lastUpdated = new Date().toISOString();
    registry.metadata.totalSources = (registry.sources || []).length;
  }

  return { added, updated, skipped, errors: errs };
}

// CLI arg parsing and main async wrapper
(async () => {
  try {
    info('Starting registry validation...\n');

    const registryPath = join(__dirname, 'sources.json');
    const content = readFileSync(registryPath, 'utf-8');
    
    let registry;
    try {
      registry = JSON.parse(content);
      success('JSON syntax is valid\n');
    } catch (e) {
      error(`JSON syntax error: ${e.message}`);
      process.exit(1);
    }

    const { errors, warnings } = validateRegistry(registry);

    console.log('\n' + '='.repeat(60));
    console.log('\nValidation Summary:');
    console.log(`  Total sources: ${registry.sources?.length || 0}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Warnings: ${warnings}`);

    // parse CLI options
    const args = process.argv.slice(2);
    const mergeIndex = args.indexOf('--merge');
    const dryRun = args.includes('--dry-run') || args.includes('-n');
    const checkIntegrityOnly = args.includes('--check-integrity');

    if (errors === 0 && warnings === 0) {
      success('\n✨ Registry is valid!');
    } else if (errors === 0) {
      warning(`\n⚠️  Registry is valid but has ${warnings} warning(s)`);
    } else {
      error(`\n❌ Registry validation failed with ${errors} error(s) and ${warnings} warning(s)`);
      // continue to allow integrity checks/merge in case user wants to attempt repair
    }

    // If user requested integrity check for all sources
    if (checkIntegrityOnly) {
      info('\nChecking integrity of all sources...');
      let failed = 0;
      for (const s of registry.sources || []) {
        const res = await verifySourceIntegrity(s);
        if (res.ok) {
          success(`  ${s.id}: OK`);
        } else {
          error(`  ${s.id}: FAILED (${res.reason || (res.actual && res.expected ? `expected ${res.expected}, got ${res.actual}` : 'unknown')})`);
          failed++;
        }
      }
      if (failed > 0) {
        error(`\nIntegrity check failed for ${failed} source(s)`);
        process.exit(2);
      } else {
        success('\nAll source integrities verified');
        process.exit(0);
      }
    }

    // If --merge <url> provided, fetch remote registry and merge
    if (mergeIndex !== -1) {
      const remoteUrl = args[mergeIndex + 1];
      if (!remoteUrl) {
        error('Missing URL for --merge');
        process.exit(1);
      }
      const result = await mergeRemoteRegistry(registry, remoteUrl, { dryRun });
      info(`\nMerge result: added=${result.added}, updated=${result.updated}, skipped=${result.skipped}, errors=${result.errors}`);
      if (!dryRun) {
        writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
        success('Wrote updated registry to disk');
      } else {
        warning('Dry run: no changes written');
      }
      process.exit(0);
    }

    // If no special flags, exit according to validation
    if (errors === 0) {
      process.exit(0);
    }
    process.exit(1);
  } catch (e) {
    error(`Fatal error: ${e.message}`);
    console.error(e);
    process.exit(1);
  }
})();
