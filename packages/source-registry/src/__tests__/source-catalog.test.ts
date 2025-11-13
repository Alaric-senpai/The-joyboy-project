// packages/source-registry/src/__tests__/source-catalog.test.ts

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SourceCatalog } from '../source-catalog';
import {
  getAllSources,
  getSourceById,
  searchSources,
  getSourcesByLanguage,
  getOfficialSources,
  getSFWSources,
  getStatistics,
} from '../source-catalog';
import type { Registry } from '../types';

describe('SourceCatalog', () => {
  let catalog: SourceCatalog;
  let mockFetch: any;

  const mockRegistryData: Registry = {
    version: '1.0.0',
    metadata: {
      lastUpdated: '2025-11-13T12:00:00Z',
      totalSources: 3,
      maintainer: 'Test Team',
      url: 'https://github.com/test/test',
      description: 'Test registry',
      license: 'MIT',
    },
    sources: [
      {
        id: 'mangadex',
        name: 'MangaDex',
        version: '1.0.0',
        baseUrl: 'https://api.mangadex.org',
        description: 'MangaDex API parser',
        icon: 'https://mangadex.org/favicon.ico',
        author: 'Test Author',
        repository: 'https://github.com/test/mangadex',
        downloads: {
          stable: 'https://cdn.jsdelivr.net/gh/test/mangadex.js',
          latest: 'https://cdn.jsdelivr.net/gh/test/mangadex.js',
          versions: {
            '1.0.0': 'https://cdn.jsdelivr.net/gh/test/mangadex.js',
          },
        },
        integrity: {
          sha256: 'abc123',
        },
        metadata: {
          languages: ['en', 'ja', 'es'],
          nsfw: false,
          official: true,
          tags: ['manga', 'api', 'multi-language'],
          lastUpdated: '2025-11-13T12:00:00Z',
          minCoreVersion: '1.0.0',
          websiteUrl: 'https://mangadex.org',
          supportUrl: 'https://github.com/test/mangadex/issues',
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
          downloads: 100,
          stars: 50,
          rating: 4.5,
          activeUsers: 1000,
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
      {
        id: 'mangafire',
        name: 'MangaFire',
        version: '1.0.0',
        baseUrl: 'https://mangafire.to',
        description: 'MangaFire scraper',
        icon: 'https://mangafire.to/favicon.ico',
        author: 'Test Author',
        repository: 'https://github.com/test/mangafire',
        downloads: {
          stable: 'https://cdn.jsdelivr.net/gh/test/mangafire.js',
          latest: 'https://cdn.jsdelivr.net/gh/test/mangafire.js',
          versions: {
            '1.0.0': 'https://cdn.jsdelivr.net/gh/test/mangafire.js',
          },
        },
        integrity: {
          sha256: 'def456',
        },
        metadata: {
          languages: ['en'],
          nsfw: false,
          official: false,
          tags: ['manga', 'scraper'],
          lastUpdated: '2025-11-13T12:00:00Z',
          minCoreVersion: '1.0.0',
          websiteUrl: 'https://mangafire.to',
          supportUrl: 'https://github.com/test/mangafire/issues',
        },
        legal: {
          disclaimer: 'Test disclaimer',
          sourceType: 'scraper',
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
          downloads: 50,
          stars: 25,
          rating: 4.0,
          activeUsers: 500,
        },
        capabilities: {
          supportsSearch: true,
          supportsTrending: true,
          supportsLatest: true,
          supportsFilters: false,
          supportsPopular: true,
          supportsAuth: false,
          supportsDownload: true,
          supportsBookmarks: true,
        },
      },
      {
        id: 'nsfw-source',
        name: 'NSFW Source',
        version: '1.0.0',
        baseUrl: 'https://nsfw.com',
        description: 'NSFW content source',
        icon: 'https://nsfw.com/favicon.ico',
        author: 'Test Author',
        repository: 'https://github.com/test/nsfw',
        downloads: {
          stable: 'https://cdn.jsdelivr.net/gh/test/nsfw.js',
          latest: 'https://cdn.jsdelivr.net/gh/test/nsfw.js',
          versions: {
            '1.0.0': 'https://cdn.jsdelivr.net/gh/test/nsfw.js',
          },
        },
        integrity: {
          sha256: 'ghi789',
        },
        metadata: {
          languages: ['en'],
          nsfw: true,
          official: false,
          tags: ['manga', 'nsfw'],
          lastUpdated: '2025-11-13T12:00:00Z',
          minCoreVersion: '1.0.0',
          websiteUrl: 'https://nsfw.com',
          supportUrl: 'https://github.com/test/nsfw/issues',
        },
        legal: {
          disclaimer: 'Test disclaimer',
          sourceType: 'scraper',
          requiresAuth: true,
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
          downloads: 10,
          stars: 5,
          rating: 3.5,
          activeUsers: 100,
        },
        capabilities: {
          supportsSearch: true,
          supportsTrending: false,
          supportsLatest: true,
          supportsFilters: false,
          supportsPopular: false,
          supportsAuth: true,
          supportsDownload: true,
          supportsBookmarks: true,
        },
      },
    ],
    categories: {
      official: ['mangadex'],
      community: ['mangafire', 'nsfw-source'],
      api: ['mangadex'],
      scraper: ['mangafire', 'nsfw-source'],
      'multi-language': ['mangadex'],
      'english-only': ['mangafire', 'nsfw-source'],
      nsfw: ['nsfw-source'],
      sfw: ['mangadex', 'mangafire'],
    },
    featured: ['mangadex'],
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

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    catalog = new SourceCatalog();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should initialize with bundled sources', () => {
      const sources = catalog.getAllSources();
      expect(sources).toBeDefined();
      expect(Array.isArray(sources)).toBe(true);
    });

    it('should get all sources', () => {
      const sources = catalog.getAllSources();
      expect(sources.length).toBeGreaterThan(0);
      sources.forEach(source => {
        expect(source).toHaveProperty('id');
        expect(source).toHaveProperty('name');
        expect(source).toHaveProperty('version');
      });
    });

    it('should get source by ID', () => {
      const sources = catalog.getAllSources();
      if (sources.length > 0) {
        const firstSource = sources[0];
        const found = catalog.getSource(firstSource.id);
        expect(found).toEqual(firstSource);
      }

      const notFound = catalog.getSource('non-existent-source');
      expect(notFound).toBeUndefined();
    });
  });

  describe('Search Functionality', () => {
    it('should search sources by name', () => {
      const allSources = catalog.getAllSources();
      if (allSources.length > 0) {
        const firstSource = allSources[0];
        const results = catalog.searchSources(firstSource.name.substring(0, 4));
        expect(results.length).toBeGreaterThan(0);
      }
    });

    it('should search sources by ID', () => {
      const allSources = catalog.getAllSources();
      if (allSources.length > 0) {
        const firstSource = allSources[0];
        const results = catalog.searchSources(firstSource.id);
        expect(results).toContainEqual(firstSource);
      }
    });

    it('should search sources by tags', () => {
      const allSources = catalog.getAllSources();
      const sourcesWithTags = allSources.filter(s => s.metadata.tags.length > 0);
      
      if (sourcesWithTags.length > 0) {
        const tag = sourcesWithTags[0].metadata.tags[0];
        const results = catalog.searchSources(tag);
        expect(results.length).toBeGreaterThan(0);
      }
    });

    it('should return all sources for empty query', () => {
      const allSources = catalog.getAllSources();
      const results = catalog.searchSources('');
      expect(results).toEqual(allSources);
    });

    it('should handle case-insensitive search', () => {
      const allSources = catalog.getAllSources();
      if (allSources.length > 0) {
        const firstSource = allSources[0];
        const lowerResults = catalog.searchSources(firstSource.name.toLowerCase());
        const upperResults = catalog.searchSources(firstSource.name.toUpperCase());
        expect(lowerResults.length).toBeGreaterThan(0);
        expect(upperResults.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Language Filtering', () => {
    it('should filter sources by single language', () => {
      const englishSources = catalog.getSourcesByLanguage('en');
      expect(Array.isArray(englishSources)).toBe(true);
      englishSources.forEach(source => {
        expect(source.metadata.languages).toContain('en');
      });
    });

    it('should filter sources by multiple languages', () => {
      const sources = catalog.getSourcesByLanguages(['en', 'ja']);
      expect(Array.isArray(sources)).toBe(true);
      sources.forEach(source => {
        const hasEn = source.metadata.languages.includes('en');
        const hasJa = source.metadata.languages.includes('ja');
        expect(hasEn || hasJa).toBe(true);
      });
    });

    it('should handle non-existent language', () => {
      const sources = catalog.getSourcesByLanguage('xyz');
      expect(sources).toEqual([]);
    });
  });

  describe('Source Filtering', () => {
    it('should get official sources', () => {
      const official = catalog.getOfficialSources();
      expect(Array.isArray(official)).toBe(true);
      official.forEach(source => {
        expect(source.metadata.official).toBe(true);
      });
    });

    it('should get community sources', () => {
      const community = catalog.getCommunitySources();
      expect(Array.isArray(community)).toBe(true);
      community.forEach(source => {
        expect(source.metadata.official).toBe(false);
      });
    });

    it('should get SFW sources', () => {
      const sfw = catalog.getSFWSources();
      expect(Array.isArray(sfw)).toBe(true);
      sfw.forEach(source => {
        expect(source.metadata.nsfw).toBe(false);
      });
    });

    it('should get NSFW sources', () => {
      const nsfw = catalog.getNSFWSources();
      expect(Array.isArray(nsfw)).toBe(true);
      nsfw.forEach(source => {
        expect(source.metadata.nsfw).toBe(true);
      });
    });
  });

  describe('Source Registration', () => {
    it('should register a new source', () => {
      const newSource = {
        id: 'test-new-source',
        name: 'Test New Source',
        version: '1.0.0',
        baseUrl: 'https://test.com',
        description: 'Test source',
        icon: 'https://test.com/icon.png',
        author: 'Test Author',
        repository: 'https://github.com/test/test',
        downloads: {
          stable: 'https://test.com/stable.js',
          latest: 'https://test.com/latest.js',
          versions: { '1.0.0': 'https://test.com/v1.0.0.js' },
        },
        integrity: { sha256: 'test123' },
        metadata: {
          languages: ['en'],
          nsfw: false,
          official: false,
          tags: ['test'],
          lastUpdated: '2025-11-13T12:00:00Z',
          minCoreVersion: '1.0.0',
          websiteUrl: 'https://test.com',
          supportUrl: 'https://github.com/test/test/issues',
        },
        legal: {
          disclaimer: 'Test',
          sourceType: 'api' as const,
          requiresAuth: false,
        },
        changelog: [],
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
          supportsFilters: false,
          supportsPopular: true,
          supportsAuth: false,
          supportsDownload: true,
          supportsBookmarks: true,
        },
      };

      catalog.registerSource(newSource);
      const found = catalog.getSource('test-new-source');
      expect(found).toEqual(newSource);
    });

    it('should unregister a source', () => {
      const sources = catalog.getAllSources();
      if (sources.length > 0) {
        const sourceId = sources[0].id;
        const removed = catalog.unregisterSource(sourceId);
        expect(removed).toBe(true);
        
        const found = catalog.getSource(sourceId);
        expect(found).toBeUndefined();
      }
    });

    it('should return false when unregistering non-existent source', () => {
      const removed = catalog.unregisterSource('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should return registry statistics', () => {
      const stats = catalog.getStatistics();
      
      expect(stats).toHaveProperty('totalSources');
      expect(stats).toHaveProperty('officialSources');
      expect(stats).toHaveProperty('communitySources');
      expect(stats).toHaveProperty('nsfwSources');
      expect(stats).toHaveProperty('sfwSources');
      expect(stats).toHaveProperty('languageDistribution');
      expect(stats).toHaveProperty('tagDistribution');
      
      expect(typeof stats.totalSources).toBe('number');
      expect(typeof stats.officialSources).toBe('number');
      expect(typeof stats.communitySources).toBe('number');
      expect(typeof stats.nsfwSources).toBe('number');
      expect(typeof stats.sfwSources).toBe('number');
      
      expect(stats.totalSources).toBeGreaterThanOrEqual(0);
      expect(stats.officialSources + stats.communitySources).toBe(stats.totalSources);
      expect(stats.nsfwSources + stats.sfwSources).toBe(stats.totalSources);
    });

    it('should calculate language distribution correctly', () => {
      const stats = catalog.getStatistics();
      const sources = catalog.getAllSources();
      
      const expectedDistribution: Record<string, number> = {};
      sources.forEach(source => {
        source.metadata.languages.forEach(lang => {
          expectedDistribution[lang] = (expectedDistribution[lang] || 0) + 1;
        });
      });
      
      expect(stats.languageDistribution).toEqual(expectedDistribution);
    });

    it('should calculate tag distribution correctly', () => {
      const stats = catalog.getStatistics();
      const sources = catalog.getAllSources();
      
      const expectedDistribution: Record<string, number> = {};
      sources.forEach(source => {
        source.metadata.tags.forEach(tag => {
          expectedDistribution[tag] = (expectedDistribution[tag] || 0) + 1;
        });
      });
      
      expect(stats.tagDistribution).toEqual(expectedDistribution);
    });
  });

  describe('Remote Sync', () => {
    it('should sync with remote registry', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      await catalog.syncWithRemote();
      
      const sources = catalog.getAllSources();
      expect(sources).toHaveLength(3);
      
      const mangadex = catalog.getSource('mangadex');
      expect(mangadex).toBeDefined();
      expect(mangadex?.name).toBe('MangaDex');
    });

    it('should handle sync errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(catalog.syncWithRemote()).resolves.not.toThrow();
      
      // Should still have bundled sources
      const sources = catalog.getAllSources();
      expect(sources).toBeDefined();
    });

    it('should replace local sources with remote sources on sync', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      const beforeSync = catalog.getAllSources().length;
      await catalog.syncWithRemote();
      const afterSync = catalog.getAllSources().length;
      
      // After sync, should have exact number from remote
      expect(afterSync).toBe(3);
    });
  });

  describe('Tag-based Filtering', () => {
    it('should filter sources by single tag', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      await catalog.syncWithRemote();
      
      const apiSources = catalog.getSourcesByTag('api');
      expect(apiSources.length).toBeGreaterThan(0);
      apiSources.forEach(source => {
        expect(source.metadata.tags).toContain('api');
      });
    });

    it('should filter sources by multiple tags (AND logic)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      await catalog.syncWithRemote();
      
      const sources = catalog.getSourcesByTags(['manga', 'api']);
      expect(sources.length).toBeGreaterThan(0);
      sources.forEach(source => {
        expect(source.metadata.tags).toContain('manga');
        expect(source.metadata.tags).toContain('api');
      });
    });

    it('should handle case-insensitive tag search', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      await catalog.syncWithRemote();
      
      const lowerResults = catalog.getSourcesByTag('api');
      const upperResults = catalog.getSourcesByTag('API');
      expect(lowerResults).toEqual(upperResults);
    });
  });

  describe('Sorting and Ranking', () => {
    it('should get sources sorted by rating', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      await catalog.syncWithRemote();
      
      const byRating = catalog.getSourcesByRating();
      expect(byRating.length).toBeGreaterThan(0);
      
      // Check that ratings are in descending order
      for (let i = 0; i < byRating.length - 1; i++) {
        expect(byRating[i].statistics.rating).toBeGreaterThanOrEqual(
          byRating[i + 1].statistics.rating
        );
      }
    });

    it('should get sources sorted by popularity', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      await catalog.syncWithRemote();
      
      const byPopularity = catalog.getSourcesByPopularity();
      expect(byPopularity.length).toBeGreaterThan(0);
      
      // Check that downloads are in descending order
      for (let i = 0; i < byPopularity.length - 1; i++) {
        expect(byPopularity[i].statistics.downloads).toBeGreaterThanOrEqual(
          byPopularity[i + 1].statistics.downloads
        );
      }
    });
  });

  describe('Recently Updated', () => {
    it('should get recently updated sources', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      await catalog.syncWithRemote();
      
      const recent = catalog.getRecentlyUpdated(30);
      expect(Array.isArray(recent)).toBe(true);
      
      // All returned sources should have lastUpdated within 30 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      
      recent.forEach(source => {
        const lastUpdated = new Date(source.metadata.lastUpdated);
        expect(lastUpdated.getTime()).toBeGreaterThanOrEqual(cutoff.getTime());
      });
    });

    it('should handle custom days parameter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryData,
      });

      await catalog.syncWithRemote();
      
      const recent7 = catalog.getRecentlyUpdated(7);
      const recent30 = catalog.getRecentlyUpdated(30);
      
      expect(Array.isArray(recent7)).toBe(true);
      expect(Array.isArray(recent30)).toBe(true);
    });
  });

  describe('Source Count', () => {
    it('should return accurate source count', () => {
      const count = catalog.getSourceCount();
      const sources = catalog.getAllSources();
      expect(count).toBe(sources.length);
    });

    it('should update count after registration', () => {
      const initialCount = catalog.getSourceCount();
      
      catalog.registerSource({
        id: 'test-count-source',
        name: 'Test Count',
        version: '1.0.0',
        baseUrl: 'https://test.com',
        description: 'Test',
        icon: 'https://test.com/icon.png',
        author: 'Test',
        repository: 'https://github.com/test/test',
        downloads: {
          stable: 'https://test.com/stable.js',
          latest: 'https://test.com/latest.js',
          versions: { '1.0.0': 'https://test.com/v1.0.0.js' },
        },
        integrity: { sha256: 'test' },
        metadata: {
          languages: ['en'],
          nsfw: false,
          official: false,
          tags: [],
          lastUpdated: '2025-11-13T12:00:00Z',
          minCoreVersion: '1.0.0',
          websiteUrl: 'https://test.com',
          supportUrl: 'https://github.com/test/test/issues',
        },
        legal: {
          disclaimer: 'Test',
          sourceType: 'api',
          requiresAuth: false,
        },
        changelog: [],
        statistics: { downloads: 0, stars: 0, rating: 0, activeUsers: 0 },
        capabilities: {
          supportsSearch: true,
          supportsTrending: false,
          supportsLatest: true,
          supportsFilters: false,
          supportsPopular: true,
          supportsAuth: false,
          supportsDownload: true,
          supportsBookmarks: true,
        },
      });
      
      expect(catalog.getSourceCount()).toBe(initialCount + 1);
    });
  });

  describe('Import/Export', () => {
    it('should export sources to JSON', () => {
      const json = catalog.exportToJSON();
      expect(typeof json).toBe('string');
      
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should import sources from JSON', () => {
      const testSource = [{
        id: 'imported-source',
        name: 'Imported Source',
        version: '1.0.0',
        baseUrl: 'https://imported.com',
        description: 'Imported',
        icon: 'https://imported.com/icon.png',
        author: 'Test',
        repository: 'https://github.com/test/imported',
        downloads: {
          stable: 'https://imported.com/stable.js',
          latest: 'https://imported.com/latest.js',
          versions: { '1.0.0': 'https://imported.com/v1.0.0.js' },
        },
        integrity: { sha256: 'imported' },
        metadata: {
          languages: ['en'],
          nsfw: false,
          official: false,
          tags: ['imported'],
          lastUpdated: '2025-11-13T12:00:00Z',
          minCoreVersion: '1.0.0',
          websiteUrl: 'https://imported.com',
          supportUrl: 'https://github.com/test/imported/issues',
        },
        legal: {
          disclaimer: 'Test',
          sourceType: 'api' as const,
          requiresAuth: false,
        },
        changelog: [],
        statistics: { downloads: 0, stars: 0, rating: 0, activeUsers: 0 },
        capabilities: {
          supportsSearch: true,
          supportsTrending: false,
          supportsLatest: true,
          supportsFilters: false,
          supportsPopular: true,
          supportsAuth: false,
          supportsDownload: true,
          supportsBookmarks: true,
        },
      }];
      
      catalog.importFromJSON(JSON.stringify(testSource));
      
      const found = catalog.getSource('imported-source');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Imported Source');
    });

    it('should throw error on invalid JSON import', () => {
      expect(() => catalog.importFromJSON('invalid json')).toThrow();
    });
  });

  describe('Clear and Reset', () => {
    it('should clear all sources and reload from bundled JSON', () => {
      catalog.clear();
      const sources = catalog.getAllSources();
      expect(sources).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sources array', () => {
      const emptyCatalog = new SourceCatalog();
      // Even with bundled sources, test the methods work
      expect(() => emptyCatalog.getAllSources()).not.toThrow();
      expect(() => emptyCatalog.getStatistics()).not.toThrow();
    });

    it('should handle sources with empty tags', async () => {
      const dataWithEmptyTags = {
        ...mockRegistryData,
        sources: [
          {
            ...mockRegistryData.sources[0],
            metadata: {
              ...mockRegistryData.sources[0].metadata,
              tags: [],
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dataWithEmptyTags,
      });

      await catalog.syncWithRemote();
      const stats = catalog.getStatistics();
      expect(stats.tagDistribution).toBeDefined();
    });

    it('should handle sources with empty languages', async () => {
      const dataWithEmptyLanguages = {
        ...mockRegistryData,
        sources: [
          {
            ...mockRegistryData.sources[0],
            metadata: {
              ...mockRegistryData.sources[0].metadata,
              languages: [],
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dataWithEmptyLanguages,
      });

      await catalog.syncWithRemote();
      const stats = catalog.getStatistics();
      expect(stats.languageDistribution).toBeDefined();
    });
  });
});

describe('Convenience Functions', () => {
  it('should export getAllSources function', () => {
    const sources = getAllSources();
    expect(Array.isArray(sources)).toBe(true);
  });

  it('should export getSourceById function', () => {
    const sources = getAllSources();
    if (sources.length > 0) {
      const source = getSourceById(sources[0].id);
      expect(source).toBeDefined();
    }
  });

  it('should export searchSources function', () => {
    const results = searchSources('manga');
    expect(Array.isArray(results)).toBe(true);
  });

  it('should export getSourcesByLanguage function', () => {
    const sources = getSourcesByLanguage('en');
    expect(Array.isArray(sources)).toBe(true);
  });

  it('should export getOfficialSources function', () => {
    const sources = getOfficialSources();
    expect(Array.isArray(sources)).toBe(true);
  });

  it('should export getSFWSources function', () => {
    const sources = getSFWSources();
    expect(Array.isArray(sources)).toBe(true);
  });

  it('should export getStatistics function', () => {
    const stats = getStatistics();
    expect(stats).toHaveProperty('totalSources');
    expect(stats).toHaveProperty('officialSources');
    expect(stats).toHaveProperty('communitySources');
  });
});
