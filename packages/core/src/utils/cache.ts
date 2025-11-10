/**
 * Simple in-memory cache implementation
 * Compatible with all runtimes
 */

interface CacheEntry<T> {
	value: T;
	expiry: number;
}

/**
 * Simple cache manager for source responses
 */
export class CacheManager {
	private cache = new Map<string, CacheEntry<any>>();
	private defaultTTL = 5 * 60 * 1000; // 5 minutes
  
	/**
	 * Get cached value
	 */
	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
    
		if (!entry) {
			return null;
		}
    
		if (Date.now() > entry.expiry) {
			this.cache.delete(key);
			return null;
		}
    
		return entry.value;
	}
  
	/**
	 * Set cached value
	 */
	set<T>(key: string, value: T, ttl?: number): void {
		const expiry = Date.now() + (ttl ?? this.defaultTTL);
		this.cache.set(key, { value, expiry });
	}
  
	/**
	 * Delete cached value
	 */
	delete(key: string): boolean {
		return this.cache.delete(key);
	}
  
	/**
	 * Clear all cache
	 */
	clear(): void {
		this.cache.clear();
	}
  
	/**
	 * Get cache size
	 */
	size(): number {
		return this.cache.size;
	}
  
	/**
	 * Clean expired entries
	 */
	cleanExpired(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiry) {
				this.cache.delete(key);
			}
		}
	}
}

