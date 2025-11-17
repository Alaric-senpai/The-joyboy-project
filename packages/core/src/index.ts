/**
 * @joyboy/core
 * Core SDK and runtime for the JoyBoy parser ecosystem
 * Integrated with GitHub-based source registry
 */

// Export main runtime

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

export { GitHubSourceLoader } from './github-loader';
export type { ProgressCallback } from './github-loader';

export {JoyBoy} from './runtime'
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
  RegistryStats
} from '@joyboy-parser/source-registry';
