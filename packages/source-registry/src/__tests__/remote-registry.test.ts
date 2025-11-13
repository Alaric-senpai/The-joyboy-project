// packages/source-registry/src/__tests__/remote-registry.test.ts

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RemoteRegistry, createRemoteRegistry, DEFAULT_REGISTRY_URLS } from '../remote-registry';
import type { Registry, RegistrySource } from '../types';

describe('RemoteRegistry - Cross-Platform Compatibility', () => {
  let mockFetch: any;

  beforeEach(() => {
    // Mock global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockRegistryData: Registry = {
    version: '1.0.0',
    metadata: {
      lastUpdated: '2025-11-13T12:00:00Z',
      totalSources: 1,
      maintainer: 'Test Team',
      url: 'https://github.com/test/test',
      description: 'Test registry',
      license: 'MIT',
    },
    sources: [
      {
        id: 'test-source',
        name: 'Test Source',
        version: '1.0.0',
        baseUrl: 'https://test.com',
        description: 'Test source',
        icon: 'https://test.com/icon.png',
        author: 'Test Author',
        repository: 'https://github.com/test/test-source',
        downloads: {
          stable: 'https://test.com/stable.js',
          latest: 'https://test.com/latest.js',
          versions: {
            '1.0.0': 'https://test.com/v1.0.0.js',
          },
        },
        integrity: {
          sha256: 'abc123',
        },
        metadata: {
          languages: ['en'],
          nsfw: false,
          official: true,
          tags: ['test', 'sample'],
          lastUpdated: '2025-11-13T12:00:00Z',
          minCoreVersion: '1.0.0',
          websiteUrl: 'https://test.com',
          supportUrl: 'https://github.com/test/test-source/issues',
        },
        legal: {
          disclaimer: 'Test disclaimer',
          sourceType: 'api',
          requiresAuth: false,
        },
        changelog: [
          {
            version: '1.0.0',
            date: '2025-11-13T12:00:00Z',
            changes: ['Initial release'],
            breaking: false,
          },
        ],
        statistics: {
          downloads: 0,
          stars: 0,
          rating: 0,
          activeUsers: 0,
        },
        capabilities: {
          supportsSearch: true,
          supportsTrending: false,
          supportsLatest: true,
          supportsFilters: true,
          supportsPopular: true,
          supportsAuth: false,
          supportsDownload: true,
          supportsBookmarks: true,
        },
      },
    ],
    categories: {
      official: ['test-source'],
      api: ['test-source'],
    },
    featured: ['test-source'],
    deprecated: [],
    notices: [
      {
        type: 'info',
        title: 'Test Notice',
        message: 'This is a test',
        date: '2025-11-13T12:00:00Z',
        dismissible: true,
      },
    ],
  };

  describe('Basic Functionality', () => {
    it('should fetch and cache registry data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      const data = await registry.fetchRegistry();
      expect(data).toEqual(mockRegistryData);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const cachedData = await registry.fetchRegistry();
      expect(cachedData).toEqual(mockRegistryData);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, used cache
    });

    it('should get sources from registry', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      const sources = await registry.getSources();
      expect(sources).toEqual(mockRegistryData.sources);
    });

    it('should get specific source by ID', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      const source = await registry.getSource('test-source');
      expect(source).toEqual(mockRegistryData.sources[0]);

      const notFound = await registry.getSource('non-existent');
      expect(notFound).toBeUndefined();
    });

    it('should respect cache duration', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
        cacheDuration: 100, // 100ms
      });

      await registry.fetchRegistry();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      await registry.fetchRegistry();
      expect(mockFetch).toHaveBeenCalledTimes(2); // Refetched
    });

    it('should clear cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      await registry.fetchRegistry();
      registry.clearCache();

      await registry.fetchRegistry();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Info', () => {
    it('should report cache status', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      let info = registry.getCacheInfo();
      expect(info.isCached).toBe(false);
      expect(info.expiresIn).toBeNull();

      await registry.fetchRegistry();

      info = registry.getCacheInfo();
      expect(info.isCached).toBe(true);
      expect(info.expiresIn).toBeGreaterThan(0);
    });
  });

  describe('Query Methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });
    });

    it('should get sources by category', async () => {
      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      const apiSources = await registry.getSourcesByCategory('api');
      expect(apiSources).toHaveLength(1);
      expect(apiSources[0].id).toBe('test-source');

      const emptySources = await registry.getSourcesByCategory('non-existent');
      expect(emptySources).toHaveLength(0);
    });

    it('should get featured sources', async () => {
      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      const featured = await registry.getFeaturedSources();
      expect(featured).toHaveLength(1);
      expect(featured[0].id).toBe('test-source');
    });

    it('should search sources by name', async () => {
      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      const results = await registry.searchSources('Test Source');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test-source');
    });

    it('should search sources by description', async () => {
      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      const results = await registry.searchSources('Test source');
      expect(results).toHaveLength(1);
    });

    it('should search sources by tags', async () => {
      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      const results = await registry.searchSources('sample');
      expect(results).toHaveLength(1);
    });

    it('should return empty array for no search matches', async () => {
      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      const results = await registry.searchSources('non-existent-query');
      expect(results).toHaveLength(0);
    });

    it('should get registry metadata', async () => {
      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      const metadata = await registry.getMetadata();
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.totalSources).toBe(1);
      expect(metadata.maintainer).toBe('Test Team');
    });

    it('should get registry notices', async () => {
      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      const notices = await registry.getNotices();
      expect(notices).toHaveLength(1);
      expect(notices[0].title).toBe('Test Notice');
      expect(notices[0].type).toBe('info');
    });
  });

  describe('Refresh Method', () => {
    it('should bypass cache and fetch fresh data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      await registry.fetchRegistry();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      await registry.refresh();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      await expect(registry.fetchRegistry()).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      await expect(registry.fetchRegistry()).rejects.toThrow('Network error');
    });

    it('should handle invalid JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ version: '1.0.0' }), // Missing required fields
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      await expect(registry.fetchRegistry()).rejects.toThrow('Invalid registry format');
    });

    it('should handle invalid sources array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          metadata: mockRegistryData.metadata,
          sources: 'not an array', // Invalid
        }),
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      await expect(registry.fetchRegistry()).rejects.toThrow('sources must be an array');
    });

    it('should throw error if fetch is not available', () => {
      const originalFetch = global.fetch;
      delete (global as any).fetch;

      expect(() => {
        new RemoteRegistry({
          registryUrl: 'https://example.com/registry.json',
        });
      }).toThrow(); // Just check it throws, error message varies by environment

      global.fetch = originalFetch;
    });
  });

  describe('Custom Fetch Implementation', () => {
    it('should use custom fetch implementation', async () => {
      const customFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
        fetchImplementation: customFetch as any,
      });

      await registry.fetchRegistry();
      expect(customFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).not.toHaveBeenCalled(); // Global fetch not used
    });

    it('should work without global fetch if custom implementation provided', () => {
      const originalFetch = global.fetch;
      delete (global as any).fetch;

      const customFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      expect(() => {
        new RemoteRegistry({
          registryUrl: 'https://example.com/registry.json',
          fetchImplementation: customFetch as any,
        });
      }).not.toThrow();

      global.fetch = originalFetch;
    });
  });

  describe('Timeout Handling', () => {
    it('should handle timeout configuration', async () => {
      // Test that timeout config is accepted
      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
        timeout: 100,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      const data = await registry.fetchRegistry();
      expect(data).toEqual(mockRegistryData);
    });
  });

  describe('Helper Functions', () => {
    it('should create registry with default URL', () => {
      const registry = createRemoteRegistry();
      expect(registry).toBeInstanceOf(RemoteRegistry);
    });

    it('should create registry with custom URL', () => {
      const registry = createRemoteRegistry('https://custom.com/registry.json');
      expect(registry).toBeInstanceOf(RemoteRegistry);
    });

    it('should create registry with additional config', () => {
      const registry = createRemoteRegistry(DEFAULT_REGISTRY_URLS.github, {
        timeout: 5000,
        cacheDuration: 1000,
      });
      expect(registry).toBeInstanceOf(RemoteRegistry);
    });
  });

  describe('Platform-Specific Scenarios', () => {
    it('should handle AbortController availability', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
        timeout: 5000,
      });

      // Should work whether AbortController exists or not
      const data = await registry.fetchRegistry();
      expect(data).toEqual(mockRegistryData);
    });

    it('should add Accept header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      const registry = new RemoteRegistry({
        registryUrl: 'https://example.com/registry.json',
      });

      await registry.fetchRegistry();

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers['Accept']).toBe('application/json');
    });
  });

  describe('DEFAULT_REGISTRY_URLS', () => {
    it('should have valid default URLs', () => {
      expect(DEFAULT_REGISTRY_URLS.github).toContain('github');
      expect(DEFAULT_REGISTRY_URLS.jsdelivr).toContain('jsdelivr');
      expect(DEFAULT_REGISTRY_URLS.github).toContain('https://');
      expect(DEFAULT_REGISTRY_URLS.jsdelivr).toContain('https://');
    });
  });
});
