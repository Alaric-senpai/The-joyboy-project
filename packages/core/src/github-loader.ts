/**
 * GitHub source loader v1.2.0 - No caching, always fetch fresh
 */

import { RegistrySource } from '@joyboy-parser/source-registry';
import type { Source } from './base-source';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';

/**
 * Progress callback for installation
 */
export type ProgressCallback = (progress: number, status: string) => void;

/**
 * GitHub source loader - Always fetches fresh code, no caching
 */
export class GitHubSourceLoader {

  /**
   * Load source from registry entry (always fresh)
   */
  async loadFromRegistry(
    entry: RegistrySource,
    onProgress?: ProgressCallback
  ): Promise<Source> {
    try {
      onProgress?.(0, 'Starting installation...');
      onProgress?.(20, 'Downloading source code...');

      // Always download fresh - no caching
      const code = await this.downloadSourceCode(entry.downloads.stable);

      onProgress?.(50, 'Verifying integrity...');

      // Verify integrity with the fresh hash from registry
      if (!await this.verifyIntegrity(code, entry.integrity.sha256)) {
        throw new Error('Integrity verification failed! Source may be tampered.');
      }

      onProgress?.(70, 'Loading source...');

      // Validate code structure
      this.validateSourceCode(code);

      onProgress?.(80, 'Instantiating source...');

      // Load the source
      const source = await this.loadSourceFromCode(code);

      // Validate source instance
      this.validateSourceInstance(source);

      onProgress?.(100, 'Installation complete');

      return source;
    } catch (error) {
      throw new Error(`Failed to load source ${entry.id}: ${(error as Error).message}`);
    }
  }

  /**
   * Download source code from URL (always fresh, cache-busted)
   */
  private async downloadSourceCode(url: string): Promise<string> {
    try {
      // Auto-fix GitHub tree URLs to raw URLs
      let downloadUrl = url;
      if (url.includes('github.com') && url.includes('/tree/')) {
        downloadUrl = url
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/tree/', '/');
      }

      // Add cache-busting parameter
      const bustUrl = `${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;

      const response = await fetch(bustUrl, {
        headers: {
          'Accept': 'text/javascript,application/javascript',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const code = await response.text();
      
      // Validate we got JavaScript, not HTML
      if (code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html')) {
        throw new Error(
          'Downloaded HTML instead of JavaScript. Use raw.githubusercontent.com or jsDelivr CDN URLs.'
        );
      }

      return code;
    } catch (error) {
      throw new Error(`Download failed from ${url}: ${(error as Error).message}`);
    }
  }

  /**
   * Verify code integrity using SHA-256
   */
  private async verifyIntegrity(code: string, expectedHash: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(code);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log(`Computed hash: ${hashHex}`);
      console.log(`Expected hash: ${expectedHash}`);

      return hashHex === expectedHash;
    } catch (error) {
      console.error('Integrity verification error:', error);
      return false;
    }
  }

  /**
   * Validate source code structure
   */
  private validateSourceCode(code: string): void {
    const hasClass = /(class\s+\w+\s+extends\s+BaseSource|(?:var|const|let)\s+\w+\s*=\s*class\s+extends\s+BaseSource)/.test(code);
    const hasExport = /(export\s+default|export\s*\{\s*\w+\s+as\s+default\s*\}|module\.exports)/.test(code);

    const dangerousPatterns = [
      { pattern: /eval\s*\(/, name: 'eval()' },
      { pattern: /new\s+Function\s*\(/, name: 'new Function()' },
      { pattern: /require\s*\(\s*['"]child_process['"]/, name: 'child_process' },
      { pattern: /require\s*\(\s*['"]fs['"]/, name: 'fs' },
      { pattern: /require\s*\(\s*['"]net['"]/, name: 'net' },
    ];

    const foundDangerous = dangerousPatterns.find(({ pattern }) => pattern.test(code));

    if (!hasClass) {
      throw new Error('Invalid source: Missing BaseSource class declaration.');
    }

    if (!hasExport) {
      throw new Error('Invalid source: Missing default export.');
    }

    if (foundDangerous) {
      throw new Error(`Security validation failed: ${foundDangerous.name} detected.`);
    }
  }

  /**
   * Load source from code string
   */
  private async loadSourceFromCode(code: string): Promise<Source> {
    let tempFilePath: string | null = null;
    
    try {
      const currentModuleUrl = import.meta.url;
      const currentModulePath = currentModuleUrl.replace('file://', '');
      const coreDistPath = path.dirname(currentModulePath);
      const coreIndexPath = path.join(coreDistPath, 'index.js');
      
      // Rewrite imports to use the actual core package location
      const rewrittenCode = code
        .replace(/from\s+['"]@joyboy-parser\/core['"]/g, `from 'file://${coreIndexPath}'`)
        .replace(/from\s+['"]@joyboy-parser\/types['"]/g, `from 'file://${coreIndexPath}'`);
      
      // Create a temporary file
      const tempDir = os.tmpdir();
      const randomName = crypto.randomBytes(16).toString('hex');
      tempFilePath = path.join(tempDir, `joyboy-source-${randomName}.mjs`);
      
      await fs.writeFile(tempFilePath, rewrittenCode, 'utf-8');

      // Import the temporary file
      const module = await import(`file://${tempFilePath}`);
      const SourceClass = module.default;

      if (!SourceClass) {
        throw new Error('No default export found. Source must export a class extending BaseSource.');
      }

      return new SourceClass();
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to load source: ${err.message}`);
    } finally {
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Validate source instance
   */
  private validateSourceInstance(source: any): asserts source is Source {
    const required = ['id', 'name', 'version', 'baseUrl', 'getMangaDetails', 'getChapters', 'getChapterPages'];

    for (const prop of required) {
      if (!(prop in source)) {
        throw new Error(`Missing required property: ${prop}`);
      }
    }

    if (typeof source.getMangaDetails !== 'function') {
      throw new Error('getMangaDetails must be a function');
    }
    if (typeof source.getChapters !== 'function') {
      throw new Error('getChapters must be a function');
    }
    if (typeof source.getChapterPages !== 'function') {
      throw new Error('getChapterPages must be a function');
    }
  }

  /**
   * Clear cache - no-op in this version (no caching)
   */
  clearCache(_sourceId?: string): void {
    // No caching in v1.2.0
  }
}
