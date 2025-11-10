/**
 * @joyboy/source-registry
 * Dynamic source registry with automatic discovery
 * 
 * Provides a centralized catalog of all available JoyBoy parsers with
 * search, filtering, and metadata management capabilities.
 * 
 * @example
 * ```typescript
 * import { getAllSources, searchSources } from '@joyboy/source-registry';
 * 
 * const allSources = getAllSources();
 * const mangaSources = searchSources('manga');
 * ```
 */

import type { SourceInfo } from '@joyboy/types';
import sourcesData from '../sources.json';

/**
 * Extended source information with registry metadata
 */
export interface RegistryEntry extends SourceInfo {
  /** NPM package name for installation */
  packageName: string;
  
  /** CDN URL for browser/remote loading (optional) */
  cdnUrl?: string;
  
  /** GitHub repository URL */
  repository?: string;
  
  /** NPM installation command */
  installCommand?: string;
  
  /** Is this an officially maintained parser? */
  official?: boolean;
  
  /** Tags for categorization and search */
  tags?: string[];
  
  /** Last updated timestamp (ISO 8601) */
  lastUpdated?: string;
  
  /** Download count (if available) */
  downloads?: number;
  
  /** Rating/stars (0-5) */
  rating?: number;
  
  /** Maintainer information */
  maintainer?: string;
}

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
  private sources: Map<string, RegistryEntry> = new Map();

  constructor() {
    this.loadFromJSON();
  }

  /**
   * Load sources from bundled JSON file
   * @private
   */
  private loadFromJSON(): void {
    const entries = sourcesData as RegistryEntry[];
    entries.forEach(entry => {
      this.sources.set(entry.id, entry);
    });
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
  getAllSources(): RegistryEntry[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get a specific source by its ID
   * 
   * @param id - Source identifier
   * @returns Registry entry or undefined if not found
   * 
   * @example
   * ```typescript
   * const mangadx = catalog.getSource('mangadx');
   * if (mangadx) {
   *   console.log(mangadx.name);
   * }
   * ```
   */
  getSource(id: string): RegistryEntry | undefined {
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
  searchSources(query: string): RegistryEntry[] {
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      return this.getAllSources();
    }

    return this.getAllSources().filter(source =>
      source.name.toLowerCase().includes(lowerQuery) ||
      source.id.toLowerCase().includes(lowerQuery) ||
      source.description?.toLowerCase().includes(lowerQuery) ||
      source.packageName.toLowerCase().includes(lowerQuery) ||
      source.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
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
  getSourcesByLanguage(language: string): RegistryEntry[] {
    return this.getAllSources().filter(source =>
      source.languages?.includes(language.toLowerCase())
    );
  }

  /**
   * Get sources by multiple languages (OR logic)
   * 
   * @param languages - Array of language codes
   * @returns Sources supporting any of the languages
   */
  getSourcesByLanguages(languages: string[]): RegistryEntry[] {
    const lowerLanguages = languages.map(l => l.toLowerCase());
    return this.getAllSources().filter(source =>
      source.languages?.some(lang => lowerLanguages.includes(lang.toLowerCase()))
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
  getOfficialSources(): RegistryEntry[] {
    return this.getAllSources().filter(source => source.official);
  }

  /**
   * Get community-maintained sources
   * 
   * @returns Non-official sources
   */
  getCommunitySources(): RegistryEntry[] {
    return this.getAllSources().filter(source => !source.official);
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
  getSourcesByTag(tag: string): RegistryEntry[] {
    const lowerTag = tag.toLowerCase();
    return this.getAllSources().filter(source =>
      source.tags?.some(t => t.toLowerCase() === lowerTag)
    );
  }

  /**
   * Get sources by multiple tags (AND logic)
   * 
   * @param tags - Array of tags (all must match)
   * @returns Sources matching all tags
   */
  getSourcesByTags(tags: string[]): RegistryEntry[] {
    const lowerTags = tags.map(t => t.toLowerCase());
    return this.getAllSources().filter(source =>
      lowerTags.every(tag => 
        source.tags?.some(t => t.toLowerCase() === tag)
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
  getNSFWSources(): RegistryEntry[] {
    return this.getAllSources().filter(source => source.isNsfw);
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
  getSFWSources(): RegistryEntry[] {
    return this.getAllSources().filter(source => !source.isNsfw);
  }

  /**
   * Get sources sorted by rating (highest first)
   * 
   * @returns Sources sorted by rating
   */
  getSourcesByRating(): RegistryEntry[] {
    return this.getAllSources()
      .filter(source => source.rating !== undefined)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  /**
   * Get sources sorted by download count (highest first)
   * 
   * @returns Sources sorted by popularity
   */
  getSourcesByPopularity(): RegistryEntry[] {
    return this.getAllSources()
      .filter(source => source.downloads !== undefined)
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  }

  /**
   * Get recently updated sources
   * 
   * @param days - Number of days to look back
   * @returns Recently updated sources
   */
  getRecentlyUpdated(days: number = 30): RegistryEntry[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return this.getAllSources()
      .filter(source => {
        if (!source.lastUpdated) return false;
        return new Date(source.lastUpdated) >= cutoff;
      })
      .sort((a, b) => {
        const dateA = new Date(a.lastUpdated!).getTime();
        const dateB = new Date(b.lastUpdated!).getTime();
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
  registerSource(entry: RegistryEntry): void {
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
      source.languages?.forEach(lang => {
        languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
      });

      // Count tags
      source.tags?.forEach(tag => {
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
      const entries = JSON.parse(json) as RegistryEntry[];
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
 * import { getAllSources } from '@joyboy/source-registry';
 * const sources = getAllSources();
 * ```
 */
export function getAllSources(): RegistryEntry[] {
  return sourceCatalog.getAllSources();
}

/**
 * Get a source by ID
 * 
 * @param id - Source identifier
 * @returns Registry entry or undefined
 */
export function getSourceById(id: string): RegistryEntry | undefined {
  return sourceCatalog.getSource(id);
}

/**
 * Search sources by query
 * 
 * @param query - Search query
 * @returns Matching sources
 */
export function searchSources(query: string): RegistryEntry[] {
  return sourceCatalog.searchSources(query);
}

/**
 * Get sources by language
 * 
 * @param language - Language code
 * @returns Sources supporting the language
 */
export function getSourcesByLanguage(language: string): RegistryEntry[] {
  return sourceCatalog.getSourcesByLanguage(language);
}

/**
 * Get official sources
 * 
 * @returns Official sources
 */
export function getOfficialSources(): RegistryEntry[] {
  return sourceCatalog.getOfficialSources();
}

/**
 * Get SFW sources
 * 
 * @returns Safe-for-work sources
 */
export function getSFWSources(): RegistryEntry[] {
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
export type { SourceInfo } from '@joyboy/types';