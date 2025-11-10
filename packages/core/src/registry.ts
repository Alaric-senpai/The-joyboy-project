/**
 * Source registry for managing loaded parsers
 */

import type { Source } from './base-source';

/**
 * Registry for managing loaded source parsers
 * Thread-safe singleton pattern
 */
export class SourceRegistry {
	private static instance: SourceRegistry;
	private sources: Map<string, Source> = new Map();
  
	private constructor() {}
  
	static getInstance(): SourceRegistry {
		if (!SourceRegistry.instance) {
			SourceRegistry.instance = new SourceRegistry();
		}
		return SourceRegistry.instance;
	}
  
	/**
	 * Register a source parser
	 */
	register(source: Source): void {
		if (this.sources.has(source.id)) {
			console.warn(`Source ${source.id} is already registered. Overwriting.`);
		}
		this.sources.set(source.id, source);
	}
  
	/**
	 * Get a specific source by ID
	 */
	get(id: string): Source | undefined {
		return this.sources.get(id);
	}
  
	/**
	 * Get all registered sources
	 */
	list(): Source[] {
		return Array.from(this.sources.values());
	}
  
	/**
	 * Unregister a source
	 */
	unregister(id: string): boolean {
		return this.sources.delete(id);
	}
  
	/**
	 * Clear all sources
	 */
	clear(): void {
		this.sources.clear();
	}
  
	/**
	 * Check if a source is registered
	 */
	has(id: string): boolean {
		return this.sources.has(id);
	}
  
	/**
	 * Get sources by capability
	 */
	getByCapability(capability: keyof Source): Source[] {
		return this.list().filter(source => {
			const value = source[capability];
			return typeof value === 'boolean' ? value : typeof value === 'function';
		});
	}
}

