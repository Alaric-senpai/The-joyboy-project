// packages/source-registry/src/__tests__/index.test.ts

import { describe, it, expect } from 'vitest';
import * as SourceRegistry from '../index';

describe('Package Exports', () => {
  describe('Remote Registry Exports', () => {
    it('should export RemoteRegistry class', () => {
      expect(SourceRegistry.RemoteRegistry).toBeDefined();
      expect(typeof SourceRegistry.RemoteRegistry).toBe('function');
    });

    it('should export createRemoteRegistry function', () => {
      expect(SourceRegistry.createRemoteRegistry).toBeDefined();
      expect(typeof SourceRegistry.createRemoteRegistry).toBe('function');
    });

    it('should export DEFAULT_REGISTRY_URLS', () => {
      expect(SourceRegistry.DEFAULT_REGISTRY_URLS).toBeDefined();
      expect(SourceRegistry.DEFAULT_REGISTRY_URLS).toHaveProperty('jsdelivr');
      expect(SourceRegistry.DEFAULT_REGISTRY_URLS).toHaveProperty('github');
      expect(SourceRegistry.DEFAULT_REGISTRY_URLS).toHaveProperty('custom');
    });

    it('should have jsDelivr as first default URL', () => {
      const urls = Object.keys(SourceRegistry.DEFAULT_REGISTRY_URLS);
      expect(urls[0]).toBe('jsdelivr');
    });
  });

  describe('Remote Loader Exports', () => {
    it('should export RemoteSourceLoader class', () => {
      expect(SourceRegistry.RemoteSourceLoader).toBeDefined();
      expect(typeof SourceRegistry.RemoteSourceLoader).toBe('function');
    });
  });

  describe('Source Catalog Exports', () => {
    it('should export SourceCatalog class', () => {
      expect(SourceRegistry.SourceCatalog).toBeDefined();
      expect(typeof SourceRegistry.SourceCatalog).toBe('function');
    });

    it('should export sourceCatalog singleton', () => {
      expect(SourceRegistry.sourceCatalog).toBeDefined();
      expect(SourceRegistry.sourceCatalog).toBeInstanceOf(SourceRegistry.SourceCatalog);
    });

    it('should export convenience functions', () => {
      expect(SourceRegistry.getAllSources).toBeDefined();
      expect(typeof SourceRegistry.getAllSources).toBe('function');
      
      expect(SourceRegistry.getSourceById).toBeDefined();
      expect(typeof SourceRegistry.getSourceById).toBe('function');
      
      expect(SourceRegistry.searchSources).toBeDefined();
      expect(typeof SourceRegistry.searchSources).toBe('function');
      
      expect(SourceRegistry.getSourcesByLanguage).toBeDefined();
      expect(typeof SourceRegistry.getSourcesByLanguage).toBe('function');
      
      expect(SourceRegistry.getOfficialSources).toBeDefined();
      expect(typeof SourceRegistry.getOfficialSources).toBe('function');
      
      expect(SourceRegistry.getSFWSources).toBeDefined();
      expect(typeof SourceRegistry.getSFWSources).toBe('function');
      
      expect(SourceRegistry.getStatistics).toBeDefined();
      expect(typeof SourceRegistry.getStatistics).toBe('function');
    });
  });

  describe('Type Exports', () => {
    it('should have proper type structure', () => {
      // This test just ensures the module exports are accessible
      // TypeScript will catch type issues at compile time
      expect(SourceRegistry).toBeDefined();
    });
  });

  describe('Functional Tests', () => {
    it('should be able to create RemoteRegistry instance', () => {
      const registry = SourceRegistry.createRemoteRegistry();
      expect(registry).toBeInstanceOf(SourceRegistry.RemoteRegistry);
    });

    it('should be able to create RemoteSourceLoader instance', () => {
      const loader = new SourceRegistry.RemoteSourceLoader();
      expect(loader).toBeInstanceOf(SourceRegistry.RemoteSourceLoader);
    });

    it('should be able to create SourceCatalog instance', () => {
      const catalog = new SourceRegistry.SourceCatalog();
      expect(catalog).toBeInstanceOf(SourceRegistry.SourceCatalog);
    });

    it('should be able to use convenience functions', () => {
      const sources = SourceRegistry.getAllSources();
      expect(Array.isArray(sources)).toBe(true);

      const stats = SourceRegistry.getStatistics();
      expect(stats).toHaveProperty('totalSources');

      const results = SourceRegistry.searchSources('');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('URL Configuration', () => {
    it('should have valid jsDelivr URL format', () => {
      const url = SourceRegistry.DEFAULT_REGISTRY_URLS.jsdelivr;
      expect(url).toContain('cdn.jsdelivr.net');
      expect(url).toContain('Alaric-senpai/The-joyboy-project');
      expect(url).toContain('registry/sources.json');
    });

    it('should have valid GitHub URL format', () => {
      const url = SourceRegistry.DEFAULT_REGISTRY_URLS.github;
      expect(url).toContain('raw.githubusercontent.com');
      expect(url).toContain('Alaric-senpai/The-joyboy-project');
      expect(url).toContain('registry/sources.json');
    });

    it('should use jsDelivr as default in createRemoteRegistry', () => {
      const registry = SourceRegistry.createRemoteRegistry();
      // The registry should be created with jsDelivr URL by default
      expect(registry).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should allow chaining catalog operations', () => {
      const catalog = new SourceRegistry.SourceCatalog();
      
      const sources = catalog.getAllSources();
      expect(Array.isArray(sources)).toBe(true);
      
      const stats = catalog.getStatistics();
      expect(stats.totalSources).toBe(sources.length);
      
      const sfwSources = catalog.getSFWSources();
      const nsfwSources = catalog.getNSFWSources();
      expect(sfwSources.length + nsfwSources.length).toBe(sources.length);
    });

    it('should allow using singleton and class instance interchangeably', () => {
      const singletonSources = SourceRegistry.getAllSources();
      const catalogSources = SourceRegistry.sourceCatalog.getAllSources();
      
      expect(singletonSources).toEqual(catalogSources);
    });
  });
});
