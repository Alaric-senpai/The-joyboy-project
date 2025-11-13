
import { Registry, RegistrySource } from "./types";

/**
 * Check if AbortController is available in the current runtime
 */
function hasAbortController(): boolean {
  return typeof AbortController !== 'undefined';
}

/**
 * Check if fetch is available in the current runtime
 */
function hasFetch(): boolean {
  return typeof fetch !== 'undefined';
}

/**
 * Remote registry configuration
 */
export interface RemoteRegistryConfig {
  /** URL to fetch the registry from */
  registryUrl: string;
  
  /** Cache duration in milliseconds */
  cacheDuration?: number;
  
  /** Timeout for requests in milliseconds */
  timeout?: number;
  
  /** Custom fetch implementation (optional, for Node.js < 18 or custom environments) */
  fetchImplementation?: typeof fetch;
}

/**
 * Remote registry manager
 * Compatible with Web, Node.js (18+), and React Native/Expo
 */
export class RemoteRegistry {
  private config: RemoteRegistryConfig;
  private cache: Map<string, { data: Registry; expiry: number }> = new Map();
  private fetchFn: typeof fetch;

  constructor(config: RemoteRegistryConfig) {
    this.config = {
      cacheDuration: 3 * 60 * 60 * 1000, // 3 hours default
      timeout: 30000, // 30 seconds
      ...config
    };

    // Use custom fetch or global fetch
    this.fetchFn = config.fetchImplementation || fetch;

    // Verify fetch is available
    if (!hasFetch() && !config.fetchImplementation) {
      throw new Error(
        'fetch is not available in this environment. ' +
        'Please provide a fetchImplementation in the config or upgrade to Node.js 18+'
      );
    }
  }

  /**
   * Fetch remote registry with timeout and error handling
   * Works in Web, Node.js 18+, React Native, and Expo
   */
  async fetchRegistry(): Promise<Registry> {
    // Check cache first
    const cached = this.cache.get('registry');
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    try {
      let response: Response;

      // Use AbortController if available (Web, Node 18+, RN)
      if (hasAbortController()) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
          response = await this.fetchFn(this.config.registryUrl, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
          });
          clearTimeout(timeoutId);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } else {
        // Fallback: manual timeout using Promise.race
        const fetchPromise = this.fetchFn(this.config.registryUrl, {
          headers: {
            'Accept': 'application/json',
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Request timeout after ${this.config.timeout}ms`)),
            this.config.timeout
          )
        );

        response = await Promise.race([fetchPromise, timeoutPromise]);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as Registry;

      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid registry format: expected a Registry object');
      }

      if (!Array.isArray(data.sources)) {
        throw new Error('Invalid registry format: sources must be an array');
      }

      if (!data.version || !data.metadata) {
        throw new Error('Invalid registry format: missing version or metadata');
      }

      // Cache the result
      this.cache.set('registry', {
        data,
        expiry: Date.now() + (this.config.cacheDuration || 0)
      });

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Enhanced error messages for common issues
      if (errorMessage.includes('abort')) {
        console.error('Registry fetch aborted (timeout or cancelled):', errorMessage);
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        console.error('Network error fetching registry:', errorMessage);
      } else {
        console.error('Failed to fetch remote registry:', errorMessage);
      }
      
      throw new Error(`Registry fetch failed: ${errorMessage}`);
    }
  }

  /**
   * Get all sources from the registry
   */
  async getSources(): Promise<RegistrySource[]> {
    const registry = await this.fetchRegistry();
    return registry.sources;
  }

  /**
   * Get a specific source by ID
   */
  async getSource(id: string): Promise<RegistrySource | undefined> {
    const sources = await this.getSources();
    return sources.find(source => source.id === id);
  }

  /**
   * Get sources by category
   */
  async getSourcesByCategory(category: string): Promise<RegistrySource[]> {
    const registry = await this.fetchRegistry();
    const sourceIds = registry.categories[category] || [];
    return registry.sources.filter(source => sourceIds.includes(source.id));
  }

  /**
   * Get featured sources
   */
  async getFeaturedSources(): Promise<RegistrySource[]> {
    const registry = await this.fetchRegistry();
    return registry.sources.filter(source => registry.featured.includes(source.id));
  }

  /**
   * Search sources by name, description, or tags
   */
  async searchSources(query: string): Promise<RegistrySource[]> {
    const sources = await this.getSources();
    const lowerQuery = query.toLowerCase();
    
    return sources.filter(source => 
      source.name.toLowerCase().includes(lowerQuery) ||
      source.description.toLowerCase().includes(lowerQuery) ||
      source.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get registry metadata
   */
  async getMetadata() {
    const registry = await this.fetchRegistry();
    return {
      version: registry.version,
      ...registry.metadata
    };
  }

  /**
   * Get registry notices
   */
  async getNotices() {
    const registry = await this.fetchRegistry();
    return registry.notices;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheInfo(): { isCached: boolean; expiresIn: number | null } {
    const cached = this.cache.get('registry');
    if (!cached) {
      return { isCached: false, expiresIn: null };
    }

    const expiresIn = cached.expiry - Date.now();
    return {
      isCached: expiresIn > 0,
      expiresIn: expiresIn > 0 ? expiresIn : null,
    };
  }

  /**
   * Force refresh (bypass cache)
   */
  async refresh(): Promise<Registry> {
    this.clearCache();
    return this.fetchRegistry();
  }
}

/**
 * Default registry URLs
 */
export const DEFAULT_REGISTRY_URLS = {
  jsdelivr: 'https://cdn.jsdelivr.net/gh/Alaric-senpai/The-joyboy-project@main/registry/sources.json',
  github: 'https://raw.githubusercontent.com/Alaric-senpai/The-joyboy-project/main/registry/sources.json',
  custom: 'https://api.joyboy.dev/registry',
} as const;

/**
 * Create a remote registry instance
 * 
 * @param url - Registry URL (defaults to GitHub raw URL)
 * @param config - Optional additional configuration
 * 
 * @example
 * ```ts
 * // Default GitHub registry
 * const registry = createRemoteRegistry();
 * const sources = await registry.getSources();
 * 
 * // Get a specific source
 * const mangadex = await registry.getSource('mangadex');
 * 
 * // Get featured sources
 * const featured = await registry.getFeaturedSources();
 * 
 * // Search sources
 * const results = await registry.searchSources('manga');
 * 
 * // Get sources by category
 * const apiSources = await registry.getSourcesByCategory('api');
 * 
 * // Custom URL
 * const customRegistry = createRemoteRegistry('https://my-cdn.com/registry.json');
 * 
 * // With custom config
 * const configuredRegistry = createRemoteRegistry(
 *   DEFAULT_REGISTRY_URLS.github,
 *   { timeout: 10000, cacheDuration: 3600000 }
 * );
 * ```
 */
export function createRemoteRegistry(
  url: string = DEFAULT_REGISTRY_URLS.jsdelivr,
  config?: Omit<RemoteRegistryConfig, 'registryUrl'>
): RemoteRegistry {
  return new RemoteRegistry({ 
    registryUrl: url,
    ...config 
  });
}