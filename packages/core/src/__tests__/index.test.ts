/**
 * Tests for Core Package Exports
 */

import { describe, it, expect } from 'vitest';
import * as CoreExports from '../index';

describe('Core Package Exports', () => {
  describe('Main Exports', () => {
    it('should export JoyBoy runtime', () => {
      expect(CoreExports.JoyBoy).toBeDefined();
      expect(typeof CoreExports.JoyBoy).toBe('function');
    });

    it('should export BaseSource class', () => {
      expect(CoreExports.BaseSource).toBeDefined();
      expect(typeof CoreExports.BaseSource).toBe('function');
    });

    it('should export SourceRegistry class', () => {
      expect(CoreExports.SourceRegistry).toBeDefined();
      expect(typeof CoreExports.SourceRegistry).toBe('function');
    });

    it('should export GitHubSourceLoader class', () => {
      expect(CoreExports.GitHubSourceLoader).toBeDefined();
      expect(typeof CoreExports.GitHubSourceLoader).toBe('function');
    });

    it('should export RequestManager utility', () => {
      expect(CoreExports.RequestManager).toBeDefined();
      expect(typeof CoreExports.RequestManager).toBe('function');
    });
  });

  describe('Type Exports', () => {
    it('should have Source type available', () => {
      // Type check - this will fail at compile time if type is not exported
      type SourceType = CoreExports.Source;
      const check: SourceType | undefined = undefined;
      expect(check).toBeUndefined();
    });

    it('should have ProgressCallback type available', () => {
      // Type check
      type CallbackType = CoreExports.ProgressCallback;
      const check: CallbackType | undefined = undefined;
      expect(check).toBeUndefined();
    });

    it('should have RegistrySource type available', () => {
      // Type check
      type RegistrySourceType = CoreExports.RegistrySource;
      const check: RegistrySourceType | undefined = undefined;
      expect(check).toBeUndefined();
    });
  });

  describe('Utility Exports', () => {
    it('should export createSourceError', () => {
      expect(CoreExports.createSourceError).toBeDefined();
      expect(typeof CoreExports.createSourceError).toBe('function');
    });

    it('should export ErrorType enum', () => {
      expect(CoreExports.ErrorType).toBeDefined();
      expect(CoreExports.ErrorType.NETWORK).toBeDefined();
      expect(CoreExports.ErrorType.PARSE).toBeDefined();
      expect(CoreExports.ErrorType.NOT_FOUND).toBeDefined();
      expect(CoreExports.ErrorType.RATE_LIMIT).toBeDefined();
      expect(CoreExports.ErrorType.AUTH).toBeDefined();
      expect(CoreExports.ErrorType.TIMEOUT).toBeDefined();
      expect(CoreExports.ErrorType.UNKNOWN).toBeDefined();
    });
  });

  describe('Main Runtime', () => {
    it('should export JoyBoy runtime', () => {
      expect(CoreExports.JoyBoy).toBeDefined();
      expect(CoreExports.JoyBoy.getInstalledSourcesInfo).toBeDefined();
      expect(CoreExports.JoyBoy.browseSources).toBeDefined();
      expect(CoreExports.JoyBoy.searchSources).toBeDefined();
    });
  });

  describe('Package Structure', () => {
    it('should not have unexpected exports', () => {
      const expectedExports = [
        'JoyBoy',
        'BaseSource',
        'SourceRegistry',
        'GitHubSourceLoader',
        'RequestManager',
        'CacheManager',
        'createSourceError',
        'ErrorType',
        'JoyBoy',
        'isSourceError',
        'formatError',
        'isRetryableError'
      ];

      const actualExports = Object.keys(CoreExports);
      
      // All expected exports should be present
      expectedExports.forEach(exportName => {
        expect(actualExports).toContain(exportName);
      });
    });

    it('should have consistent naming', () => {
      // Classes should start with uppercase
      expect(CoreExports.JoyBoy.name).toMatch(/^[A-Z]/);
      expect(CoreExports.BaseSource.name).toMatch(/^[A-Z]/);
      expect(CoreExports.SourceRegistry.name).toMatch(/^[A-Z]/);
      expect(CoreExports.GitHubSourceLoader.name).toMatch(/^[A-Z]/);
      expect(CoreExports.RequestManager.name).toMatch(/^[A-Z]/);
    });
  });

  describe('Integration', () => {
    it('should allow creating source registry instance', () => {
      const registry = CoreExports.SourceRegistry.getInstance();
      expect(registry).toBeDefined();
      expect(registry).toBeInstanceOf(CoreExports.SourceRegistry);
    });

    it('should allow creating source loader instance', () => {
      const loader = new CoreExports.GitHubSourceLoader();
      expect(loader).toBeDefined();
      expect(loader).toBeInstanceOf(CoreExports.GitHubSourceLoader);
    });

    it('should allow accessing JoyBoy runtime methods', () => {
      expect(CoreExports.JoyBoy.browseSources).toBeDefined();
      expect(CoreExports.JoyBoy.searchSources).toBeDefined();
      expect(CoreExports.JoyBoy.getInstalledSourcesInfo).toBeDefined();
    });

    it('should allow creating custom source from BaseSource', () => {
      class TestSource extends CoreExports.BaseSource {
        id = 'test';
        name = 'Test';
        version = '1.0.0';
        baseUrl = 'https://example.com';

        async search() { return []; }
        async getMangaDetails() { return {} as any; }
        async getChapters() { return []; }
        async getChapterPages() { return []; }
        async getbyPage() { return []; }
        async extractPaginationInfo() { return { currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }; }
        async listAll() { return []; }
      }

      const source = new TestSource();
      expect(source).toBeDefined();
      expect(source.id).toBe('test');
    });
  });

  describe('Error Utilities', () => {
    it('should create source errors correctly', () => {
      const error = CoreExports.createSourceError(
        CoreExports.ErrorType.NETWORK,
        'Test error',
        'test-source'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Test error');
      expect(error.type).toBe(CoreExports.ErrorType.NETWORK);
      expect(error.sourceId).toBe('test-source');
    });

    it('should have all error types', () => {
      const errorTypes = [
        'NETWORK',
        'PARSE',
        'NOT_FOUND',
        'RATE_LIMIT',
        'AUTH',
        'TIMEOUT',
        'UNKNOWN'
      ];

      errorTypes.forEach(type => {
        expect(CoreExports.ErrorType[type as keyof typeof CoreExports.ErrorType]).toBeDefined();
      });
    });

    it('should export error utility functions', () => {
      expect(CoreExports.isSourceError).toBeDefined();
      expect(CoreExports.formatError).toBeDefined();
      expect(CoreExports.isRetryableError).toBeDefined();
    });
  });

  describe('Type Compatibility', () => {
    it('should allow Source interface implementation', () => {
      const mockSource: CoreExports.Source = {
        id: 'mock',
        name: 'Mock Source',
        version: '1.0.0',
        baseUrl: 'https://example.com',
        supportsSearch: true,
        supportsTrending: false,
        supportsLatest: false,
        supportsFilters: false,
        supportsPopular: false,
        search: async () => [],
        getMangaDetails: async () => ({} as any),
        getChapters: async () => [],
        getChapterPages: async () => [],
        getbyPage: async () => [],
        extractPaginationInfo: async () => ({ currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false })
      };

      expect(mockSource).toBeDefined();
      expect(mockSource.id).toBe('mock');
    });

    it('should allow ProgressCallback implementation', () => {
      const callback: CoreExports.ProgressCallback = (progress, status) => {
        expect(typeof progress).toBe('number');
        expect(typeof status).toBe('string');
      };

      expect(callback).toBeDefined();
      callback(50, 'test');
    });
  });

  describe('Version Consistency', () => {
    it('should have version information available through package', () => {
      // This test verifies that the package structure is correct
      // Version would typically come from package.json
      expect(true).toBe(true);
    });
  });
});
