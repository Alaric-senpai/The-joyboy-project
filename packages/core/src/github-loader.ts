/**
 * GitHub source loader for dynamic runtime loading
 */

import { RegistrySource } from '@joyboy-parser/source-registry';
import type { Source } from './base-source';
import { BaseSource } from './base-source';


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

      // Validate code structure
      if (!this.validateSourceCode(code)) {
        throw new Error('Invalid source code structure');
      }

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
  private async downloadSourceCode(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/javascript,application/javascript'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      throw new Error(`Download failed: ${(error as Error).message}`);
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
   */
  private validateSourceCode(code: string): boolean {
    // Check for required patterns
    const hasClass = /class\s+\w+\s+extends\s+BaseSource/.test(code);
    const hasExport = /export\s+default/.test(code) || /module\.exports/.test(code);

    // Check for dangerous code patterns
    const hasDangerousCode = [
      /eval\s*\(/,
      /new\s+Function\s*\(/,
      /require\s*\(\s*['"]child_process['"]/,
      /require\s*\(\s*['"]fs['"]/,
      /require\s*\(\s*['"]net['"]/,
      /require\s*\(\s*['"]http['"]/,
    ].some(pattern => pattern.test(code));

    return hasClass && hasExport && !hasDangerousCode;
  }

  /**
   * Load source from code string
   */
  private async loadSourceFromCode(code: string): Promise<Source> {
    try {
      // Create isolated module environment
      const moduleWrapper = `
        (function(exports, require, module, BaseSource) {
          ${code}
          return module.exports.default || module.exports || exports.default || exports;
        })
      `;

      const moduleFactory = new Function('return ' + moduleWrapper)();

      // Mock module system
      const module = { exports: {} };
      const exports = module.exports;

      // Mock require function
      const require = (name: string) => {
        if (name === '@joyboy/core') {
          return { BaseSource };
        }
        if (name === '@joyboy/types') {
          return {};
        }
        throw new Error(`Module not found: ${name}`);
      };

      // Execute module
      const SourceClass = moduleFactory(exports, require, module, BaseSource);

      if (!SourceClass) {
        throw new Error('No source class found in module');
      }

      // Instantiate source
      const source = new SourceClass();

      return source;
    } catch (error) {
      throw new Error(`Failed to load source from code: ${(error as Error).message}`);
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
