/**
 * Base source implementation
 */

import type {
	Manga,
	Chapter,
	Page,
	SourceInfo,
	SourceCapabilities,
	SearchOptions,
	RequestOptions,
	SourceError,
	PaginationBase
} from '@joyboy-parser/types';
import { createSourceError, ErrorType } from '@joyboy-parser/types';
import { RequestManager } from './utils/request';
import { CacheManager } from './utils/cache';
import { parseHTML } from 'linkedom';

/**
 * Core interface that all source parsers must implement
 */
export interface Source extends SourceInfo, SourceCapabilities {
	/**
	 * Search for manga by query
	 */
	search(query: string, options?: SearchOptions): Promise<Manga[]>;
  
	/**
	 * Get detailed information about a specific manga
	 */
	getMangaDetails(id: string): Promise<Manga>;
  
	/**
	 * Get all chapters for a manga
	 */
	getChapters(mangaId: string): Promise<Chapter[]>;
  

	/**
	 * Get manga by page
	 */
	getByPage(searchLabel: string, pageNumber: number): Promise<Manga[]>;

	/**
	 * List all manga (optional, with pagination)
	 */
	listAll?(options?: SearchOptions): Promise<Manga[]>;

	/**
	 * Get all pages for a specific chapter
	 */
	getChapterPages(chapterId: string): Promise<Page[]>;
  
	/**
	 * Get trending manga (optional)
	 */
	getTrending?(options?: SearchOptions): Promise<Manga[]>;
  
	/**
	 * Get latest updates (optional)
	 */
	getLatest?(options?: SearchOptions): Promise<Manga[]>;
  
	/**
	 * Get popular manga (optional)
	 */
	getPopular?(options?: SearchOptions): Promise<Manga[]>;

	/**Extract pagineation data
	 * @param url the url to extract pagination
	 */
	extractPaginationInfo(url:string):Promise<PaginationBase>;

}

/**
 * Abstract base class for creating source parsers
 * Provides common utilities and structure
 */
export abstract class BaseSource implements Source {
	abstract id: string;
	abstract name: string;
	abstract version: string;
	abstract baseUrl: string;
  
	languages?: string[];
	isNsfw?: boolean;
	icon?: string;
	description?: string;
  
	supportsSearch = true;
	supportsTrending = false;
	supportsLatest = false;
	supportsFilters = false;
	supportsPopular = false;

	protected requestManager: RequestManager;
	protected cacheManager?: CacheManager;

	constructor(options?: { enableCache?: boolean; cacheTTL?: number }) {
		this.requestManager = new RequestManager();
		if (options?.enableCache) {
			this.cacheManager = new CacheManager();
		}
	}

	/**
	 * Make an HTTP request with built-in retry and error handling
	 * @param url - URL to request
	 * @param options - Request options including cache settings
	 */
	protected async request<T = any>(
		url: string,
		options?: RequestOptions & { cache?: boolean; cacheTTL?: number }
	): Promise<T> {
		// Check cache first if enabled
		if (options?.cache && this.cacheManager) {
			const cacheKey = this.getCacheKey(url, options);
			const cached = this.cacheManager.get<T>(cacheKey);
			if (cached !== null) {
				return cached;
			}
		}

		try {
			const result = await this.requestManager.request<T>(url, options);
			
			// Cache successful responses
			if (options?.cache && this.cacheManager) {
				const cacheKey = this.getCacheKey(url, options);
				this.cacheManager.set(cacheKey, result, options.cacheTTL);
			}
			
			return result;
		} catch (error) {
			const err = error as any;
			const context: Record<string, any> = {};
			
			// Extract HTTP error details
			if (err.statusCode) context.statusCode = err.statusCode;
			if (err.url) context.url = err.url;
			if (err.method) context.method = err.method;
			if (err.responseData) context.responseData = err.responseData;
			
			throw this.createError(
				'NETWORK',
				`Request failed: ${(error as Error).message}`,
				error as Error,
				context
			);
		}
	}

	/**
	 * Generate cache key for a request
	 */
	private getCacheKey(url: string, options?: RequestOptions): string {
		const method = options?.method || 'GET';
		const params = options?.params ? JSON.stringify(options.params) : '';
		return `${method}:${url}:${params}`;
	}
  
	/**
	 * Fetch HTML content and return as text
	 */
	protected async fetchHtml(url: string, options?: RequestOptions): Promise<string> {
		try {
			// Return raw HTML string. Parsing is provided by `parseHtml` helper so
			// callers can decide which runtime to use or when to parse.
			return await this.requestManager.fetchText(url, options);
		} catch (error) {
			throw this.createError(
				'NETWORK',
				`Failed to fetch HTML: ${(error as Error).message}`,
				error as Error
			);
		}
	}
  
	/**
	 * Create a standardized error
	 */
	protected createError(
		type: keyof typeof ErrorType,
		message: string,
		originalError?: Error,
		context?: Record<string, any>
	): SourceError {
		return createSourceError(
			ErrorType[type],
			message,
			this.id,
			originalError,
			context
		);
	}
  
	/**
	 * Utility: Delay execution
	 */
	protected delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
  
	/**
	 * Utility: Build URL with query parameters
	 */
	protected buildUrl(path: string, params?: Record<string, any>): string {
		const url = new URL(path, this.baseUrl);
    
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					if (Array.isArray(value)) {
						// Handle arrays (e.g., includes[]=value1&includes[]=value2)
						value.forEach(v => url.searchParams.append(`${key}[]`, String(v)));
					} else if (typeof value === 'object' && !Array.isArray(value)) {
						// Handle nested objects (e.g., order[relevance]=desc)
						Object.entries(value).forEach(([nestedKey, nestedValue]) => {
							url.searchParams.append(`${key}[${nestedKey}]`, String(nestedValue));
						});
					} else {
						url.searchParams.append(key, String(value));
					}
				}
			});
		}
    
		return url.toString();
	}


	/**
	 * Parse an HTML string into a DOM-like structure using linkedom.
	 * This is synchronous and returns the same shape as `parseHTML`.
	 *
	 * Note: callers may choose to parse themselves; `fetchHtml` returns raw HTML.
	 */
	protected transformToHtml(html: string) {
		return parseHTML(html);
	}
  
	/**
	 * Abstract methods that must be implemented
	 */

	/**
	 * Get manga by page (must be implemented by subclasses)
	 * @param searchLabel - Search category/label (e.g., "latest", "popular")
	 * @param pageNumber - Page number (1-indexed)
	 */
	abstract getByPage(searchLabel: string, pageNumber: number): Promise<Manga[]>;


	abstract listAll(options?: SearchOptions): Promise<Manga[]>;

    abstract search(query: string, options?: SearchOptions): Promise<Manga[]>;

	abstract getMangaDetails(id: string): Promise<Manga>;
	abstract getChapters(mangaId: string): Promise<Chapter[]>;
	abstract getChapterPages(chapterId: string): Promise<Page[]>;

	abstract extractPaginationInfo(url: string): Promise<PaginationBase>;
}

