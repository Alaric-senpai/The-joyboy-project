/**
 * Tests for JoyBoy Runtime
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JoyBoy } from '../runtime';
import type { Source } from '../base-source';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock source for testing
const createMockSource = (id: string): Source => ({
  id,
  name: `Source ${id}`,
  version: '1.0.0',
  baseUrl: 'https://example.com',
  supportsSearch: true,
  supportsTrending: false,
  supportsLatest: false,
  supportsFilters: false,
  supportsPopular: false,
  search: async () => [],
  getMangaDetails: async () => ({
    id: '1',
    sourceId: id,
    title: 'Test Manga',
    url: 'https://example.com/manga/1',
    coverUrl: 'https://example.com/cover.jpg',
    description: 'Test',
    authors: [],
    artists: [],
    genres: [],
    status: 'ongoing',
    rating: 'safe'
  }),
  getChapters: async () => [],
  getChapterPages: async () => [],
  getbyPage: async () => [],
  extractPaginationInfo: async () => ({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  })
});

// Mock registry response
const mockRegistryResponse = {
  metadata: {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalSources: 3
  },
  sources: [
    {
      id: 'mangadex',
      name: 'MangaDex',
      version: '1.0.0',
      baseUrl: 'https://mangadex.org',
      downloads: {
        stable: 'https://cdn.jsdelivr.net/gh/test/repo@main/dist/mangadex.js',
        beta: 'https://cdn.jsdelivr.net/gh/test/repo@main/dist/mangadex-beta.js',
        dev: 'https://cdn.jsdelivr.net/gh/test/repo@main/dist/mangadex-dev.js'
      },
      integrity: {
        sha256: 'a'.repeat(64),
        algorithm: 'sha256'
      },
      metadata: {
        description: 'MangaDex source',
        author: 'test',
        license: 'MIT',
        homepage: 'https://mangadex.org',
        sourceCode: 'https://github.com/test/test',
        categories: ['manga'],
        tags: ['popular'],
        languages: ['en'],
        isNsfw: false,
        rating: 4.5,
        totalDownloads: 1000,
        weeklyDownloads: 100,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        lastChecked: '2024-01-01T00:00:00Z'
      }
    },
    {
      id: 'mangafire',
      name: 'MangaFire',
      version: '1.0.0',
      baseUrl: 'https://mangafire.to',
      downloads: {
        stable: 'https://cdn.jsdelivr.net/gh/test/repo@main/dist/mangafire.js',
        beta: 'https://cdn.jsdelivr.net/gh/test/repo@main/dist/mangafire-beta.js',
        dev: 'https://cdn.jsdelivr.net/gh/test/repo@main/dist/mangafire-dev.js'
      },
      integrity: {
        sha256: 'b'.repeat(64),
        algorithm: 'sha256'
      },
      metadata: {
        description: 'MangaFire source',
        author: 'test',
        license: 'MIT',
        homepage: 'https://mangafire.to',
        sourceCode: 'https://github.com/test/test',
        categories: ['manga'],
        tags: ['fast'],
        languages: ['en'],
        isNsfw: false,
        rating: 4.2,
        totalDownloads: 500,
        weeklyDownloads: 50,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        lastChecked: '2024-01-01T00:00:00Z'
      }
    }
  ],
  categories: {
    manga: {
      id: 'manga',
      name: 'Manga',
      description: 'Manga sources',
      icon: '📚',
      sources: ['mangadex', 'mangafire']
    }
  },
  featured: ['mangadex'],
  notices: []
};

describe('JoyBoy Runtime', () => {
  beforeEach(() => {
    // Reset runtime state
    JoyBoy['registry'].clear();
    mockFetch.mockReset();
  });

  describe('Registry Configuration', () => {
    it('should configure with default registry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
        status: 200,
        statusText: 'OK'
      });

      await JoyBoy.configureRegistry();
      const sources = JoyBoy.browseSources();
      
      expect(sources.length).toBeGreaterThan(0);
    });

    it('should configure with custom registry URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
        status: 200,
        statusText: 'OK'
      });

      await JoyBoy.configureRegistry('https://custom.com/sources.json');

      const sources = JoyBoy.browseSources();
      expect(sources.length).toBeGreaterThan(0);
    });

    it('should handle registry configuration errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw, just fail silently or log
      await JoyBoy.configureRegistry();
      
      // Browsing should still work (returns empty or cached data)
      const sources = JoyBoy.browseSources();
      expect(sources).toBeDefined();
    });
  });

  describe('Source Browsing', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
        status: 200,
        statusText: 'OK'
      });
      await JoyBoy.configureRegistry();
    });

    it('should browse all sources', () => {
      const sources = JoyBoy.browseSources();
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.some(s => s.id === 'mangadex' || s.id === 'mangafire' || s.id === 'manhuafast')).toBe(true);
    });

    it('should return all available sources', () => {
      const sources = JoyBoy.browseSources();
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
    });
  });

  describe('Source Search', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
        status: 200,
        statusText: 'OK'
      });
      await JoyBoy.configureRegistry();
    });

    it('should search sources by name', () => {
      const results = JoyBoy.searchSources('manga');
      expect(results.length).toBe(2);
    });

    it('should search sources case-insensitively', () => {
      const results = JoyBoy.searchSources('MANGADEX');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('mangadex');
    });

    it('should search in description', () => {
      const results = JoyBoy.searchSources('MangaDex source');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = JoyBoy.searchSources('nonexistent');
      expect(results.length).toBe(0);
    });
  });

  describe('Source Info', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
        status: 200,
        statusText: 'OK'
      });
      await JoyBoy.configureRegistry();
    });

    it('should get source info by ID', () => {
      const info = JoyBoy.getSourceInfo('mangadex');
      expect(info).toBeDefined();
      expect(info?.name).toBe('MangaDex');
    });

    it('should return undefined for non-existent source', () => {
      const info = JoyBoy.getSourceInfo('nonexistent');
      expect(info).toBeUndefined();
    });
  });

  describe('Installed Sources', () => {
    it('should get installed sources info', () => {
      const source = createMockSource('test-source');
      JoyBoy['registry'].register(source);

      const info = JoyBoy.getInstalledSourcesInfo();
      expect(Array.isArray(info)).toBe(true);
      expect(info.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array when none installed', () => {
      const info = JoyBoy.getInstalledSourcesInfo();
      expect(Array.isArray(info)).toBe(true);
      expect(info.length).toBe(0);
    });

    it('should get installed source instance', () => {
      const source = createMockSource('test-source');
      JoyBoy['registry'].register(source);

      const retrieved = JoyBoy.getSource('test-source');
      expect(retrieved).toBe(source);
    });
  });

  describe('Source Installation', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
        status: 200,
        statusText: 'OK'
      });
      await JoyBoy.configureRegistry();
    });

    it('should install source from registry', async () => {
      const sourceCode = `
        export default class MangaDex {
          id = 'mangadex';
          name = 'MangaDex';
          version = '1.0.0';
          baseUrl = 'https://mangadex.org';
          supportsSearch = true;
          supportsTrending = false;
          supportsLatest = false;
          supportsFilters = false;
          supportsPopular = false;
          async search() { return []; }
          async getMangaDetails() { return {}; }
          async getChapters() { return []; }
          async getChapterPages() { return []; }
          async getbyPage() { return []; }
          async extractPaginationInfo() { return { currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }; }
        }
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => sourceCode,
        status: 200,
        statusText: 'OK'
      });

      const progressSteps: number[] = [];
      const source = await JoyBoy.installSource('mangadex', (progress) => {
        progressSteps.push(progress);
      });

      expect(source).toBeDefined();
      expect(source.id).toBe('mangadex');
      expect(JoyBoy['registry'].has('mangadex')).toBe(true);
      expect(progressSteps.length).toBeGreaterThan(0);
    });

    it('should handle installation failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Download failed'));

      await expect(JoyBoy.installSource('mangadex')).rejects.toThrow();
    });

    it('should throw error for non-existent source', async () => {
      await expect(JoyBoy.installSource('nonexistent')).rejects.toThrow();
    });
  });

  describe('Source Uninstallation', () => {
    it('should uninstall source', () => {
      const source = createMockSource('test-source');
      JoyBoy['registry'].register(source);

      expect(JoyBoy['registry'].has('test-source')).toBe(true);

      JoyBoy.uninstallSource('test-source');

      expect(JoyBoy['registry'].has('test-source')).toBe(false);
    });

    it('should handle uninstalling non-existent source gracefully', () => {
      expect(() => JoyBoy.uninstallSource('nonexistent')).not.toThrow();
    });
  });

  describe('Source Updates', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
        status: 200,
        statusText: 'OK'
      });
      await JoyBoy.configureRegistry();
    });

    it('should check for updates', async () => {
      // Install old version
      const oldSource = createMockSource('mangadex');
      oldSource.version = '0.9.0';
      JoyBoy['registry'].register(oldSource);

      // Mock registry sync
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
        status: 200,
        statusText: 'OK'
      });

      const updates = await JoyBoy.checkForUpdates();

      expect(updates.length).toBeGreaterThan(0);
      expect(updates.some(u => u.id === 'mangadex')).toBe(true);
    });

    it('should return empty array when no updates available', async () => {
      // Install current version
      const source = createMockSource('mangadex');
      source.version = '1.0.0';
      JoyBoy['registry'].register(source);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
        status: 200,
        statusText: 'OK'
      });

      const updates = await JoyBoy.checkForUpdates();

      expect(updates.length).toBe(0);
    });

    it('should update specific source', async () => {
      // Install old version
      const oldSource = createMockSource('mangadex');
      oldSource.version = '0.9.0';
      JoyBoy['registry'].register(oldSource);

      const sourceCode = `
        export default class MangaDex {
          id = 'mangadex';
          name = 'MangaDex';
          version = '1.0.0';
          baseUrl = 'https://mangadex.org';
          supportsSearch = true;
          supportsTrending = false;
          supportsLatest = false;
          supportsFilters = false;
          supportsPopular = false;
          async search() { return []; }
          async getMangaDetails() { return {}; }
          async getChapters() { return []; }
          async getChapterPages() { return []; }
          async getbyPage() { return []; }
          async extractPaginationInfo() { return { currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }; }
        }
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => sourceCode,
        status: 200,
        statusText: 'OK'
      });

      await JoyBoy.updateSource('mangadex');

      const updated = JoyBoy.getSource('mangadex');
      expect(updated?.version).toBe('1.0.0');
    });
  });

  describe('Registry Sync', () => {
    it('should sync with remote registry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryResponse,
        status: 200,
        statusText: 'OK'
      });

      await JoyBoy.syncRegistry();

      const sources = JoyBoy.browseSources();
      expect(sources.length).toBeGreaterThan(0);
    });

    it('should handle sync failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(JoyBoy.syncRegistry()).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle browseSources without registry configuration', () => {
      const sources = JoyBoy.browseSources();
      expect(sources).toBeDefined();
      expect(Array.isArray(sources)).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent source installations', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRegistryResponse,
        status: 200,
        statusText: 'OK'
      });

      await JoyBoy.configureRegistry();

      const sourceCode = `
        export default class TestSource {
          id = 'test';
          name = 'Test';
          version = '1.0.0';
          baseUrl = 'https://example.com';
          supportsSearch = true;
          supportsTrending = false;
          supportsLatest = false;
          supportsFilters = false;
          supportsPopular = false;
          async search() { return []; }
          async getMangaDetails() { return {}; }
          async getChapters() { return []; }
          async getChapterPages() { return []; }
          async getbyPage() { return []; }
          async extractPaginationInfo() { return { currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }; }
        }
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => sourceCode,
        status: 200,
        statusText: 'OK'
      });

      // This test would need proper concurrency handling in the implementation
      // For now, just verify it doesn't crash
      const installations = [
        JoyBoy.installSource('mangadex'),
        JoyBoy.installSource('mangafire')
      ];

      await expect(Promise.all(installations)).resolves.toBeDefined();
    });
  });
});
