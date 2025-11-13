/**
 * Source parser type definitions
 */

import type { Manga, Chapter, Page } from './entities';

/**
 * Metadata about a source parser
 */
export interface SourceInfo {
	/** Unique source identifier */
	id: string;
  
	/** Display name */
	name: string;
  
	/** Parser version (semver) */
	version: string;
  
	/** Base URL of the source */
	baseUrl: string;
  
	/** Supported languages */
	languages?: string[];
  
	/** Whether the source is NSFW */
	isNsfw?: boolean;
  
	/** Icon URL */
	icon?: string;
  
	/** Source description */
	description?: string;
}

/**
 * Capabilities that a source may support
 */
export interface SourceCapabilities {
	/** Can search for manga */
	supportsSearch?: boolean;
  
	/** Can get trending manga */
	supportsTrending?: boolean;
  
	/** Can get latest updates */
	supportsLatest?: boolean;
  
	/** Can filter by genre/tags */
	supportsFilters?: boolean;
  
	/** Can get popular manga */
	supportsPopular?: boolean;
}

/**
 * Search and filter options
 */
export interface SearchOptions {
	/** Search query */
	query?: string;

	offset?:number;
  
	/** Page number (1-based) */
	page?: number;
  
	/** Items per page */
	limit?: number;
  
	/** Genres to include */
	includedGenres?: string[];
  
	/** Genres to exclude */
	excludedGenres?: string[];
  
	/** Status filter */
	status?: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  
	/** Sort order */
	sort?: 'relevance' | 'latest' | 'popular' | 'rating' | 'alphabetical';
  
	/** Additional filters */
	filters?: Record<string, any>;
}

/**
 * HTTP request configuration
 */
export interface RequestOptions {
	/** Request headers */
	headers?: Record<string, string>;
  
	/** Request timeout (ms) */
	timeout?: number;
  
	/** Retry attempts */
	retries?: number;
  
	/** Cache duration (ms) */
	cacheDuration?: number;
  
	/** Query parameters */
	params?: Record<string, any>;
  
	/** Request method */
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  
	/** Request body */
	body?: any;
}

