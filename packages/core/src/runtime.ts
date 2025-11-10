/**
 * JoyBoy runtime for dynamic source loading
 */

import type { Source } from './base-source';
import { SourceRegistry } from './registry';

/**
 * Main JoyBoy runtime class
 * Handles dynamic source loading and management
 */
export class JoyBoy {
	private static registry = SourceRegistry.getInstance();
  
	/**
	 * Load a source parser dynamically
	 * Works with: static imports, dynamic imports, and ES module URLs
	 */
	static async loadSource(
		sourceOrPackage: Source | string | (() => Promise<any>)
	): Promise<Source> {
		try {
			let source: Source;
      
			if (typeof sourceOrPackage === 'string') {
				// Dynamic import from package name or URL
				const module = await import(/* @vite-ignore */ sourceOrPackage);
				const SourceClass = module.default;
        
				if (!SourceClass) {
					throw new Error(`No default export found in ${sourceOrPackage}`);
				}
        
				source = new SourceClass();
			} else if (typeof sourceOrPackage === 'function') {
				// Lazy loader function
				const module = await sourceOrPackage();
				const SourceClass = module.default;
				source = new SourceClass();
			} else {
				// Direct source instance
				source = sourceOrPackage;
			}
      
			// Validate source
			this.validateSource(source);
      
			// Register source
			this.registry.register(source);
      
			return source;
		} catch (error) {
			throw new Error(
				`Failed to load source: ${(error as Error).message}`
			);
		}
	}
  
	/**
	 * Load multiple sources at once
	 */
	static async loadSources(
		sources: Array<Source | string | (() => Promise<any>)>
	): Promise<Source[]> {
		const results = await Promise.allSettled(
			sources.map(s => this.loadSource(s))
		);
    
		const loaded: Source[] = [];
		const errors: Error[] = [];
    
		results.forEach((result, index) => {
			if (result.status === 'fulfilled') {
				loaded.push(result.value);
			} else {
				errors.push(new Error(`Source ${index}: ${result.reason.message}`));
			}
		});
    
		if (errors.length > 0 && loaded.length === 0) {
			throw new Error(
				`Failed to load all sources:\n${errors.map(e => e.message).join('\n')}`
			);
		}
    
		return loaded;
	}
  
	/**
	 * Get a loaded source by ID
	 */
	static getSource(id: string): Source {
		const source = this.registry.get(id);
    
		if (!source) {
			throw new Error(
				`Source '${id}' is not loaded. Available sources: ${
					this.listSources().map(s => s.id).join(', ') || 'none'
				}`
			);
		}
    
		return source;
	}
  
	/**
	 * List all loaded sources
	 */
	static listSources(): Source[] {
		return this.registry.list();
	}
  
	/**
	 * Unload a source
	 */
	static unloadSource(id: string): boolean {
		return this.registry.unregister(id);
	}
  
	/**
	 * Clear all loaded sources
	 */
	static clearSources(): void {
		this.registry.clear();
	}
  
	/**
	 * Check if a source is loaded
	 */
	static hasSource(id: string): boolean {
		return this.registry.has(id);
	}
  
	/**
	 * Search across multiple sources
	 */
	static async searchAll(
		query: string,
		sourceIds?: string[]
	): Promise<Map<string, any[]>> {
		const sources = sourceIds
			? sourceIds.map(id => this.getSource(id))
			: this.registry.getByCapability('search');
    
		const results = await Promise.allSettled(
			sources.map(async source => {
				if (source.search) {
					const items = await source.search(query);
					return { sourceId: source.id, items };
				}
				return { sourceId: source.id, items: [] };
			})
		);
    
		const resultMap = new Map<string, any[]>();
    
		results.forEach(result => {
			if (result.status === 'fulfilled') {
				resultMap.set(result.value.sourceId, result.value.items);
			}
		});
    
		return resultMap;
	}
  
	/**
	 * Validate that a source implements required methods
	 */
	private static validateSource(source: any): asserts source is Source {
		const required = ['id', 'name', 'version', 'baseUrl', 'getMangaDetails', 'getChapters', 'getChapterPages'];
    
		for (const prop of required) {
			if (!(prop in source)) {
				throw new Error(`Source validation failed: missing required property '${prop}'`);
			}
		}
    
		if (typeof source.getMangaDetails !== 'function') {
			throw new Error('Source validation failed: getMangaDetails must be a function');
		}
    
		if (typeof source.getChapters !== 'function') {
			throw new Error('Source validation failed: getChapters must be a function');
		}
    
		if (typeof source.getChapterPages !== 'function') {
			throw new Error('Source validation failed: getChapterPages must be a function');
		}
	}
}

