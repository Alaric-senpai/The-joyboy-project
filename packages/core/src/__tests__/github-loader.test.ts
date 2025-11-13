/**
 * Tests for GitHubSourceLoader
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubSourceLoader } from '../github-loader';
import type { RegistrySource } from '@joyboy-parser/source-registry';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock source code for testing
const createValidSourceCode = (id: string) => `
export default class TestSource extends BaseSource {
  id = '${id}';
  name = 'Test Source';
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
  async listAll() { return []; }
  async extractPaginationInfo() { return { totalPages: 1 }; }
}
`;

// Helper to create mock registry entry
const createMockRegistryEntry = (overrides: Partial<RegistrySource> = {}): RegistrySource => ({
  id: 'test-source',
  name: 'Test Source',
  version: '1.0.0',
  baseUrl: 'https://example.com',
  description: 'Test source description',
  icon: 'https://cdn.example.com/icon.png',
  author: 'Test Author',
  repository: 'https://github.com/test/test-source',
  downloads: {
    stable: 'https://cdn.example.com/test-source.js',
    latest: 'https://cdn.example.com/test-source.js',
    versions: {
      'beta': 'https://cdn.example.com/test-source-beta.js',
      'dev': 'https://cdn.example.com/test-source-dev.js'
    }
  },
  integrity: {
    sha256: 'a'.repeat(64),
  },
  metadata: {
    languages: ['en', 'jp'],
    official: true,
    nsfw: false,
    tags: ['test', 'tags'],
    lastUpdated: new Date().toISOString(),
    minCoreVersion: '1.0.0',
    maxCoreVersion: '2.0.0',
    websiteUrl: 'https://example.com',
    supportUrl: 'https://support.example.com'
  },
  legal: {
    disclaimer: 'Test disclaimer',
    sourceType: 'scraper',
    requiresAuth: false
  },
  changelog: [
    {
      version: '1.0.0',
      date: new Date().toISOString(),
      changes: ['Initial release'],
      breaking: false
    }
  ],
  statistics: {
    downloads: 1000,
    stars: 100,
    rating: 4.5,
    activeUsers: 500
  },
  capabilities: {
    supportsSearch: true,
    supportsTrending: false,
    supportsLatest: false,
    supportsFilters: false,
    supportsPopular: false,
    supportsAuth: false,
    supportsDownload: false,
    supportsBookmarks: false
  },
  ...overrides
});

describe('GitHubSourceLoader', () => {
  let loader: GitHubSourceLoader;

  beforeEach(() => {
    loader = new GitHubSourceLoader();
    mockFetch.mockReset();
  });

  describe('loadFromRegistry()', () => {
    it('should download and load source successfully', async () => {
      const entry = createMockRegistryEntry();
      const sourceCode = createValidSourceCode('test-source');
      
      // Calculate actual SHA-256 hash
      const encoder = new TextEncoder();
      const data = encoder.encode(sourceCode);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Update entry with correct hash
      entry.integrity.sha256 = hashHex;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => sourceCode,
        status: 200,
        statusText: 'OK'
      });

      const progressSteps: Array<{ progress: number; status: string }> = [];
      const source = await loader.loadFromRegistry(entry, (progress, status) => {
        progressSteps.push({ progress, status });
      });

      expect(source).toBeDefined();
      expect(source.id).toBe('test-source');
      expect(progressSteps.length).toBeGreaterThan(0);
      expect(progressSteps[progressSteps.length - 1].progress).toBe(100);
    });

    it('should handle download failures', async () => {
      const entry = createMockRegistryEntry();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(loader.loadFromRegistry(entry)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const entry = createMockRegistryEntry();
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(loader.loadFromRegistry(entry)).rejects.toThrow();
    });

    it('should validate source code structure', async () => {
      const entry = createMockRegistryEntry();
      const invalidCode = 'console.log("not a valid source");';
      
      // Calculate hash for invalid code
      const encoder = new TextEncoder();
      const data = encoder.encode(invalidCode);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      entry.integrity.sha256 = hashHex;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => invalidCode,
        status: 200,
        statusText: 'OK'
      });

      await expect(loader.loadFromRegistry(entry)).rejects.toThrow('Invalid source code structure');
    });

    it('should track progress correctly', async () => {
      const entry = createMockRegistryEntry();
      const sourceCode = createValidSourceCode('test-source');
      
      // Calculate hash
      const encoder = new TextEncoder();
      const data = encoder.encode(sourceCode);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      entry.integrity.sha256 = hashHex;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => sourceCode,
        status: 200,
        statusText: 'OK'
      });

      const progressSteps: number[] = [];
      await loader.loadFromRegistry(entry, (progress) => {
        progressSteps.push(progress);
      });

      // Verify progress goes from 0 to 100
      expect(progressSteps[0]).toBe(0);
      expect(progressSteps[progressSteps.length - 1]).toBe(100);
      
      // Verify progress is monotonically increasing
      for (let i = 1; i < progressSteps.length; i++) {
        expect(progressSteps[i]).toBeGreaterThanOrEqual(progressSteps[i - 1]);
      }
    });
  });

  // Remove loadFromUrl and loadFromCode tests as these methods don't exist

  describe('Caching', () => {
    it('should cache loaded sources', async () => {
      const entry = createMockRegistryEntry();
      const sourceCode = createValidSourceCode('test-source');
      
      // Calculate hash
      const encoder = new TextEncoder();
      const data = encoder.encode(sourceCode);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      entry.integrity.sha256 = hashHex;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => sourceCode,
        status: 200,
        statusText: 'OK'
      });

      // First load
      await loader.loadFromRegistry(entry);

      // Second load should use cache (no fetch call)
      const source = await loader.loadFromRegistry(entry);

      expect(source).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should reload when version changes', async () => {
      const sourceCode = createValidSourceCode('test-source');
      
      // Calculate hash
      const encoder = new TextEncoder();
      const data = encoder.encode(sourceCode);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => sourceCode,
        status: 200,
        statusText: 'OK'
      });

      // Load version 1.0.0
      const entry1 = createMockRegistryEntry({ version: '1.0.0' });
      entry1.integrity.sha256 = hashHex;
      await loader.loadFromRegistry(entry1);

      // Load version 2.0.0 (should fetch again)
      const entry2 = createMockRegistryEntry({ version: '2.0.0' });
      entry2.integrity.sha256 = hashHex;
      await loader.loadFromRegistry(entry2);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should clear cache for specific source', async () => {
      const entry = createMockRegistryEntry();
      const sourceCode = createValidSourceCode('test-source');
      
      // Calculate hash
      const encoder = new TextEncoder();
      const data = encoder.encode(sourceCode);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      entry.integrity.sha256 = hashHex;
      
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => sourceCode,
        status: 200,
        statusText: 'OK'
      });

      // Load and cache
      await loader.loadFromRegistry(entry);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      loader.clearCache('test-source');

      // Load again (should fetch)
      await loader.loadFromRegistry(entry);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle clearing cache for non-existent source', () => {
      // Should not throw
      expect(() => loader.clearCache('nonexistent')).not.toThrow();
    });
  });

  describe('Source Validation', () => {
    it('should validate required source methods', async () => {
      const invalidSource = `
        export default class TestSource {
          id = 'test';
          name = 'Test';
          version = '1.0.0';
          baseUrl = 'https://example.com';
          // Missing required methods
        }
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => invalidSource,
        status: 200,
        statusText: 'OK'
      });

      const entry = createMockRegistryEntry();
      await expect(loader.loadFromRegistry(entry)).rejects.toThrow();
    });

    it('should validate source properties', async () => {
      const invalidSource = `
        export default class TestSource {
          // Missing required properties like id, name, version
          async search() { return []; }
          async getMangaDetails() { return {}; }
          async getChapters() { return []; }
          async getChapterPages() { return []; }
          async getbyPage() { return []; }
          async extractPaginationInfo() { return {}; }
        }
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => invalidSource,
        status: 200,
        statusText: 'OK'
      });

      const entry = createMockRegistryEntry();
      await expect(loader.loadFromRegistry(entry)).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty source code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
        status: 200,
        statusText: 'OK'
      });

      const entry = createMockRegistryEntry();
      await expect(loader.loadFromRegistry(entry)).rejects.toThrow();
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '{invalid json',
        status: 200,
        statusText: 'OK'
      });

      const entry = createMockRegistryEntry();
      await expect(loader.loadFromRegistry(entry)).rejects.toThrow();
    });

    it('should handle concurrent loads of same source', async () => {
      const entry = createMockRegistryEntry();
      const sourceCode = createValidSourceCode('test-source');
      
      // Calculate hash
      const encoder = new TextEncoder();
      const data = encoder.encode(sourceCode);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      entry.integrity.sha256 = hashHex;
      
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => sourceCode,
        status: 200,
        statusText: 'OK'
      });

      // Load same source concurrently
      const promises = Array.from({ length: 5 }, () => loader.loadFromRegistry(entry));
      const sources = await Promise.all(promises);

      // All should succeed
      sources.forEach(source => {
        expect(source).toBeDefined();
        expect(source.id).toBe('test-source');
      });
    });
  });
});
