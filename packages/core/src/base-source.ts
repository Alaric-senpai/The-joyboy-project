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
	SourceError
} from '@joyboy-parser/types';
import { createSourceError, ErrorType } from '@joyboy-parser/types';
import { RequestManager } from './utils/request';

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

	constructor() {
		this.requestManager = new RequestManager();
	}

	/**
	 * Make an HTTP request with built-in retry and error handling
	 */
	protected async request<T = any>(
		url: string,
		options?: RequestOptions
	): Promise<T> {
		try {
			return await this.requestManager.request<T>(url, options);
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
	 * Fetch HTML content and return as text
	 */
	protected async fetchHtml(url: string, options?: RequestOptions): Promise<string> {
		try {
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
	 * Abstract methods that must be implemented
	 */

    abstract search(query: string, options?: SearchOptions): Promise<Manga[]>;

	abstract getMangaDetails(id: string): Promise<Manga>;
	abstract getChapters(mangaId: string): Promise<Chapter[]>;
	abstract getChapterPages(chapterId: string): Promise<Page[]>;
}

