import type { Hooks, HookCallback } from './types';

/**
 * Hook manager for lifecycle events
 */
export class HookManager {
	private hooks: Hooks = {
		beforeRequest: [],
		afterRequest: [],
		beforeParse: [],
		afterParse: [],
		onError: []
	};

	/**
	 * Register a hook callback
	 */
	register<T = any>(event: keyof Hooks, callback: HookCallback<T>): void {
		if (!this.hooks[event]) {
			throw new Error(`Unknown hook event: ${event}`);
		}
		this.hooks[event].push(callback as any);
	}

	/**
	 * Unregister a hook callback
	 */
	unregister<T = any>(event: keyof Hooks, callback: HookCallback<T>): void {
		if (!this.hooks[event]) {
			return;
		}
		const index = this.hooks[event].indexOf(callback as any);
		if (index > -1) {
			this.hooks[event].splice(index, 1);
		}
	}

	/**
	 * Execute all callbacks for a hook event
	 */
	async execute<T = any>(event: keyof Hooks, data: T): Promise<T> {
		const callbacks = this.hooks[event];
		if (!callbacks || callbacks.length === 0) {
			return data;
		}

		let result = data;
		for (const callback of callbacks) {
			result = await callback(result);
		}
		return result;
	}

	/**
	 * Get all callbacks for a hook event
	 */
	get(event: keyof Hooks): HookCallback[] {
		return this.hooks[event] || [];
	}

	/**
	 * Clear all callbacks for a hook event
	 */
	clear(event?: keyof Hooks): void {
		if (event) {
			this.hooks[event] = [];
		} else {
			// Clear all hooks
			this.hooks = {
				beforeRequest: [],
				afterRequest: [],
				beforeParse: [],
				afterParse: [],
				onError: []
			};
		}
	}

	/**
	 * Get all registered hooks
	 */
	getAll(): Hooks {
		return { ...this.hooks };
	}
}

/**
 * Create a new hook manager instance
 */
export function createHookManager(): HookManager {
	return new HookManager();
}
