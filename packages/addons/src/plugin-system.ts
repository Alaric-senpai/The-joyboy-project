import type { Plugin, PluginManager as IPluginManager, Hooks, HookCallback, MiddlewareFunction } from './types';
import { HookManager } from './hooks';
import { MiddlewareManager } from './middleware';

/**
 * Plugin manager implementation
 */
export class PluginManager implements IPluginManager {
	private plugins: Map<string, Plugin> = new Map();
	private hookManager: HookManager;
	private middlewareManager: MiddlewareManager;

	constructor() {
		this.hookManager = new HookManager();
		this.middlewareManager = new MiddlewareManager();
	}

	/**
	 * Register a plugin
	 */
	async use(plugin: Plugin): Promise<void> {
		if (this.plugins.has(plugin.name)) {
			throw new Error(`Plugin "${plugin.name}" is already registered`);
		}

		await plugin.install(this);
		this.plugins.set(plugin.name, plugin);
	}

	/**
	 * Unregister a plugin
	 */
	async remove(pluginName: string): Promise<void> {
		const plugin = this.plugins.get(pluginName);
		if (!plugin) {
			return;
		}

		if (plugin.uninstall) {
			await plugin.uninstall();
		}

		this.plugins.delete(pluginName);
	}

	/**
	 * Check if a plugin is registered
	 */
	has(pluginName: string): boolean {
		return this.plugins.has(pluginName);
	}

	/**
	 * Get a plugin by name
	 */
	get(pluginName: string): Plugin | undefined {
		return this.plugins.get(pluginName);
	}

	/**
	 * Get all registered plugins
	 */
	getAll(): Plugin[] {
		return Array.from(this.plugins.values());
	}

	/**
	 * Register a hook callback
	 */
	registerHook<T = any>(event: keyof Hooks, callback: HookCallback<T>): void {
		this.hookManager.register(event, callback);
	}

	/**
	 * Register middleware
	 */
	registerMiddleware(middleware: MiddlewareFunction): void {
		this.middlewareManager.use(middleware);
	}

	/**
	 * Get hook manager
	 */
	getHookManager(): HookManager {
		return this.hookManager;
	}

	/**
	 * Get middleware manager
	 */
	getMiddlewareManager(): MiddlewareManager {
		return this.middlewareManager;
	}

	/**
	 * Clear all plugins
	 */
	async clear(): Promise<void> {
		for (const plugin of this.plugins.values()) {
			if (plugin.uninstall) {
				await plugin.uninstall();
			}
		}
		this.plugins.clear();
		this.hookManager.clear();
		this.middlewareManager.clear();
	}
}

/**
 * Create a new plugin manager instance
 */
export function createPluginManager(): PluginManager {
	return new PluginManager();
}

/**
 * Helper function to create a simple plugin
 */
export function createPlugin(config: {
	name: string;
	version: string;
	description?: string;
	install: (manager: IPluginManager) => void | Promise<void>;
	uninstall?: () => void | Promise<void>;
}): Plugin {
	return {
		name: config.name,
		version: config.version,
		description: config.description,
		install: config.install,
		uninstall: config.uninstall
	};
}
