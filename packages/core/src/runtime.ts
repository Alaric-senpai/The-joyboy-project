/**
 * JoyBoy Runtime v1.2.0 - Remote-only, no caching
 * Always fetches fresh registry data to ensure up-to-date integrity hashes
 */

import { SourceRegistry } from './registry';
import { GitHubSourceLoader } from './github-loader';
import type { Source } from './base-source';
import type { Manga } from '@joyboy-parser/types';
import type { ProgressCallback } from './github-loader';

import {
  type RegistrySource,
  RemoteRegistry,
  REGISTRY_URLS,
} from '@joyboy-parser/source-registry';

/**
 * Main JoyBoy runtime class - Remote-first architecture
 * Always fetches fresh data from GitHub to ensure integrity verification works
 */
export class JoyBoy {
  private static registry = SourceRegistry.getInstance();
  private static loader = new GitHubSourceLoader();
  private static remoteRegistry: RemoteRegistry | null = null;

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Configure remote registry URL
   * 
   * @param primaryUrl - Primary URL (defaults to GitHub raw)
   * @param fallbackUrl - Fallback URL (defaults to jsDelivr)
   * 
   * @example
   * ```typescript
   * JoyBoy.configureRegistry('https://raw.githubusercontent.com/user/repo/main/registry/sources.json');
   * ```
   */
  static configureRegistry(primaryUrl?: string, fallbackUrl?: string): void {
    this.remoteRegistry = new RemoteRegistry({
      primaryUrl: primaryUrl || REGISTRY_URLS.github,
      fallbackUrl: fallbackUrl || REGISTRY_URLS.jsdelivr,
    });
  }

  /**
   * Get or create remote registry instance
   */
  private static getRemoteRegistry(): RemoteRegistry {
    if (!this.remoteRegistry) {
      this.configureRegistry();
    }
    return this.remoteRegistry!;
  }

  // ============================================================================
  // REGISTRY OPERATIONS (All async - always fetch fresh)
  // ============================================================================

  /**
   * Browse all available sources (always fetches fresh from remote)
   * 
   * @returns Promise of all source registry entries
   * 
   * @example
   * ```typescript
   * const sources = await JoyBoy.browseSources();
   * sources.forEach(s => console.log(s.name, s.integrity));
   * ```
   */
  static async browseSources(): Promise<RegistrySource[]> {
    return this.getRemoteRegistry().getSources();
  }

  /**
   * Search for sources in the registry (always fetches fresh)
   * 
   * @param query - Search query (name, id, description, tags)
   * @returns Promise of matching registry entries
   */
  static async searchSources(query: string): Promise<RegistrySource[]> {
    return this.getRemoteRegistry().searchSources(query);
  }

  /**
   * Get source registry information (always fetches fresh)
   * 
   * @param sourceId - Source identifier
   * @returns Promise of registry entry or undefined
   */
  static async getSourceInfo(sourceId: string): Promise<RegistrySource | undefined> {
    return this.getRemoteRegistry().getSource(sourceId);
  }

  /**
   * Get information about installed sources
   * 
   * @returns Promise of installed source registry entries
   */
  static async getInstalledSourcesInfo(): Promise<RegistrySource[]> {
    const installed = this.registry.list().map(s => s.id);
    const allSources = await this.browseSources();
    return allSources.filter(s => installed.includes(s.id));
  }

  /**
   * Get information about available (not installed) sources
   * 
   * @returns Promise of available source registry entries
   */
  static async getAvailableSourcesInfo(): Promise<RegistrySource[]> {
    const installed = this.registry.list().map(s => s.id);
    const allSources = await this.browseSources();
    return allSources.filter(s => !installed.includes(s.id));
  }

  // ============================================================================
  // SOURCE INSTALLATION & MANAGEMENT
  // ============================================================================

  /**
   * Install source from registry (always fetches fresh registry data)
   * 
   * @param sourceId - Source identifier from registry
   * @param onProgress - Optional progress callback
   * @returns Promise of loaded source instance
   * 
   * @example
   * ```typescript
   * const source = await JoyBoy.installSource('mangadex', (progress, status) => {
   *   console.log(`${progress}%: ${status}`);
   * });
   * ```
   */
  static async installSource(
    sourceId: string,
    onProgress?: ProgressCallback
  ): Promise<Source> {
    // Always fetch fresh registry data to get current integrity hash
    const entry = await this.getSourceInfo(sourceId);

    if (!entry) {
      throw new Error(`Source not found in registry: ${sourceId}`);
    }

    try {
      // Load source from the download URL with fresh integrity hash
      const source = await this.loader.loadFromRegistry(entry, onProgress);

      // Register in local registry
      this.registry.register(source);

      return source;
    } catch (error) {
      throw new Error(`Installation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Uninstall a source
   * 
   * @param sourceId - Source identifier
   */
  static uninstallSource(sourceId: string): void {
    this.registry.unregister(sourceId);
    this.loader.clearCache(sourceId);
  }

  /**
   * Reinstall/update a source (fetches fresh registry + source code)
   * 
   * @param sourceId - Source identifier
   * @param onProgress - Optional progress callback
   * @returns Promise of updated source instance
   */
  static async updateSource(
    sourceId: string,
    onProgress?: ProgressCallback
  ): Promise<Source> {
    // Clear all caches
    this.loader.clearCache(sourceId);
    this.uninstallSource(sourceId);
    
    // Install with fresh data
    return this.installSource(sourceId, onProgress);
  }

  // ============================================================================
  // SOURCE ACCESS
  // ============================================================================

  /**
   * Get a loaded source by ID
   * 
   * @param id - Source identifier
   * @returns Source instance
   * @throws Error if source is not loaded
   */
  static getSource(id: string): Source {
    const source = this.registry.get(id);

    if (!source) {
      const available = this.registry.list().map(s => s.id).join(', ');
      throw new Error(
        `Source '${id}' is not loaded. Available sources: ${available || 'none'}`
      );
    }

    return source;
  }

  /**
   * List all loaded sources
   * 
   * @returns Array of loaded source instances
   */
  static listSources(): Source[] {
    return this.registry.list();
  }

  /**
   * Check if a source is loaded
   * 
   * @param id - Source identifier
   * @returns True if loaded
   */
  static hasSource(id: string): boolean {
    return this.registry.has(id);
  }

  /**
   * Unload a source (without uninstalling)
   * 
   * @param id - Source identifier
   * @returns True if unloaded
   */
  static unloadSource(id: string): boolean {
    return this.registry.unregister(id);
  }

  /**
   * Clear all loaded sources
   */
  static clearSources(): void {
    this.registry.clear();
  }

  // ============================================================================
  // MULTI-SOURCE OPERATIONS
  // ============================================================================

  /**
   * Search across multiple sources
   * 
   * @param query - Search query
   * @param sourceIds - Optional array of source IDs (default: all loaded)
   * @returns Promise of Map of source ID to results
   */
  static async searchAll(
    query: string,
    sourceIds?: string[]
  ): Promise<Map<string, Manga[]>> {
    const sources = sourceIds
      ? sourceIds.map(id => this.getSource(id))
      : this.registry.list().filter(s => s.search);

    const results = await Promise.allSettled(
      sources.map(async source => {
        if (source.search) {
          const items = await source.search(query);
          return { sourceId: source.id, items };
        }
        return { sourceId: source.id, items: [] };
      })
    );

    const resultMap = new Map<string, Manga[]>();

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        resultMap.set(result.value.sourceId, result.value.items);
      }
    });

    return resultMap;
  }

  // ============================================================================
  // DIRECT SOURCE LOADING (For development/testing)
  // ============================================================================

  /**
   * Load source directly (for development/testing)
   * 
   * @param source - Source instance, package name, or lazy loader
   * @returns Promise of loaded source instance
   */
  static async loadSource(
    source: Source | string | (() => Promise<any>)
  ): Promise<Source> {
    try {
      let sourceInstance: Source;

      if (typeof source === 'string') {
        const module = await import(/* @vite-ignore */ source);
        const SourceClass = module.default;
        if (!SourceClass) {
          throw new Error(`No default export found in ${source}`);
        }
        sourceInstance = new SourceClass();
      } else if (typeof source === 'function') {
        const module = await source();
        const SourceClass = module.default;
        sourceInstance = new SourceClass();
      } else {
        sourceInstance = source;
      }

      this.validateSource(sourceInstance);
      this.registry.register(sourceInstance);

      return sourceInstance;
    } catch (error) {
      throw new Error(`Failed to load source: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  private static validateSource(source: any): asserts source is Source {
    const required = ['id', 'name', 'version', 'baseUrl', 'getMangaDetails', 'getChapters', 'getChapterPages'];

    for (const prop of required) {
      if (!(prop in source)) {
        throw new Error(`Source validation failed: missing required property '${prop}'`);
      }
    }

    if (typeof source.getMangaDetails !== 'function') {
      throw new Error('Source validation failed: getMangaDetails must be a function');
    }

    if (typeof source.getChapters !== 'function') {
      throw new Error('Source validation failed: getChapters must be a function');
    }

    if (typeof source.getChapterPages !== 'function') {
      throw new Error('Source validation failed: getChapterPages must be a function');
    }
  }
}
