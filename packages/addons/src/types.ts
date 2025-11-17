import type { Manga, Chapter, Page } from '@joyboy-parser/types';
import type { Source } from '@joyboy-parser/core';

/**
 * Lifecycle hook types
 */
export type HookCallback<T = any> = (data: T) => T | Promise<T>;

export interface Hooks {
	beforeRequest: HookCallback<RequestContext>[];
	afterRequest: HookCallback<ResponseContext>[];
	beforeParse: HookCallback<ParseContext>[];
	afterParse: HookCallback<any>[];
	onError: HookCallback<ErrorContext>[];
}

/**
 * Middleware types
 */
export interface RequestContext {
	url: string;
	method?: string;
	headers?: Record<string, string>;
	data?: any;
	source?: Source;
}

export interface ResponseContext {
	data: any;
	status: number;
	headers?: Record<string, string>;
	source?: Source;
}

export interface ParseContext {
	html: string;
	url: string;
	source?: Source;
}

export interface ErrorContext {
	error: Error;
	context: 'request' | 'parse' | 'general';
	source?: Source;
	retry?: () => Promise<any>;
}

export type MiddlewareFunction = (
	context: RequestContext | ResponseContext,
	next: () => Promise<any>
) => Promise<any>;

/**
 * Plugin types
 */
export interface Plugin {
	name: string;
	version: string;
	description?: string;
	
	install(manager: PluginManager): void | Promise<void>;
	uninstall?(): void | Promise<void>;
}

export interface PluginManager {
	use(plugin: Plugin): void;
	remove(pluginName: string): void;
	has(pluginName: string): boolean;
	get(pluginName: string): Plugin | undefined;
	getAll(): Plugin[];
	
	// Hook registration
	registerHook<T = any>(event: keyof Hooks, callback: HookCallback<T>): void;
	
	// Middleware registration
	registerMiddleware(middleware: MiddlewareFunction): void;
}

/**
 * Addon configuration
 */
export interface AddonConfig {
	plugins?: Plugin[];
	hooks?: Partial<Hooks>;
	middleware?: MiddlewareFunction[];
	options?: Record<string, any>;
}

/**
 * Extension point for sources
 */
export interface ExtendableSource extends Source {
	plugins?: PluginManager;
	hooks?: Hooks;
	middleware?: MiddlewareFunction[];
}
