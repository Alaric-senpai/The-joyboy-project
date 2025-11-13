// packages/source-registry/src/remote-loader.ts

/**
 * Runtime environment detection
 */
function detectRuntime(): 'web' | 'node' | 'react-native' | 'unknown' {
  // React Native / Expo detection
  if (
    typeof navigator !== 'undefined' &&
    navigator.product === 'ReactNative'
  ) {
    return 'react-native';
  }

  // Node.js detection
  if (
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  ) {
    return 'node';
  }

  // Browser detection
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'web';
  }

  return 'unknown';
}

/**
 * Configuration for RemoteSourceLoader
 */
export interface RemoteLoaderConfig {
  /** Base class to inject into loaded modules (optional but recommended) */
  baseSourceClass?: any;
  
  /** Additional globals to inject into module context */
  globals?: Record<string, any>;
  
  /** Enable strict validation (default: true) */
  strictValidation?: boolean;
}

/**
 * Remote source loader for dynamic runtime loading.
 * Compatible with Web, Node.js, and React Native/Expo.
 */
export class RemoteSourceLoader {
  private cache: Map<string, string> = new Map();
  private moduleCache: Map<string, any> = new Map();
  private config: RemoteLoaderConfig;
  private runtime: ReturnType<typeof detectRuntime>;

  constructor(config: RemoteLoaderConfig = {}) {
    this.config = {
      strictValidation: true,
      ...config,
    };
    this.runtime = detectRuntime();
  }

  /**
   * Download source code from URL
   */
  async downloadSource(url: string): Promise<string> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }

      const code = await response.text();

      // Cache the code
      this.cache.set(url, code);

      return code;
    } catch (error) {
      throw new Error(`Download failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate source code structure
   */
  validateSource(code: string): boolean {
    // Basic validation - check for required exports
    const hasDefaultExport = /export\s+default\s+class/.test(code);
    const hasBaseSource = /extends\s+BaseSource/.test(code);

    return hasDefaultExport && hasBaseSource;
  }

  /**
   * Transform ESM code to work in all runtimes
   */
  private transformCode(code: string): string {
    // Convert ESM export to module.exports pattern
    let transformed = code;

    // Handle: export default class SourceName extends BaseSource
    transformed = transformed.replace(
      /export\s+default\s+class\s+(\w+)/g,
      'class $1'
    );

    // Add module.exports at the end if not present
    if (!transformed.includes('module.exports')) {
      // Find the class name
      const classMatch = transformed.match(/class\s+(\w+)\s+extends/);
      if (classMatch) {
        const className = classMatch[1];
        transformed += `\nif (typeof module !== 'undefined') { module.exports = ${className}; }\n`;
        transformed += `if (typeof exports !== 'undefined') { exports.default = ${className}; }\n`;
      }
    }

    return transformed;
  }

  /**
   * Load source using blob URL (Web browsers)
   */
  private async loadViaBlobUrl(code: string): Promise<any> {
    const blob = new Blob([code], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    try {
      const module = await import(/* @vite-ignore */ blobUrl);
      URL.revokeObjectURL(blobUrl);
      return module;
    } catch (error) {
      URL.revokeObjectURL(blobUrl);
      throw error;
    }
  }

  /**
   * Load source using data URL (Alternative for some environments)
   */
  private async loadViaDataUrl(code: string): Promise<any> {
    const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;
    try {
      const module = await import(/* @vite-ignore */ dataUrl);
      return module;
    } catch (error) {
      throw new Error(`Data URL import failed: ${(error as Error).message}`);
    }
  }

  /**
   * Load source using Function constructor (React Native/Expo compatible)
   * SECURITY WARNING: Only use with trusted sources!
   */
  private loadViaFunction(code: string): any {
    const transformed = this.transformCode(code);

    try {
      // Create isolated context
      const moduleObj = { exports: {} };
      const exportsObj = moduleObj.exports;

      // Build context with injected dependencies
      const context = {
        module: moduleObj,
        exports: exportsObj,
        BaseSource: this.config.baseSourceClass,
        ...this.config.globals,
        console,
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        Promise,
        fetch,
        URL,
        // Provide common globals
        globalThis,
        global: globalThis,
      };

      // Create function with context
      const contextKeys = Object.keys(context);
      const contextValues = contextKeys.map((key) => context[key as keyof typeof context]);

      const wrappedCode = `
        (function(${contextKeys.join(', ')}) {
          ${transformed}
          return module.exports.default || module.exports || exports.default || exports;
        })
      `;

      const moduleFactory = new Function('return ' + wrappedCode)();
      const SourceClass = moduleFactory(...contextValues);

      return { default: SourceClass };
    } catch (error) {
      throw new Error(`Function loading failed: ${(error as Error).message}`);
    }
  }

  /**
   * Load source from remote URL with runtime detection
   */
  async loadFromUrl(url: string): Promise<any> {
    // Check module cache
    if (this.moduleCache.has(url)) {
      return this.moduleCache.get(url);
    }

    const code = await this.downloadSource(url);

    if (this.config.strictValidation && !this.validateSource(code)) {
      throw new Error('Invalid source code structure');
    }

    let module: any;

    try {
      switch (this.runtime) {
        case 'web':
          // Try blob URL first (most compatible for web)
          try {
            module = await this.loadViaBlobUrl(code);
          } catch {
            // Fallback to data URL
            try {
              module = await this.loadViaDataUrl(code);
            } catch {
              // Final fallback to Function constructor
              module = this.loadViaFunction(code);
            }
          }
          break;

        case 'node':
          // Node.js: try data URL, fallback to Function
          try {
            module = await this.loadViaDataUrl(code);
          } catch {
            module = this.loadViaFunction(code);
          }
          break;

        case 'react-native':
          // React Native/Expo: Use Function constructor (most reliable)
          module = this.loadViaFunction(code);
          break;

        default:
          // Unknown runtime: try Function constructor
          module = this.loadViaFunction(code);
          break;
      }

      // Cache the loaded module
      this.moduleCache.set(url, module);

      return module;
    } catch (error) {
      throw new Error(
        `Failed to load source from ${url}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Load source class (convenience method)
   */
  async loadSourceClass(url: string): Promise<any> {
    const module = await this.loadFromUrl(url);
    return module.default || module;
  }

  /**
   * Get current runtime
   */
  getRuntime(): string {
    return this.runtime;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<RemoteLoaderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear source code cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear module cache
   */
  clearModuleCache(): void {
    this.moduleCache.clear();
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.clearCache();
    this.clearModuleCache();
  }
}

/**
 * Global remote loader instance
 */
export const remoteLoader = new RemoteSourceLoader();