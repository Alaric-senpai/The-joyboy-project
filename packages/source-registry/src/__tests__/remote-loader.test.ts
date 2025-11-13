// packages/source-registry/src/__tests__/remote-loader.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RemoteSourceLoader } from '../remote-loader';

describe('RemoteSourceLoader', () => {
  let loader: RemoteSourceLoader;

  beforeEach(() => {
    loader = new RemoteSourceLoader();
  });

  it('should detect runtime correctly', () => {
    const runtime = loader.getRuntime();
    expect(['web', 'node', 'react-native', 'unknown']).toContain(runtime);
  });

  it('should download and cache source code', async () => {
    const mockCode = 'export default class TestSource extends BaseSource {}';
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockCode,
    });

    const code = await loader.downloadSource('https://example.com/source.js');
    expect(code).toBe(mockCode);

    // Second call should use cache
    const code2 = await loader.downloadSource('https://example.com/source.js');
    expect(code2).toBe(mockCode);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should validate source code structure', () => {
    const validCode = 'export default class TestSource extends BaseSource {}';
    const invalidCode = 'const test = 123;';

    expect(loader.validateSource(validCode)).toBe(true);
    expect(loader.validateSource(invalidCode)).toBe(false);
  });

  it('should clear cache', async () => {
    const mockCode = 'export default class TestSource extends BaseSource {}';
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockCode,
    });

    await loader.downloadSource('https://example.com/source.js');
    loader.clearCache();
    
    await loader.downloadSource('https://example.com/source.js');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should accept custom config', () => {
    class MockBaseSource {}
    const customLoader = new RemoteSourceLoader({
      baseSourceClass: MockBaseSource,
      strictValidation: false,
      globals: { myGlobal: 'test' },
    });

    expect(customLoader).toBeDefined();
  });
});
