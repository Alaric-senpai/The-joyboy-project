/**
 * @joyboy-parser/source-registry
 * Dynamic source registry with automatic discovery
 * 
 * Provides a centralized catalog of all available JoyBoy parsers with
 * search, filtering, and metadata management capabilities.
 * 
 * @example
 * ```typescript
 * import { getAllSources, searchSources } from '@joyboy-parser/source-registry';
 * 
 * const allSources = getAllSources();
 * const mangaSources = searchSources('manga');
 * ```
 */

import type { RegistrySource, Registry } from './types';
import sourcesData from '../sources.json';
import { createRemoteRegistry, DEFAULT_REGISTRY_URLS, RemoteRegistry } from './remote-registry';

/**
 * Statistics about the registry
 */
export interface RegistryStats {
  totalSources: number;
  officialSources: number;
  communitySources: number;
  nsfwSources: number;
  sfwSources: number;
  languageDistribution: Record<string, number>;
  tagDistribution: Record<string, number>;
}

/**
 * Source registry with dynamic discovery and search capabilities
 * 
 * @example
 * ```typescript
 * const catalog = new SourceCatalog();
 * const allSources = catalog.getAllSources();
 * const englishSources = catalog.getSourcesByLanguage('en');
 * ```
 */
export class SourceCatalog {
  private sources: Map<string, RegistrySource> = new Map();
  private remoteRegistry: RemoteRegistry;

  constructor(remoteRegistryUrl: string = DEFAULT_REGISTRY_URLS.jsdelivr) {
    this.loadFromJSON(); // Load bundled sources

    this.remoteRegistry = createRemoteRegistry(remoteRegistryUrl);
  }

  /**
   * Load sources from bundled JSON file
   * @private
   */
  private loadFromJSON(): void {
    // Load bundled registry data
    const registry = sourcesData as unknown as Registry;
    
    if (registry && registry.sources) {
      registry.sources.forEach(source => {
        this.sources.set(source.id, source);
      });
    }
  }

  /**
   * Get all available sources
   * 
   * @returns Array of all registry entries
   * 
   * @example
   * ```typescript
   * const sources = catalog.getAllSources();
   * console.log(`Total sources: ${sources.length}`);
   * ```
   */
  getAllSources(): RegistrySource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Sync with remote registry
   */
  async syncWithRemote(): Promise<void> {
    if (!this.remoteRegistry) {
      throw new Error('Remote registry not configured');
    }

    try {
      const remoteData = await this.remoteRegistry.fetchRegistry();
      
      // Replace local sources with remote sources
      this.sources.clear();
      remoteData.sources.forEach(source => {
        this.sources.set(source.id, source);
      });

      console.log(`Synced ${remoteData.sources.length} sources from remote registry`);
    } catch (error) {
      console.error('Failed to sync with remote:', error);
      // Fail silently, use local registry
    }
  }

  /**
   * Get a specific source by its ID
   * 
   * @param id - Source identifier
   * @returns Registry entry or undefined if not found
   * 
   * @example
   * ```typescript
   * const mangadx = catalog.getSource('mangadex');
   * if (mangadx) {
   *   console.log(mangadx.name);
   * }
   * ```
   */
  getSource(id: string): RegistrySource | undefined {
    return this.sources.get(id);
  }

  /**
   * Search sources by name, ID, description, or tags
   * 
   * @param query - Search query string
   * @returns Matching registry entries
   * 
   * @example
   * ```typescript
   * const results = catalog.searchSources('manga');
   * const apiSources = catalog.searchSources('api');
   * ```
   */
  searchSources(query: string): RegistrySource[] {
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      return this.getAllSources();
    }

    return this.getAllSources().filter(source =>
      source.name.toLowerCase().includes(lowerQuery) ||
      source.id.toLowerCase().includes(lowerQuery) ||
      source.description?.toLowerCase().includes(lowerQuery) ||
      source.id.toLowerCase().includes(lowerQuery) ||
      source.metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get sources that support a specific language
   * 
   * @param language - Language code (e.g., 'en', 'ja', 'es')
   * @returns Sources supporting the language
   * 
   * @example
   * ```typescript
   * const englishSources = catalog.getSourcesByLanguage('en');
   * const japaneseSources = catalog.getSourcesByLanguage('ja');
   * ```
   */
  getSourcesByLanguage(language: string): RegistrySource[] {
    return this.getAllSources().filter(source =>
      source.metadata.languages?.includes(language.toLowerCase())
    );
  }

  /**
   * Get sources by multiple languages (OR logic)
   * 
   * @param languages - Array of language codes
   * @returns Sources supporting any of the languages
   */
  getSourcesByLanguages(languages: string[]): RegistrySource[] {
    const lowerLanguages = languages.map(l => l.toLowerCase());
    return this.getAllSources().filter(source =>
      source.metadata.languages?.some(lang => lowerLanguages.includes(lang.toLowerCase()))
    );
  }

  /**
   * Get only official sources
   * 
   * @returns Official sources maintained by the JoyBoy team
   * 
   * @example
   * ```typescript
   * const official = catalog.getOfficialSources();
   * ```
   */
  getOfficialSources(): RegistrySource[] {
    return this.getAllSources().filter(source => source.metadata.official);
  }

  /**
   * Get community-maintained sources
   * 
   * @returns Non-official sources
   */
  getCommunitySources(): RegistrySource[] {
    return this.getAllSources().filter(source => !source.metadata.official);
  }

  /**
   * Get sources by tag
   * 
   * @param tag - Tag to filter by
   * @returns Sources with the specified tag
   * 
   * @example
   * ```typescript
   * const apiSources = catalog.getSourcesByTag('api');
   * const scrapingSources = catalog.getSourcesByTag('scraping');
   * ```
   */
  getSourcesByTag(tag: string): RegistrySource[] {
    const lowerTag = tag.toLowerCase();
    return this.getAllSources().filter(source =>
      source.metadata.tags?.some(t => t.toLowerCase() === lowerTag)
    );
  }

  /**
   * Get sources by multiple tags (AND logic)
   * 
   * @param tags - Array of tags (all must match)
   * @returns Sources matching all tags
   */
  getSourcesByTags(tags: string[]): RegistrySource[] {
    const lowerTags = tags.map(t => t.toLowerCase());
    return this.getAllSources().filter(source =>
      lowerTags.every(tag => 
        source.metadata.tags?.some(t => t.toLowerCase() === tag)
      )
    );
  }

  /**
   * Get NSFW (adult content) sources
   * 
   * @returns Sources marked as NSFW
   * 
   * @example
   * ```typescript
   * const nsfwSources = catalog.getNSFWSources();
   * ```
   */
  getNSFWSources(): RegistrySource[] {
    return this.getAllSources().filter(source => source.metadata.nsfw);
  }

  /**
   * Get safe-for-work sources only
   * 
   * @returns Non-NSFW sources
   * 
   * @example
   * ```typescript
   * const sfwSources = catalog.getSFWSources();
   * ```
   */
  getSFWSources(): RegistrySource[] {
    return this.getAllSources().filter(source => !source.metadata.nsfw);
  }

  /**
   * Get sources sorted by rating (highest first)
   * 
   * @returns Sources sorted by rating
   */
  getSourcesByRating(): RegistrySource[] {
    return this.getAllSources()
      .filter(source => source.statistics.rating !== undefined)
      .sort((a, b) => (b.statistics.rating || 0) - (a.statistics.rating || 0));
  }

  /**
   * Get sources sorted by download count (highest first)
   * 
   * @returns Sources sorted by popularity
   */
  getSourcesByPopularity(): RegistrySource[] {
    return this.getAllSources()
      .filter(source => source.statistics.downloads !== undefined)
      .sort((a, b) => (b.statistics.downloads || 0) - (a.statistics.downloads || 0));
  }

  /**
   * Get recently updated sources
   * 
   * @param days - Number of days to look back
   * @returns Recently updated sources
   */
  getRecentlyUpdated(days: number = 30): RegistrySource[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return this.getAllSources()
      .filter(source => {
        if (!source.metadata.lastUpdated) return false;
        return new Date(source.metadata.lastUpdated) >= cutoff;
      })
      .sort((a, b) => {
        const dateA = new Date(a.metadata.lastUpdated!).getTime();
        const dateB = new Date(b.metadata.lastUpdated!).getTime();
        return dateB - dateA;
      });
  }

  /**
   * Register a new source dynamically
   * 
   * @param entry - Registry entry to add
   * 
   * @example
   * ```typescript
   * catalog.registerSource({
   *   id: 'custom',
   *   name: 'Custom Source',
   *   version: '1.0.0',
   *   baseUrl: 'https://example.com',
   *   packageName: '@custom/source-custom'
   * });
   * ```
   */
  registerSource(entry: RegistrySource): void {
    this.sources.set(entry.id, entry);
  }

  /**
   * Unregister a source
   * 
   * @param id - Source ID to remove
   * @returns True if removed, false if not found
   */
  unregisterSource(id: string): boolean {
    return this.sources.delete(id);
  }

  /**
   * Get total number of sources
   * 
   * @returns Total source count
   */
  getSourceCount(): number {
    return this.sources.size;
  }

  /**
   * Get registry statistics
   * 
   * @returns Statistics about the registry
   * 
   * @example
   * ```typescript
   * const stats = catalog.getStatistics();
   * console.log(`Total: ${stats.totalSources}`);
   * console.log(`Official: ${stats.officialSources}`);
   * ```
   */
  getStatistics(): RegistryStats {
    const sources = this.getAllSources();
    
    const languageDistribution: Record<string, number> = {};
    const tagDistribution: Record<string, number> = {};

    sources.forEach(source => {
      // Count languages
      source.metadata.languages?.forEach(lang => {
        languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
      });

      // Count tags
      source.metadata.tags?.forEach(tag => {
        tagDistribution[tag] = (tagDistribution[tag] || 0) + 1;
      });
    });

    return {
      totalSources: sources.length,
      officialSources: this.getOfficialSources().length,
      communitySources: this.getCommunitySources().length,
      nsfwSources: this.getNSFWSources().length,
      sfwSources: this.getSFWSources().length,
      languageDistribution,
      tagDistribution
    };
  }

  /**
   * Export current registry as JSON string
   * 
   * @returns JSON string of all sources
   */
  exportToJSON(): string {
    return JSON.stringify(this.getAllSources(), null, 2);
  }

  /**
   * Import sources from JSON string
   * 
   * @param json - JSON string containing registry entries
   */
  importFromJSON(json: string): void {
    try {
      const entries = JSON.parse(json) as RegistrySource[];
      entries.forEach(entry => this.registerSource(entry));
    } catch (error) {
      throw new Error(`Failed to import sources: ${(error as Error).message}`);
    }
  }

  /**
   * Clear all sources from registry
   */
  clear(): void {
    this.sources.clear();
    this.loadFromJSON(); // Reload from bundled JSON
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

/**
 * Global singleton instance of the source catalog
 */
export const sourceCatalog = new SourceCatalog();

// ============================================================================
// Convenience functions
// ============================================================================

/**
 * Get all available sources
 * 
 * @returns Array of all registry entries
 * 
 * @example
 * ```typescript
 * import { getAllSources } from '@joyboy-parser/source-registry';
 * const sources = getAllSources();
 * ```
 */
export function getAllSources(): RegistrySource[] {
  return sourceCatalog.getAllSources();
}

/**
 * Get a source by ID
 * 
 * @param id - Source identifier
 * @returns Registry entry or undefined
 */
export function getSourceById(id: string): RegistrySource | undefined {
  return sourceCatalog.getSource(id);
}

/**
 * Search sources by query
 * 
 * @param query - Search query
 * @returns Matching sources
 */
export function searchSources(query: string): RegistrySource[] {
  return sourceCatalog.searchSources(query);
}

/**
 * Get sources by language
 * 
 * @param language - Language code
 * @returns Sources supporting the language
 */
export function getSourcesByLanguage(language: string): RegistrySource[] {
  return sourceCatalog.getSourcesByLanguage(language);
}

/**
 * Get official sources
 * 
 * @returns Official sources
 */
export function getOfficialSources(): RegistrySource[] {
  return sourceCatalog.getOfficialSources();
}

/**
 * Get SFW sources
 * 
 * @returns Safe-for-work sources
 */
export function getSFWSources(): RegistrySource[] {
  return sourceCatalog.getSFWSources();
}

/**
 * Get registry statistics
 * 
 * @returns Registry statistics
 */
export function getStatistics(): RegistryStats {
  return sourceCatalog.getStatistics();
}

// Re-export types
export type { SourceInfo } from '@joyboy-parser/types';