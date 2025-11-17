#!/usr/bin/env node

/**
 * Registry Update Script
 * 
 * Automates source addition and maintenance to the registry/sources.json
 * 
 * Features:
 * 1. Add sources from external GitHub repository (via source-meta.json URL)
 * 2. Scan and add sources from packages/sources/ folder
 * 3. Validate source metadata
 * 4. Check downloads (stable/latest) availability
 * 5. Prevent duplicates
 * 
 * Usage:
 *   node update-registry.js                    # Scan local sources
 *   node update-registry.js --url <meta-url>   # Add from external URL
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import http from 'http';
import { createHash } from 'crypto';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const execAsync = promisify(exec);

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
  magenta: '\x1b[35m',
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

function header(msg) {
  log(colors.magenta, '\n' + '='.repeat(60));
  log(colors.blue, msg);
  log(colors.magenta, '='.repeat(60));
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
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateSha256(hash) {
  const sha256Regex = /^[a-fA-F0-9]{64}$/;
  return sha256Regex.test(hash);
}

function validateIsoDate(date) {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  if (!isoRegex.test(date)) return false;
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

// HTTP/HTTPS request helper
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const options = {
      headers: {
        'User-Agent': 'JoyBoy-Registry-Updater/1.0'
      },
      timeout: 10000
    };

    client.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, statusCode: res.statusCode }));
    }).on('error', reject).on('timeout', () => {
      reject(new Error('Request timeout'));
    });
  });
}

// Fetch a URL as a Buffer (binary-safe) and follow simple redirects
function fetchBuffer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { headers: { 'User-Agent': 'JoyBoy-Registry-Updater/1.0' }, timeout }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const loc = res.headers.location;
          if (loc) return fetchBuffer(loc).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy(new Error('Request timeout'));
      });
    } catch (err) {
      reject(err);
    }
  });
}

function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

// Verify that a download URL's SHA256 matches the expected hash
async function verifyDownloadSha(downloadUrl, expectedSha) {
  if (!downloadUrl || !expectedSha) return { ok: false, reason: 'missing-params' };
  try {
    const buf = await fetchBuffer(downloadUrl);
    const actual = sha256Hex(buf);
    const ok = actual.toLowerCase() === expectedSha.toLowerCase();
    return { ok, expected: expectedSha.toLowerCase(), actual };
  } catch (err) {
    return { ok: false, reason: 'fetch-failed', error: err };
  }
}

// Check if URL is accessible
async function checkUrlAvailable(url) {
  try {
    const response = await fetchUrl(url);
    return response.statusCode === 200;
  } catch (err) {
    return false;
  }
}

// Fetch JSON from URL
async function fetchJson(url) {
  try {
    const response = await fetchUrl(url);
    return JSON.parse(response.data);
  } catch (err) {
    throw new Error(`Failed to fetch JSON from ${url}: ${err.message}`);
  }
}

// Validate source metadata
function validateSourceMeta(meta) {
  const errors = [];

  // Required fields
  if (!meta.id) errors.push('Missing required field: id');
  else if (!validateId(meta.id)) errors.push(`Invalid id format: ${meta.id}`);

  if (!meta.name) errors.push('Missing required field: name');
  if (!meta.version) errors.push('Missing required field: version');
  else if (!validateSemver(meta.version)) errors.push(`Invalid version format: ${meta.version}`);

  if (!meta.baseUrl) errors.push('Missing required field: baseUrl');
  else if (!validateUrl(meta.baseUrl)) errors.push(`Invalid baseUrl: ${meta.baseUrl}`);

  if (!meta.description) errors.push('Missing required field: description');
  if (!meta.icon) errors.push('Missing required field: icon');
  if (!meta.author) errors.push('Missing required field: author');

  // Downloads object
  if (!meta.downloads) {
    errors.push('Missing required field: downloads');
  } else {
    if (!meta.downloads.stable) errors.push('Missing downloads.stable');
    if (!meta.downloads.latest) errors.push('Missing downloads.latest');
  }

  // Integrity
  if (!meta.integrity || !meta.integrity.sha256) {
    errors.push('Missing integrity.sha256');
  } else if (!validateSha256(meta.integrity.sha256)) {
    errors.push(`Invalid SHA256 hash: ${meta.integrity.sha256}`);
  }

  // Metadata
  if (!meta.metadata) {
    errors.push('Missing metadata object');
  } else {
    if (!meta.metadata.languages || !Array.isArray(meta.metadata.languages)) {
      errors.push('Missing or invalid metadata.languages array');
    }
    if (meta.metadata.lastUpdated && !validateIsoDate(meta.metadata.lastUpdated)) {
      errors.push(`Invalid metadata.lastUpdated date: ${meta.metadata.lastUpdated}`);
    }
  }

  // Legal
  if (!meta.legal) {
    errors.push('Missing legal object');
  } else {
    if (!meta.legal.sourceType) errors.push('Missing legal.sourceType');
    else if (!['api', 'scraper'].includes(meta.legal.sourceType)) {
      errors.push(`Invalid legal.sourceType: ${meta.legal.sourceType}`);
    }
    if (typeof meta.legal.requiresAuth !== 'boolean') {
      errors.push('Missing or invalid legal.requiresAuth');
    }
  }

  // Changelog
  if (!meta.changelog || !Array.isArray(meta.changelog)) {
    errors.push('Missing or invalid changelog array');
  }

  return errors;
}

// Run validate-meta.js script for a source folder
async function runValidateMetaScript(sourceFolder) {
  const validateScriptPath = join(sourceFolder, 'scripts', 'validate-meta.js');
  
  if (!existsSync(validateScriptPath)) {
    return { success: false, error: 'validate-meta.js script not found' };
  }

  try {
    const { stdout, stderr } = await execAsync(`node "${validateScriptPath}"`, {
      cwd: sourceFolder,
      timeout: 10000
    });
    
    // Check for validation success message
    if (stdout.includes('✅') || !stderr) {
      return { success: true };
    } else {
      return { success: false, error: stderr || stdout };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Check downloads availability
async function checkDownloads(downloads) {
  const results = {
    stable: { url: downloads.stable, available: false },
    latest: { url: downloads.latest, available: false }
  };

  info('Checking downloads.stable...');
  results.stable.available = await checkUrlAvailable(downloads.stable);
  if (results.stable.available) {
    success(`  ${downloads.stable}`);
  } else {
    error(`  ${downloads.stable} - NOT ACCESSIBLE`);
  }

  info('Checking downloads.latest...');
  results.latest.available = await checkUrlAvailable(downloads.latest);
  if (results.latest.available) {
    success(`  ${downloads.latest}`);
  } else {
    error(`  ${downloads.latest} - NOT ACCESSIBLE`);
  }

  return results;
}

// Check if source already exists in registry
function isDuplicate(registry, sourceMeta) {
  // Consider duplicates by id, name, repository, or download URLs
  return registry.sources.some(source => {
    if (source.id === sourceMeta.id) return true;
    if (source.name && sourceMeta.name && source.name === sourceMeta.name) return true;
    if (source.repository && sourceMeta.repository && source.repository === sourceMeta.repository) return true;
    if (source.downloads && sourceMeta.downloads) {
      if (source.downloads.stable === sourceMeta.downloads.stable) return true;
      if (source.downloads.latest === sourceMeta.downloads.latest) return true;
    }
    return false;
  });
}

// Add or update source in registry. If duplicate exists, verify integrity and replace when appropriate.
function addSourceToRegistry(registry, sourceMeta) {
  // Find existing by id primarily
  const existingIndex = registry.sources.findIndex(s => s.id === sourceMeta.id);
  if (existingIndex === -1) {
    // No existing source with same id - check other duplicate heuristics
    if (isDuplicate(registry, sourceMeta)) {
      warning(`Source "${sourceMeta.id}" appears duplicated by name/repo/download URL; will attempt to add only if integrity verified`);
      // fallthrough to adding after integrity check
    }

    registry.sources.push(sourceMeta);
    registry.metadata.totalSources = registry.sources.length;
    registry.metadata.lastUpdated = new Date().toISOString();
    success(`Added source "${sourceMeta.id}" to registry`);
    return true;
  }

  // If existing found, compare versions/metadata. If identical, skip.
  const existing = registry.sources[existingIndex];
  const existingStr = JSON.stringify(existing);
  const incomingStr = JSON.stringify(sourceMeta);

  if (existingStr === incomingStr) {
    info(`Source "${sourceMeta.id}" already present and identical - skipping`);
    return false;
  }

  // Different: attempt to verify integrity of the incoming source before replacing
  info(`Source "${sourceMeta.id}" exists but differs. Verifying incoming integrity before replacing...`);
  const expectedSha = sourceMeta.integrity && sourceMeta.integrity.sha256;
  const downloadUrl = sourceMeta.downloads && sourceMeta.downloads.stable;
  if (!expectedSha || !downloadUrl) {
    warning(`Cannot verify integrity for ${sourceMeta.id} (missing expectedSha or download URL) - skipping replacement`);
    return false;
  }

  // NOTE: synchronous code cannot await; callers of addSourceToRegistry expect sync behavior.
  // We'll perform a blocking check by using deasync-like pattern is not available. Instead,
  // update-registry previously awaited downloads before calling addSourceToRegistry.
  // To keep behavior consistent, we signal that caller should call verifyDownloadSha earlier.
  // Here, as a fallback, we'll log the need for verification and skip replacement.
  warning(`Replacement requested for ${sourceMeta.id} but verification must be done prior to calling addSourceToRegistry. Skipping replacement.`);
  return false;
}

// Add or replace a source after verifying integrity. Returns { added, replaced }
async function addOrReplaceInRegistry(registry, sourceMeta, { dryRun = false } = {}) {
  const existingIndex = registry.sources.findIndex(s => s.id === sourceMeta.id);

  // Verify integrity first
  const expectedSha = sourceMeta.integrity && sourceMeta.integrity.sha256;
  const downloadUrl = sourceMeta.downloads && sourceMeta.downloads.stable;
  if (!expectedSha || !downloadUrl) {
    warning(`Skipping ${sourceMeta.id}: missing integrity.sha256 or downloads.stable`);
    return { added: false, replaced: false };
  }

  info(`Verifying integrity for ${sourceMeta.id} before adding/replacing...`);
  const ver = await verifyDownloadSha(downloadUrl, expectedSha);
  if (!ver.ok) {
    error(`Integrity verification failed for ${sourceMeta.id}: ${ver.reason || `${ver.actual} != ${ver.expected}`}` + (ver.error ? ` (${ver.error.message})` : ''));
    return { added: false, replaced: false };
  }

  if (existingIndex === -1) {
    info(`Integrity OK — adding new source ${sourceMeta.id}`);
    if (!dryRun) {
      registry.sources.push(sourceMeta);
      registry.metadata.totalSources = registry.sources.length;
      registry.metadata.lastUpdated = new Date().toISOString();
    }
    success(`Added source "${sourceMeta.id}" to registry`);
    return { added: true, replaced: false };
  }

  // Existing present
  const existing = registry.sources[existingIndex];
  if (JSON.stringify(existing) === JSON.stringify(sourceMeta)) {
    info(`Source ${sourceMeta.id} already present and identical — nothing to do`);
    return { added: false, replaced: false };
  }

  info(`Integrity OK — replacing existing source ${sourceMeta.id}`);
  if (!dryRun) {
    registry.sources[existingIndex] = sourceMeta;
    registry.metadata.lastUpdated = new Date().toISOString();
  }
  success(`Replaced source "${sourceMeta.id}" in registry`);
  return { added: false, replaced: true };
}

// Process a single source from folder
async function processLocalSource(sourceFolder, sourceName) {
  header(`Processing: ${sourceName}`);
  
  const metaPath = join(sourceFolder, 'source-meta.json');
  
  if (!existsSync(metaPath)) {
    error('source-meta.json not found - skipping');
    return null;
  }

  try {
    // Read metadata
    const metaContent = readFileSync(metaPath, 'utf-8');
    const sourceMeta = JSON.parse(metaContent);
    
    info(`Source ID: ${sourceMeta.id}`);
    info(`Version: ${sourceMeta.version}`);

    // Run validate-meta.js script
    info('Running validate-meta.js...');
    const validationResult = await runValidateMetaScript(sourceFolder);
    
    if (!validationResult.success) {
      error(`Validation failed: ${validationResult.error}`);
      warning('Skipping this source');
      return null;
    }
    success('Validation passed');

    // Validate metadata structure
    info('Validating metadata structure...');
    const errors = validateSourceMeta(sourceMeta);
    if (errors.length > 0) {
      error('Metadata validation errors:');
      errors.forEach(err => error(`  - ${err}`));
      warning('Skipping this source');
      return null;
    }
    success('Metadata structure valid');

    // Check downloads availability
    const downloadResults = await checkDownloads(sourceMeta.downloads);
    
    if (!downloadResults.stable.available || !downloadResults.latest.available) {
      error('One or more download URLs are not accessible');
      warning('Skipping this source');
      return null;
    }

    success('All checks passed!');
    return sourceMeta;

  } catch (err) {
    error(`Error processing source: ${err.message}`);
    return null;
  }
}

// Scan packages/sources folder
async function scanLocalSources() {
  const sourcesDir = resolve(__dirname, '..', 'packages', 'sources');
  
  info(`Scanning directory: ${sourcesDir}`);
  
  if (!existsSync(sourcesDir)) {
    error('packages/sources directory not found');
    return [];
  }

  const entries = readdirSync(sourcesDir);
  const sourceFolders = entries.filter(entry => {
    const fullPath = join(sourcesDir, entry);
    return statSync(fullPath).isDirectory();
  });

  info(`Found ${sourceFolders.length} source folder(s)`);

  const validSources = [];

  for (const folder of sourceFolders) {
    const sourceFolder = join(sourcesDir, folder);
    const sourceMeta = await processLocalSource(sourceFolder, folder);
    
    if (sourceMeta) {
      validSources.push(sourceMeta);
    }
  }

  return validSources;
}

// Process external source from URL
async function processExternalSource(metaUrl) {
  header(`Processing External Source: ${metaUrl}`);

  try {
    info('Fetching source-meta.json...');
    const sourceMeta = await fetchJson(metaUrl);
    
    info(`Source ID: ${sourceMeta.id}`);
    info(`Version: ${sourceMeta.version}`);

    // Validate metadata structure
    info('Validating metadata structure...');
    const errors = validateSourceMeta(sourceMeta);
    if (errors.length > 0) {
      error('Metadata validation errors:');
      errors.forEach(err => error(`  - ${err}`));
      return null;
    }
    success('Metadata structure valid');

    // Check downloads availability
    const downloadResults = await checkDownloads(sourceMeta.downloads);
    
    if (!downloadResults.stable.available || !downloadResults.latest.available) {
      error('One or more download URLs are not accessible');
      return null;
    }

    success('All checks passed!');
    return sourceMeta;

  } catch (err) {
    error(`Error processing external source: ${err.message}`);
    return null;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const registryPath = join(__dirname, 'sources.json');

  // Load registry
  let registry;
  try {
    const registryContent = readFileSync(registryPath, 'utf-8');
    registry = JSON.parse(registryContent);
  } catch (err) {
    error(`Failed to load registry: ${err.message}`);
    process.exit(1);
  }

  info(`Current registry: ${registry.sources.length} source(s)`);

  let sourcesToAdd = [];
  // Check if URL provided via CLI args
  const urlIndex = args.indexOf('--url');
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    const metaUrl = args[urlIndex + 1];
    if (!validateUrl(metaUrl)) {
      error('Invalid URL provided');
      process.exit(1);
    }
    const sourceMeta = await processExternalSource(metaUrl);
    if (sourceMeta) sourcesToAdd.push(sourceMeta);
  } else {
    // No CLI URL provided - prompt the user interactively
    const rl = readline.createInterface({ input, output });
    try {
      const answer = await rl.question('Enter a source-meta.json URL to add (leave empty to scan local packages/sources): ');
      const metaUrl = answer && answer.trim();
      if (metaUrl) {
        if (!validateUrl(metaUrl)) {
          error('Invalid URL provided');
          rl.close();
          process.exit(1);
        }
        const sourceMeta = await processExternalSource(metaUrl);
        if (sourceMeta) sourcesToAdd.push(sourceMeta);
      } else {
        // Scan local sources
        header('Scanning Local Sources');
        sourcesToAdd = await scanLocalSources();
      }
    } finally {
      rl.close();
    }
  }

  // Add sources to registry
  if (sourcesToAdd.length === 0) {
    warning('No valid sources found to add');
    process.exit(0);
  }

  header('Adding Sources to Registry');
  
  let addedCount = 0;
  let replacedCount = 0;
  for (const source of sourcesToAdd) {
    // Verify and add/replace (do not modify if verification fails)
    const res = await addOrReplaceInRegistry(registry, source, { dryRun: false });
    if (res.added) addedCount++;
    if (res.replaced) replacedCount++;
  }

  if (addedCount > 0 || replacedCount > 0) {
    // Save registry
    try {
      writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
      success(`\nRegistry updated successfully!`);
      if (addedCount > 0) success(`Added ${addedCount} new source(s)`);
      if (replacedCount > 0) success(`Replaced ${replacedCount} existing source(s)`);
      success(`Total sources: ${registry.sources.length}`);
    } catch (err) {
      error(`Failed to save registry: ${err.message}`);
      process.exit(1);
    }
  } else {
    info('\nNo new sources added (all sources already exist or failed validation)');
  }
}

// Run
main().catch(err => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
