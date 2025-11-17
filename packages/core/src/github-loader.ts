/**
 * GitHub source loader for dynamic runtime loading
 */

import { RegistrySource } from '@joyboy-parser/source-registry';
import type { Source } from './base-source';
import { BaseSource } from './base-source';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';


/**
 * Progress callback for installation
 */
export type ProgressCallback = (progress: number, status: string) => void;

/**
 * GitHub source loader for loading sources from remote URLs
 */
export class GitHubSourceLoader {
  private cache = new Map<string, { code: string; version: string; timestamp: number }>();
  private cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Load source from GitHub using registry entry
   */
  async loadFromRegistry(
    entry: RegistrySource,
    onProgress?: ProgressCallback
  ): Promise<Source> {
    try {
      onProgress?.(0, 'Starting installation...');

      // Check cache first
      const cached = this.getFromCache(entry.id);
      if (cached && cached.version === entry.version) {
        onProgress?.(100, 'Loaded from cache');
        return await this.loadSourceFromCode(cached.code);
      }

      onProgress?.(20, 'Downloading source code...');

      // Download source code
      const code = await this.downloadSourceCode(entry.downloads.stable);

      onProgress?.(50, 'Verifying integrity...');

      // Verify integrity
      if (!await this.verifyIntegrity(code, entry.integrity.sha256)) {
        throw new Error('Integrity verification failed! Source may be tampered.');
      }

      onProgress?.(70, 'Loading source...');

      // Validate code structure (throws on failure)
      this.validateSourceCode(code);

      onProgress?.(80, 'Instantiating source...');

      // Load the source
      const source = await this.loadSourceFromCode(code);

      // Validate source instance
      this.validateSourceInstance(source);

      onProgress?.(90, 'Caching source...');

      // Cache the source
      this.cacheSource(entry.id, code, entry.version);

      onProgress?.(100, 'Installation complete');

      return source;
    } catch (error) {
      throw new Error(`Failed to load source ${entry.id}: ${(error as Error).message}`);
    }
  }

  /**
   * Download source code from URL
   */
  /**
   * Download source code from URL
   * Automatically converts GitHub tree URLs to raw URLs
   */
  private async downloadSourceCode(url: string): Promise<string> {
    try {
      // Auto-fix GitHub tree URLs to raw URLs
      let downloadUrl = url;
      if (url.includes('github.com') && url.includes('/tree/')) {
        // Convert: github.com/user/repo/tree/branch/path -> raw.githubusercontent.com/user/repo/branch/path
        downloadUrl = url
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/tree/', '/');
        
        console.warn(
          `⚠️  GitHub tree URL detected and auto-converted:\n` +
          `   From: ${url}\n` +
          `   To:   ${downloadUrl}\n` +
          `   Consider updating the registry to use raw URLs or jsDelivr CDN URLs.`
        );
      }

      const response = await fetch(downloadUrl, {
        headers: {
          'Accept': 'text/javascript,application/javascript'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const code = await response.text();
      
      // Validate we got JavaScript, not HTML
      if (code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html')) {
        throw new Error(
          'Downloaded content appears to be HTML instead of JavaScript. ' +
          'The URL may be pointing to a GitHub tree page instead of a raw file. ' +
          'Use raw.githubusercontent.com or jsDelivr CDN URLs.'
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

      return hashHex === expectedHash;
    } catch (error) {
      console.error('Integrity verification error:', error);
      return false;
    }
  }

  /**
   * Validate source code structure
   * Supports both regular and transpiled/bundled code patterns
   * @throws Error with detailed message if validation fails
   */
  private validateSourceCode(code: string): void {
    // Check for required patterns (supports both regular and transpiled/bundled code)
    // Match: "class X extends BaseSource" OR "var/const/let X = class extends BaseSource"
    const hasClass = /(class\s+\w+\s+extends\s+BaseSource|(?:var|const|let)\s+\w+\s*=\s*class\s+extends\s+BaseSource)/.test(code);
    
    // Match: "export default" OR "export { X as default }" OR "module.exports"
    const hasExport = /(export\s+default|export\s*\{\s*\w+\s+as\s+default\s*\}|module\.exports)/.test(code);

    // Check for dangerous code patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, name: 'eval()' },
      { pattern: /new\s+Function\s*\(/, name: 'new Function()' },
      { pattern: /require\s*\(\s*['"]child_process['"]/, name: 'child_process' },
      { pattern: /require\s*\(\s*['"]fs['"]/, name: 'fs' },
      { pattern: /require\s*\(\s*['"]net['"]/, name: 'net' },
      { pattern: /require\s*\(\s*['"]http['"]/, name: 'http' },
    ];

    const foundDangerous = dangerousPatterns.find(({ pattern }) => pattern.test(code));

    if (!hasClass) {
      throw new Error(
        'Invalid source code structure: Missing BaseSource class declaration. ' +
        'Source must extend BaseSource (supports both "class X extends BaseSource" and "var X = class extends BaseSource" patterns).'
      );
    }

    if (!hasExport) {
      throw new Error(
        'Invalid source code structure: Missing default export. ' +
        'Source must have a default export (supports "export default", "export { X as default }", or "module.exports").'
      );
    }

    if (foundDangerous) {
      throw new Error(
        `Security validation failed: Dangerous pattern detected - ${foundDangerous.name}. ` +
        'Source code must not use eval, new Function, or Node.js system modules (child_process, fs, net, http).'
      );
    }
  }

  /**
   * Load source from code string
   * Creates a temporary file, rewrites imports, and dynamically loads the module
   */
  private async loadSourceFromCode(code: string): Promise<Source> {
    let tempFilePath: string | null = null;
    
    try {
      // Get the file URL of the current module to resolve relative imports
      const currentModuleUrl = import.meta.url;
      const currentModulePath = currentModuleUrl.replace('file://', '');
      const coreDistPath = path.dirname(currentModulePath);
      const coreIndexPath = path.join(coreDistPath, 'index.js');
      
      // Rewrite imports to use the actual core package location
      const rewrittenCode = code
        .replace(/from\s+['"]@joyboy-parser\/core['"]/g, `from 'file://${coreIndexPath}'`)
        .replace(/from\s+['"]@joyboy-parser\/types['"]/g, `from 'file://${coreIndexPath}'`);
      
      // Create a temporary file with the rewritten source code
      const tempDir = os.tmpdir();
      const randomName = crypto.randomBytes(16).toString('hex');
      tempFilePath = path.join(tempDir, `joyboy-source-${randomName}.mjs`);
      
      await fs.writeFile(tempFilePath, rewrittenCode, 'utf-8');

      // Dynamically import the temporary file
      const module = await import(`file://${tempFilePath}`);

      // Get the default export (the Source class)
      const SourceClass = module.default;

      if (!SourceClass) {
        throw new Error(
          'No default export found in source module. ' +
          'The source must export a class that extends BaseSource as the default export.'
        );
      }

      // Instantiate the source
      const source = new SourceClass();

      return source;
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('No default export')) {
        throw err; // Re-throw our custom error as-is
      }
      throw new Error(
        `Failed to load source from code: ${err.message}. ` +
        'Ensure the source is a valid ES module that extends BaseSource.'
      );
    } finally {
      // Clean up the temporary file
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
   * Cache source code locally
   */
  private cacheSource(sourceId: string, code: string, version: string): void {
    const cacheEntry = {
      code,
      version,
      timestamp: Date.now()
    };

    // Memory cache
    this.cache.set(sourceId, cacheEntry);

    // Persistent cache (platform-specific)
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`joyboy_source_${sourceId}`, JSON.stringify(cacheEntry));
      } catch (error) {
        console.warn('Failed to persist cache:', error);
      }
    }
  }

  /**
   * Get source from cache
   */
  private getFromCache(sourceId: string): { code: string; version: string } | null {
    // Check memory cache
    const memCached = this.cache.get(sourceId);
    if (memCached && Date.now() - memCached.timestamp < this.cacheDuration) {
      return { code: memCached.code, version: memCached.version };
    }

    // Check persistent cache
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(`joyboy_source_${sourceId}`);
        if (cached) {
          const entry = JSON.parse(cached);
          if (Date.now() - entry.timestamp < this.cacheDuration) {
            this.cache.set(sourceId, entry);
            return { code: entry.code, version: entry.version };
          }
        }
      } catch (error) {
        console.warn('Failed to read cache:', error);
      }
    }

    return null;
  }

  /**
   * Clear cache for a specific source
   */
  clearCache(sourceId?: string): void {
    if (sourceId) {
      this.cache.delete(sourceId);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`joyboy_source_${sourceId}`);
      }
    } else {
      this.cache.clear();
      if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('joyboy_source_')) {
            localStorage.removeItem(key);
          }
        });
      }
    }
  }
}
