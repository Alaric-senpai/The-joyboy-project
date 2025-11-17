/**
 * @joyboy-parser/addons
 * Extension system and addons for the JoyBoy parser ecosystem
 */

// Export types
export type {
	HookCallback,
	Hooks,
	MiddlewareFunction,
	RequestContext,
	ResponseContext,
	ParseContext,
	ErrorContext,
	Plugin,
	PluginManager as IPluginManager,
	AddonConfig,
	ExtendableSource
} from './types';

// Export hook system
export { HookManager, createHookManager } from './hooks';

// Export middleware system
export {
	MiddlewareManager,
	createMiddlewareManager,
	retryMiddleware,
	rateLimitMiddleware,
	loggingMiddleware,
	cacheMiddleware
} from './middleware';

// Export plugin system
export {
	PluginManager,
	createPluginManager,
	createPlugin
} from './plugin-system';

// Re-export for convenience
export { type Manga, type Chapter, type Page } from '@joyboy-parser/types';
export { type Source, BaseSource } from '@joyboy-parser/core';
