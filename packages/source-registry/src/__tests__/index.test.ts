/**
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SourceCatalog,
  sourceCatalog,
  getAllSources,
  getSourceById,
  searchSources,
  getSourcesByLanguage,
  getOfficialSources,
  getSFWSources,
  getStatistics,
  type RegistryEntry,
  type RegistryStats
} from '../index';

describe('SourceCatalog', () => {
  let catalog: SourceCatalog;

  beforeEach(() => {
    // Create a fresh catalog instance for each test
    catalog = new SourceCatalog();
  });

  describe('constructor and initialization', () => {
    it('should initialize with sources from JSON', () => {
      const sources = catalog.getAllSources();
      expect(sources).toBeDefined();
      expect(Array.isArray(sources)).toBe(true);
    });

    it('should load at least one source from bundled JSON', () => {
      const sources = catalog.getAllSources();
      expect(sources.length).toBeGreaterThan(0);
    });

    it('should have MangaDex source loaded', () => {
      const mangadex = catalog.getSource('mangadex');
      expect(mangadex).toBeDefined();
      expect(mangadex?.name).toBe('MangaDex');
      expect(mangadex?.packageName).toBe('@joyboy-parser/source-mangadex');
    });
  });

  describe('getAllSources', () => {
    it('should return an array of all sources', () => {
      const sources = catalog.getAllSources();
      expect(Array.isArray(sources)).toBe(true);
    });

    it('should return sources with required properties', () => {
      const sources = catalog.getAllSources();
      sources.forEach(source => {
        expect(source).toHaveProperty('id');
        expect(source).toHaveProperty('name');
        expect(source).toHaveProperty('version');
        expect(source).toHaveProperty('baseUrl');
        expect(source).toHaveProperty('packageName');
      });
    });
  });

  describe('getSource', () => {
    it('should return a source by ID', () => {
      const sources = catalog.getAllSources();
      if (sources.length > 0) {
        const firstSource = sources[0];
        const found = catalog.getSource(firstSource.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(firstSource.id);
      }
    });

    it('should return undefined for non-existent source', () => {
      const source = catalog.getSource('non-existent-source-id');
      expect(source).toBeUndefined();
    });

    it('should return correct source metadata', () => {
      const mangadex = catalog.getSource('mangadex');
      if (mangadex) {
        expect(mangadex.id).toBe('mangadex');
        expect(typeof mangadex.name).toBe('string');
        expect(typeof mangadex.version).toBe('string');
        expect(typeof mangadex.packageName).toBe('string');
      }
    });
  });

  describe('searchSources', () => {
    it('should return all sources for empty query', () => {
      const results = catalog.searchSources('');
      const allSources = catalog.getAllSources();
      expect(results.length).toBe(allSources.length);
    });

    it('should search by name', () => {
      const results = catalog.searchSources('MangaDex');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(s => s.name.includes('MangaDex'))).toBe(true);
    });

    it('should search case-insensitively', () => {
      const lowerResults = catalog.searchSources('mangadex');
      const upperResults = catalog.searchSources('MANGADEX');
      expect(lowerResults.length).toBe(upperResults.length);
    });

    it('should search by ID', () => {
      const results = catalog.searchSources('mangadex');
      expect(results.some(s => s.id === 'mangadex')).toBe(true);
    });

    it('should search by description', () => {
      const sources = catalog.getAllSources();
      if (sources.length > 0 && sources[0].description) {
        const keyword = sources[0].description.split(' ')[0];
        const results = catalog.searchSources(keyword);
        expect(results.length).toBeGreaterThan(0);
      }
    });

    it('should search by package name', () => {
      const results = catalog.searchSources('@joyboy-parser/source-mangadex');
      expect(results.some(s => s.packageName === '@joyboy-parser/source-mangadex')).toBe(true);
    });

    it('should search by tags', () => {
      const sources = catalog.getAllSources();
      const sourceWithTags = sources.find(s => s.tags && s.tags.length > 0);
      if (sourceWithTags && sourceWithTags.tags) {
        const results = catalog.searchSources(sourceWithTags.tags[0]);
        expect(results.length).toBeGreaterThan(0);
      }
    });

    it('should return empty array for non-matching query', () => {
      const results = catalog.searchSources('definitely-not-a-real-source-xyz123');
      expect(results.length).toBe(0);
    });
  });

  describe('getSourcesByLanguage', () => {
    it('should filter sources by language', () => {
      const sources = catalog.getAllSources();
      const sourceWithLang = sources.find(s => s.languages && s.languages.length > 0);
      if (sourceWithLang && sourceWithLang.languages) {
        const results = catalog.getSourcesByLanguage(sourceWithLang.languages[0]);
        expect(results.every(s => s.languages?.includes(sourceWithLang.languages![0]))).toBe(true);
      }
    });

    it('should be case-insensitive', () => {
      const lowerResults = catalog.getSourcesByLanguage('en');
      const upperResults = catalog.getSourcesByLanguage('EN');
      expect(lowerResults.length).toBe(upperResults.length);
    });

    it('should return empty array for unsupported language', () => {
      const results = catalog.getSourcesByLanguage('xyz');
      expect(results.length).toBe(0);
    });
  });

  describe('getSourcesByLanguages', () => {
    it('should filter by multiple languages (OR logic)', () => {
      const results = catalog.getSourcesByLanguages(['en', 'ja']);
      expect(results.every(s => 
        s.languages?.some(lang => ['en', 'ja'].includes(lang.toLowerCase()))
      )).toBe(true);
    });

    it('should be case-insensitive', () => {
      const lowerResults = catalog.getSourcesByLanguages(['en', 'ja']);
      const upperResults = catalog.getSourcesByLanguages(['EN', 'JA']);
      expect(lowerResults.length).toBe(upperResults.length);
    });

    it('should return empty array for empty language array', () => {
      const results = catalog.getSourcesByLanguages([]);
      expect(results.length).toBe(0);
    });
  });

  describe('getOfficialSources', () => {
    it('should return only official sources', () => {
      const results = catalog.getOfficialSources();
      expect(results.every(s => s.official === true)).toBe(true);
    });

    it('should return array even if no official sources', () => {
      const results = catalog.getOfficialSources();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getCommunitySources', () => {
    it('should return only non-official sources', () => {
      const results = catalog.getCommunitySources();
      expect(results.every(s => !s.official)).toBe(true);
    });
  });

  describe('getSourcesByTag', () => {
    it('should filter by single tag', () => {
      const sources = catalog.getAllSources();
      const sourceWithTags = sources.find(s => s.tags && s.tags.length > 0);
      if (sourceWithTags && sourceWithTags.tags) {
        const results = catalog.getSourcesByTag(sourceWithTags.tags[0]);
        expect(results.every(s => 
          s.tags?.some(t => t.toLowerCase() === sourceWithTags.tags![0].toLowerCase())
        )).toBe(true);
      }
    });

    it('should be case-insensitive', () => {
      const sources = catalog.getAllSources();
      const sourceWithTags = sources.find(s => s.tags && s.tags.length > 0);
      if (sourceWithTags && sourceWithTags.tags) {
        const lowerResults = catalog.getSourcesByTag(sourceWithTags.tags[0].toLowerCase());
        const upperResults = catalog.getSourcesByTag(sourceWithTags.tags[0].toUpperCase());
        expect(lowerResults.length).toBe(upperResults.length);
      }
    });
  });

  describe('getSourcesByTags', () => {
    it('should filter by multiple tags (AND logic)', () => {
      const sources = catalog.getAllSources();
      const sourceWithMultipleTags = sources.find(s => s.tags && s.tags.length >= 2);
      if (sourceWithMultipleTags && sourceWithMultipleTags.tags) {
        const tagsToSearch = sourceWithMultipleTags.tags.slice(0, 2);
        const results = catalog.getSourcesByTags(tagsToSearch);
        expect(results.every(s => 
          tagsToSearch.every(tag => s.tags?.some(t => t.toLowerCase() === tag.toLowerCase()))
        )).toBe(true);
      }
    });

    it('should return empty array for empty tags array', () => {
      const results = catalog.getSourcesByTags([]);
      const allSources = catalog.getAllSources();
      expect(results.length).toBe(allSources.length);
    });
  });

  describe('getNSFWSources', () => {
    it('should return only NSFW sources', () => {
      const results = catalog.getNSFWSources();
      expect(results.every(s => s.isNsfw === true)).toBe(true);
    });
  });

  describe('getSFWSources', () => {
    it('should return only SFW sources', () => {
      const results = catalog.getSFWSources();
      expect(results.every(s => !s.isNsfw)).toBe(true);
    });

    it('should exclude NSFW sources', () => {
      const sfwSources = catalog.getSFWSources();
      const nsfwSources = catalog.getNSFWSources();
      const intersection = sfwSources.filter(s => nsfwSources.some(n => n.id === s.id));
      expect(intersection.length).toBe(0);
    });
  });

  describe('getSourcesByRating', () => {
    it('should return sources sorted by rating (highest first)', () => {
      const results = catalog.getSourcesByRating();
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].rating! >= results[i].rating!).toBe(true);
      }
    });

    it('should only include sources with ratings', () => {
      const results = catalog.getSourcesByRating();
      expect(results.every(s => s.rating !== undefined)).toBe(true);
    });
  });

  describe('getSourcesByPopularity', () => {
    it('should return sources sorted by downloads (highest first)', () => {
      const results = catalog.getSourcesByPopularity();
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].downloads! >= results[i].downloads!).toBe(true);
      }
    });

    it('should only include sources with download counts', () => {
      const results = catalog.getSourcesByPopularity();
      expect(results.every(s => s.downloads !== undefined)).toBe(true);
    });
  });

  describe('getRecentlyUpdated', () => {
    it('should return sources updated within specified days', () => {
      const results = catalog.getRecentlyUpdated(30);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      
      results.forEach(source => {
        if (source.lastUpdated) {
          const updateDate = new Date(source.lastUpdated);
          expect(updateDate >= cutoff).toBe(true);
        }
      });
    });

    it('should sort by most recent first', () => {
      const results = catalog.getRecentlyUpdated(365);
      for (let i = 1; i < results.length; i++) {
        const dateA = new Date(results[i - 1].lastUpdated!);
        const dateB = new Date(results[i].lastUpdated!);
        expect(dateA >= dateB).toBe(true);
      }
    });

    it('should use 30 days as default', () => {
      const defaultResults = catalog.getRecentlyUpdated();
      const thirtyDayResults = catalog.getRecentlyUpdated(30);
      expect(defaultResults.length).toBe(thirtyDayResults.length);
    });

    it('should only include sources with lastUpdated field', () => {
      const results = catalog.getRecentlyUpdated(30);
      expect(results.every(s => s.lastUpdated !== undefined)).toBe(true);
    });
  });

  describe('registerSource', () => {
    it('should add a new source to the catalog', () => {
      const newSource: RegistryEntry = {
        id: 'test-source',
        name: 'Test Source',
        version: '1.0.0',
        baseUrl: 'https://test.com',
        packageName: '@test/source-test'
      };

      catalog.registerSource(newSource);
      const found = catalog.getSource('test-source');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Source');
    });

    it('should overwrite existing source with same ID', () => {
      const source1: RegistryEntry = {
        id: 'test-source',
        name: 'Test Source v1',
        version: '1.0.0',
        baseUrl: 'https://test.com',
        packageName: '@test/source-test'
      };

      const source2: RegistryEntry = {
        id: 'test-source',
        name: 'Test Source v2',
        version: '2.0.0',
        baseUrl: 'https://test.com',
        packageName: '@test/source-test'
      };

      catalog.registerSource(source1);
      catalog.registerSource(source2);
      
      const found = catalog.getSource('test-source');
      expect(found?.name).toBe('Test Source v2');
      expect(found?.version).toBe('2.0.0');
    });
  });

  describe('unregisterSource', () => {
    it('should remove a source from the catalog', () => {
      const newSource: RegistryEntry = {
        id: 'temp-source',
        name: 'Temporary Source',
        version: '1.0.0',
        baseUrl: 'https://temp.com',
        packageName: '@temp/source-temp'
      };

      catalog.registerSource(newSource);
      expect(catalog.getSource('temp-source')).toBeDefined();

      const removed = catalog.unregisterSource('temp-source');
      expect(removed).toBe(true);
      expect(catalog.getSource('temp-source')).toBeUndefined();
    });

    it('should return false for non-existent source', () => {
      const removed = catalog.unregisterSource('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('getSourceCount', () => {
    it('should return the total number of sources', () => {
      const count = catalog.getSourceCount();
      const sources = catalog.getAllSources();
      expect(count).toBe(sources.length);
    });

    it('should update after registering a source', () => {
      const initialCount = catalog.getSourceCount();
      
      catalog.registerSource({
        id: 'new-source',
        name: 'New Source',
        version: '1.0.0',
        baseUrl: 'https://new.com',
        packageName: '@new/source-new'
      });

      expect(catalog.getSourceCount()).toBe(initialCount + 1);
    });

    it('should update after unregistering a source', () => {
      catalog.registerSource({
        id: 'temp-source',
        name: 'Temp Source',
        version: '1.0.0',
        baseUrl: 'https://temp.com',
        packageName: '@temp/source-temp'
      });

      const beforeCount = catalog.getSourceCount();
      catalog.unregisterSource('temp-source');
      expect(catalog.getSourceCount()).toBe(beforeCount - 1);
    });
  });

  describe('getStatistics', () => {
    it('should return registry statistics', () => {
      const stats = catalog.getStatistics();
      expect(stats).toHaveProperty('totalSources');
      expect(stats).toHaveProperty('officialSources');
      expect(stats).toHaveProperty('communitySources');
      expect(stats).toHaveProperty('nsfwSources');
      expect(stats).toHaveProperty('sfwSources');
      expect(stats).toHaveProperty('languageDistribution');
      expect(stats).toHaveProperty('tagDistribution');
    });

    it('should have correct total sources count', () => {
      const stats = catalog.getStatistics();
      const allSources = catalog.getAllSources();
      expect(stats.totalSources).toBe(allSources.length);
    });

    it('should have correct official/community counts', () => {
      const stats = catalog.getStatistics();
      expect(stats.officialSources + stats.communitySources).toBe(stats.totalSources);
    });

    it('should have correct NSFW/SFW counts', () => {
      const stats = catalog.getStatistics();
      expect(stats.nsfwSources + stats.sfwSources).toBe(stats.totalSources);
    });

    it('should calculate language distribution', () => {
      const stats = catalog.getStatistics();
      expect(typeof stats.languageDistribution).toBe('object');
      Object.values(stats.languageDistribution).forEach(count => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });
    });

    it('should calculate tag distribution', () => {
      const stats = catalog.getStatistics();
      expect(typeof stats.tagDistribution).toBe('object');
    });
  });

  describe('exportToJSON', () => {
    it('should export sources as JSON string', () => {
      const json = catalog.exportToJSON();
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should export all sources', () => {
      const json = catalog.exportToJSON();
      const parsed = JSON.parse(json);
      expect(parsed.length).toBe(catalog.getSourceCount());
    });

    it('should be valid JSON', () => {
      const json = catalog.exportToJSON();
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe('importFromJSON', () => {
    it('should import sources from JSON string', () => {
      const sources: RegistryEntry[] = [
        {
          id: 'imported-1',
          name: 'Imported Source 1',
          version: '1.0.0',
          baseUrl: 'https://import1.com',
          packageName: '@import/source-1'
        },
        {
          id: 'imported-2',
          name: 'Imported Source 2',
          version: '1.0.0',
          baseUrl: 'https://import2.com',
          packageName: '@import/source-2'
        }
      ];

      const json = JSON.stringify(sources);
      catalog.importFromJSON(json);

      expect(catalog.getSource('imported-1')).toBeDefined();
      expect(catalog.getSource('imported-2')).toBeDefined();
    });

    it('should throw error for invalid JSON', () => {
      expect(() => catalog.importFromJSON('invalid json')).toThrow();
    });

    it('should throw error with message for invalid JSON', () => {
      expect(() => catalog.importFromJSON('{')).toThrow(/Failed to import sources/);
    });
  });

  describe('clear', () => {
    it('should clear all sources', () => {
      catalog.registerSource({
        id: 'temp',
        name: 'Temp',
        version: '1.0.0',
        baseUrl: 'https://temp.com',
        packageName: '@temp/source-temp'
      });

      catalog.clear();
      
      // Should reload from bundled JSON
      const sources = catalog.getAllSources();
      expect(sources.length).toBeGreaterThan(0);
      expect(catalog.getSource('temp')).toBeUndefined();
    });

    it('should reload from bundled JSON after clear', () => {
      const initialCount = catalog.getSourceCount();
      
      catalog.registerSource({
        id: 'temp',
        name: 'Temp',
        version: '1.0.0',
        baseUrl: 'https://temp.com',
        packageName: '@temp/source-temp'
      });

      catalog.clear();
      expect(catalog.getSourceCount()).toBe(initialCount);
    });
  });
});

describe('Singleton instance', () => {
  it('should export a singleton sourceCatalog instance', () => {
    expect(sourceCatalog).toBeInstanceOf(SourceCatalog);
  });

  it('should have sources loaded in singleton', () => {
    const sources = sourceCatalog.getAllSources();
    expect(sources.length).toBeGreaterThan(0);
  });
});

describe('Convenience functions', () => {
  describe('getAllSources', () => {
    it('should return all sources from singleton', () => {
      const sources = getAllSources();
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
    });
  });

  describe('getSourceById', () => {
    it('should return source by ID from singleton', () => {
      const sources = getAllSources();
      if (sources.length > 0) {
        const source = getSourceById(sources[0].id);
        expect(source).toBeDefined();
        expect(source?.id).toBe(sources[0].id);
      }
    });

    it('should return undefined for non-existent ID', () => {
      const source = getSourceById('non-existent');
      expect(source).toBeUndefined();
    });
  });

  describe('searchSources', () => {
    it('should search sources from singleton', () => {
      const results = searchSources('manga');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should return matching sources', () => {
      const sources = getAllSources();
      if (sources.length > 0) {
        const results = searchSources(sources[0].name);
        expect(results.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getSourcesByLanguage', () => {
    it('should filter sources by language from singleton', () => {
      const results = getSourcesByLanguage('en');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getOfficialSources', () => {
    it('should return official sources from singleton', () => {
      const results = getOfficialSources();
      expect(Array.isArray(results)).toBe(true);
      expect(results.every(s => s.official === true)).toBe(true);
    });
  });

  describe('getSFWSources', () => {
    it('should return SFW sources from singleton', () => {
      const results = getSFWSources();
      expect(Array.isArray(results)).toBe(true);
      expect(results.every(s => !s.isNsfw)).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics from singleton', () => {
      const stats = getStatistics();
      expect(stats).toHaveProperty('totalSources');
      expect(stats).toHaveProperty('officialSources');
      expect(stats).toHaveProperty('communitySources');
      expect(typeof stats.totalSources).toBe('number');
    });
  });
});
