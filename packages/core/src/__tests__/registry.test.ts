/**
 * Tests for SourceRegistry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SourceRegistry } from '../registry';
import type { Source } from '../base-source';

// Mock source for testing
const createMockSource = (id: string, overrides: Partial<Source> = {}): Source => ({
  id,
  name: `Test Source ${id}`,
  version: '1.0.0',
  baseUrl: `https://example.com/${id}`,
  supportsSearch: true,
  supportsTrending: false,
  supportsLatest: false,
  supportsFilters: false,
  supportsPopular: false,
  search: async () => [],
  getMangaDetails: async () => ({
    id: '1',
    title: 'Test Manga',
    url: 'https://example.com/manga/1',
    coverUrl: 'https://example.com/cover.jpg',
    description: 'Test Description',
    authors: [],
    artists: [],
    genres: [],
    status: 'ongoing',
    rating: 'safe',
    sourceId: 'test'
  }),
  getChapters: async () => [],
  getChapterPages: async () => [],
  getbyPage: async () => [],
  extractPaginationInfo: async () => ({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  }),
  ...overrides
});

describe('SourceRegistry', () => {
  let registry: SourceRegistry;

  beforeEach(() => {
    // Get a fresh instance and clear it
    registry = SourceRegistry.getInstance();
    registry.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SourceRegistry.getInstance();
      const instance2 = SourceRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('register()', () => {
    it('should register a source', () => {
      const source = createMockSource('test-source');
      registry.register(source);
      
      expect(registry.has('test-source')).toBe(true);
      expect(registry.get('test-source')).toBe(source);
    });

    it('should overwrite existing source with same ID', () => {
      const source1 = createMockSource('test-source', { version: '1.0.0' });
      const source2 = createMockSource('test-source', { version: '2.0.0' });
      
      registry.register(source1);
      registry.register(source2);
      
      expect(registry.get('test-source')?.version).toBe('2.0.0');
    });

    it('should register multiple sources', () => {
      const source1 = createMockSource('source-1');
      const source2 = createMockSource('source-2');
      const source3 = createMockSource('source-3');
      
      registry.register(source1);
      registry.register(source2);
      registry.register(source3);
      
      expect(registry.list()).toHaveLength(3);
    });
  });

  describe('get()', () => {
    it('should return registered source', () => {
      const source = createMockSource('test-source');
      registry.register(source);
      
      const retrieved = registry.get('test-source');
      expect(retrieved).toBe(source);
    });

    it('should return undefined for non-existent source', () => {
      expect(registry.get('non-existent')).toBeUndefined();
    });
  });

  describe('list()', () => {
    it('should return empty array when no sources registered', () => {
      expect(registry.list()).toHaveLength(0);
    });

    it('should return all registered sources', () => {
      const source1 = createMockSource('source-1');
      const source2 = createMockSource('source-2');
      
      registry.register(source1);
      registry.register(source2);
      
      const sources = registry.list();
      expect(sources).toHaveLength(2);
      expect(sources).toContain(source1);
      expect(sources).toContain(source2);
    });

    it('should return array copy, not internal map', () => {
      const source = createMockSource('test-source');
      registry.register(source);
      
      const list1 = registry.list();
      const list2 = registry.list();
      
      expect(list1).not.toBe(list2);
      expect(list1).toEqual(list2);
    });
  });

  describe('unregister()', () => {
    it('should remove registered source', () => {
      const source = createMockSource('test-source');
      registry.register(source);
      
      const result = registry.unregister('test-source');
      
      expect(result).toBe(true);
      expect(registry.has('test-source')).toBe(false);
    });

    it('should return false when removing non-existent source', () => {
      const result = registry.unregister('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should remove all sources', () => {
      registry.register(createMockSource('source-1'));
      registry.register(createMockSource('source-2'));
      registry.register(createMockSource('source-3'));
      
      registry.clear();
      
      expect(registry.list()).toHaveLength(0);
    });
  });

  describe('has()', () => {
    it('should return true for registered source', () => {
      const source = createMockSource('test-source');
      registry.register(source);
      
      expect(registry.has('test-source')).toBe(true);
    });

    it('should return false for non-existent source', () => {
      expect(registry.has('non-existent')).toBe(false);
    });

    it('should return false after source is unregistered', () => {
      const source = createMockSource('test-source');
      registry.register(source);
      registry.unregister('test-source');
      
      expect(registry.has('test-source')).toBe(false);
    });
  });

  describe('getByCapability()', () => {
    it('should filter sources by boolean capability', () => {
      const source1 = createMockSource('source-1', { supportsTrending: true });
      const source2 = createMockSource('source-2', { supportsTrending: false });
      const source3 = createMockSource('source-3', { supportsTrending: true });
      
      registry.register(source1);
      registry.register(source2);
      registry.register(source3);
      
      const trendingSources = registry.getByCapability('supportsTrending');
      
      expect(trendingSources).toHaveLength(2);
      expect(trendingSources).toContain(source1);
      expect(trendingSources).toContain(source3);
    });

    it('should filter sources by method capability', () => {
      const source1 = createMockSource('source-1', {
        supportsLatest: true,
        getLatest: async () => []
      });
      const source2 = createMockSource('source-2', { supportsLatest: false });
      
      registry.register(source1);
      registry.register(source2);
      
      const latestSources = registry.getByCapability('getLatest');
      
      expect(latestSources).toHaveLength(1);
      expect(latestSources[0]).toBe(source1);
    });

    it('should return empty array when no sources have capability', () => {
      const source1 = createMockSource('source-1', { supportsPopular: false });
      const source2 = createMockSource('source-2', { supportsPopular: false });
      
      registry.register(source1);
      registry.register(source2);
      
      const popularSources = registry.getByCapability('supportsPopular');
      
      expect(popularSources).toHaveLength(0);
    });

    it('should handle all sources having capability', () => {
      const source1 = createMockSource('source-1', { supportsSearch: true });
      const source2 = createMockSource('source-2', { supportsSearch: true });
      
      registry.register(source1);
      registry.register(source2);
      
      const searchSources = registry.getByCapability('supportsSearch');
      
      expect(searchSources).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid register/unregister cycles', () => {
      const source = createMockSource('test-source');
      
      for (let i = 0; i < 100; i++) {
        registry.register(source);
        expect(registry.has('test-source')).toBe(true);
        registry.unregister('test-source');
        expect(registry.has('test-source')).toBe(false);
      }
    });

    it('should handle sources with special characters in ID', () => {
      const source = createMockSource('source-with-dashes-123');
      registry.register(source);
      
      expect(registry.get('source-with-dashes-123')).toBe(source);
    });

    it('should maintain state across multiple operations', () => {
      const sources = Array.from({ length: 10 }, (_, i) => 
        createMockSource(`source-${i}`)
      );
      
      // Register all
      sources.forEach(s => registry.register(s));
      expect(registry.list()).toHaveLength(10);
      
      // Remove even-numbered sources
      sources.filter((_, i) => i % 2 === 0).forEach(s => registry.unregister(s.id));
      expect(registry.list()).toHaveLength(5);
      
      // Verify odd-numbered sources remain
      sources.filter((_, i) => i % 2 !== 0).forEach(s => {
        expect(registry.has(s.id)).toBe(true);
      });
    });
  });
});
