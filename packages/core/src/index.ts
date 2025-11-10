/**
 * @joyboy/core
 * Core SDK and runtime for the JoyBoy parser ecosystem
 * Compatible with Node.js, Browser, and React Native
 */

export * from './base-source';
export * from './registry';
export * from './runtime';
export * from './utils/request';
export * from './utils/cache';
export * from './utils/errors';

// Re-export types for convenience
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
} from '@joyboy/types';

export { ErrorType, createSourceError } from '@joyboy/types';

