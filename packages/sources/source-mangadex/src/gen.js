#!/usr/bin/env node
import fs from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const distFile = join(process.cwd(), 'dist/index.js');
const integrityFile = join(process.cwd(), 'integrity.json');

if (!fs.existsSync(distFile)) {
  console.error('❌ dist/index.js not found. Run build first.');
  process.exit(1);
}

const buffer = fs.readFileSync(distFile);
const hash = createHash('sha256').update(buffer).digest('hex');

const content = {
  integrity: {
    sha256: hash
  }
};

fs.writeFileSync(integrityFile, JSON.stringify(content, null, 2));
console.log('✅ Integrity file generated at integrity.json');
console.log('   SHA256:', hash);