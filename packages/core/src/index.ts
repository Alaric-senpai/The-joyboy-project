/**
 * @joyboy-parser/core v1.2.0
 * Core SDK and runtime for JoyBoy parser ecosystem
 * Remote-first architecture - No local caching
 */

// Export main runtime
export { JoyBoy } from './runtime';

// Export base classes
export { BaseSource } from './base-source';
export type { Source } from './base-source';

// Export registry
export { SourceRegistry } from './registry';

// Export utilities
export { RequestManager } from './utils/request';
export { CacheManager } from './utils/cache';
export { isSourceError, formatError, isRetryableError } from './utils/errors';
export { HttpError, NetworkError } from './utils/http-errors';
export { parseXml, smartParseXml, extractAllText, flattenXml } from './utils/xml';

export { GitHubSourceLoader } from './github-loader';
export type { ProgressCallback } from './github-loader';

// Re-export types from @joyboy/types
export type {
  Manga,
  Chapter,
  Page,
  SourceInfo,
  SourceCapabilities,
  SearchOptions,
  RequestOptions,
  SourceError,
  MangaStatus,
  ContentRating
} from '@joyboy-parser/types';

export { ErrorType, createSourceError } from '@joyboy-parser/types';

// Re-export registry types for convenience
export type {
  RegistrySource,
} from '@joyboy-parser/source-registry';

export { REGISTRY_URLS } from '@joyboy-parser/source-registry';
