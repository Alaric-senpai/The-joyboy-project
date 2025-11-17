#!/usr/bin/env node

import https from 'https';
import http from 'http';
import { createHash } from 'crypto';

function fetchBuffer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { headers: { 'User-Agent': 'JoyBoy-Check-Integrity/1.0' }, timeout }, (res) => {
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
      req.on('timeout', () => req.destroy(new Error('Request timeout')));
    } catch (err) {
      reject(err);
    }
  });
}

function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const args = process.argv.slice(2);

  // If two args provided, behave as single-file checker for backward compatibility
  if (args.length === 2) {
    const [url, expected] = args;
    console.log(`Checking integrity for: ${url}`);
    try {
      const buf = await fetchBuffer(url);
      const actual = sha256Hex(buf);
      console.log(` Expected: ${expected.toLowerCase()}`);
      console.log(` Actual:   ${actual}`);
      if (actual === expected.toLowerCase()) {
        console.log('✅ Integrity OK');
        process.exit(0);
      } else {
        console.error('❌ Integrity MISMATCH');
        process.exit(2);
      }
    } catch (err) {
      console.error('Error fetching URL:', err.message);
      process.exit(3);
    }
  }

  // No args: read registry/sources.json and verify all sources
  try {
    const registryPath = join(__dirname, 'sources.json');
    const content = readFileSync(registryPath, 'utf-8');
    const registry = JSON.parse(content);
    if (!Array.isArray(registry.sources) || registry.sources.length === 0) {
      console.error('No sources found in registry/sources.json');
      process.exit(1);
    }

    let failed = 0;
    for (const s of registry.sources) {
      const id = s.id || '(unknown id)';
      const url = s.downloads?.stable;
      const expected = s.integrity?.sha256;
      if (!url) {
        console.error(`${id}: missing downloads.stable`);
        failed++;
        continue;
      }
      if (!expected) {
        console.error(`${id}: missing integrity.sha256`);
        failed++;
        continue;
      }

      process.stdout.write(`${id}: fetching... `);
      try {
        const buf = await fetchBuffer(url);
        const actual = sha256Hex(buf);
        if (actual === expected.toLowerCase()) {
          console.log('OK');
        } else {
          console.error(`MISMATCH (expected ${expected.toLowerCase()}, got ${actual})`);
          failed++;
        }
      } catch (err) {
        console.error(`ERROR fetching (${err.message})`);
        failed++;
      }
    }

    if (failed > 0) {
      console.error(`\nIntegrity check completed: ${failed} failure(s)`);
      process.exit(2);
    }

    console.log('\nAll source integrities verified');
    process.exit(0);
  } catch (err) {
    console.error('Failed to read registry/sources.json:', err.message);
    process.exit(3);
  }
}

main();
