/**
 * @joyboy-parser/source-registry v1.2.0
 * Remote-only registry - Always fetches fresh data from GitHub
 * No local caching or bundled JSON files
 */

import { Registry, RegistrySource } from "./types";

/**
 * Default registry URLs pointing to GitHub raw content
 */
export const REGISTRY_URLS = {
  /** GitHub raw content (primary - always fresh) */
  github: 'https://raw.githubusercontent.com/Alaric-senpai/The-joyboy-project/main/registry/sources.json',
  /** jsDelivr CDN (fallback) */
  jsdelivr: 'https://cdn.jsdelivr.net/gh/Alaric-senpai/The-joyboy-project@main/registry/sources.json',
} as const;

/**
 * Remote registry configuration
 */
export interface RemoteRegistryConfig {
  /** Primary URL to fetch the registry from */
  primaryUrl?: string;
  /** Fallback URL if primary fails */
  fallbackUrl?: string;
  /** Timeout for requests in milliseconds (default: 15000) */
  timeout?: number;
  /** Custom fetch implementation (optional) */
  fetchImplementation?: typeof fetch;
}

/**
 * Remote registry manager - Always fetches fresh data
 * No caching to ensure integrity hashes are always up-to-date
 */
export class RemoteRegistry {
  private config: Required<Omit<RemoteRegistryConfig, 'fetchImplementation'>> & { fetchImplementation?: typeof fetch };
  private fetchFn: typeof fetch;

  constructor(config: RemoteRegistryConfig = {}) {
    this.config = {
      primaryUrl: config.primaryUrl || REGISTRY_URLS.github,
      fallbackUrl: config.fallbackUrl || REGISTRY_URLS.jsdelivr,
      timeout: config.timeout || 15000,
      fetchImplementation: config.fetchImplementation,
    };

    this.fetchFn = config.fetchImplementation || fetch;

    if (typeof fetch === 'undefined' && !config.fetchImplementation) {
      throw new Error(
        'fetch is not available. Please provide fetchImplementation or use Node.js 18+'
      );
    }
  }

  /**
   * Fetch registry from remote - always fresh, no caching
   */
  async fetchRegistry(): Promise<Registry> {
    // Add cache-busting timestamp to prevent CDN caching
    const timestamp = Date.now();
    
    // Try primary URL first (GitHub raw - always fresh)
    try {
      return await this.fetchFromUrl(`${this.config.primaryUrl}?_t=${timestamp}`);
    } catch (primaryError) {
      console.warn(`Primary registry fetch failed: ${(primaryError as Error).message}`);
      console.warn('Trying fallback URL...');
      
      // Try fallback URL (jsDelivr)
      try {
        return await this.fetchFromUrl(`${this.config.fallbackUrl}?_t=${timestamp}`);
      } catch (fallbackError) {
        throw new Error(
          `Failed to fetch registry from both URLs.\n` +
          `Primary (${this.config.primaryUrl}): ${(primaryError as Error).message}\n` +
          `Fallback (${this.config.fallbackUrl}): ${(fallbackError as Error).message}`
        );
      }
    }
  }

  /**
   * Fetch from a specific URL with timeout
   */
  private async fetchFromUrl(url: string): Promise<Registry> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await this.fetchFn(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as Registry;
      this.validateRegistry(data);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Validate registry structure
   */
  private validateRegistry(data: unknown): asserts data is Registry {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid registry: expected object');
    }

    const registry = data as Registry;
    
    if (!Array.isArray(registry.sources)) {
      throw new Error('Invalid registry: sources must be an array');
    }

    if (!registry.version || !registry.metadata) {
      throw new Error('Invalid registry: missing version or metadata');
    }
  }

  /**
   * Get all sources from the registry (fresh fetch)
   */
  async getSources(): Promise<RegistrySource[]> {
    const registry = await this.fetchRegistry();
    return registry.sources;
  }

  /**
   * Get a specific source by ID (fresh fetch)
   */
  async getSource(id: string): Promise<RegistrySource | undefined> {
    const sources = await this.getSources();
    return sources.find(source => source.id === id);
  }

  /**
   * Search sources by name, description, or tags (fresh fetch)
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
   * Get registry metadata (fresh fetch)
   */
  async getMetadata() {
    const registry = await this.fetchRegistry();
    return {
      version: registry.version,
      ...registry.metadata
    };
  }

  /**
   * Get registry notices (fresh fetch)
   */
  async getNotices() {
    const registry = await this.fetchRegistry();
    return registry.notices;
  }
}

/**
 * Create a remote registry instance
 * 
 * @example
 * ```ts
 * const registry = createRemoteRegistry();
 * const sources = await registry.getSources();
 * ```
 */
export function createRemoteRegistry(config?: RemoteRegistryConfig): RemoteRegistry {
  return new RemoteRegistry(config);
}
