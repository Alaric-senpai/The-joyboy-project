/**
 * Entity type definitions
 */

/**
 * Status of a manga series
 */
export type MangaStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | 'unknown';

/**
 * Content rating categories
 */
export type ContentRating = 'safe' | 'suggestive' | 'erotica' | 'pornographic';

/**
 * Represents a manga/manhwa/manhua title
 */
export interface Manga {
	/** Unique identifier within the source */
	id: string;
  
	/** Primary title */
	title: string;
  
	/** Alternative titles */
	altTitles?: string[];
  
	/** Cover image URL */
	coverUrl?: string;
  
	/** Author name(s) */
	author?: string;
  
	/** Artist name(s) */
	artist?: string;
  
	/** Genre tags */
	genres?: string[];
  
	/** Synopsis/description */
	description?: string;
  
	/** Publication status */
	status?: MangaStatus;
  
	/** Source parser ID that provided this */
	sourceId: string;
  
	/** Direct URL to the manga page */
	url?: string;
  
	/** Content rating */
	rating?: ContentRating;
  
	/** Year of publication */
	year?: number;
  
	/** Additional metadata */
	metadata?: Record<string, any>;
}

/**
 * Represents a chapter within a manga
 */
export interface Chapter {
	/** Unique chapter identifier */
	id: string;
  
	/** Chapter title */
	title: string;
  
	/** Chapter number */
	number?: number;
  
	/** Volume number */
	volume?: number;
  
	/** Publication date (ISO string) */
	date?: string;
  
	/** Direct URL to chapter */
	url?: string;
  
	/** Number of pages */
	pages?: number;
  
	/** Scanlation group */
	scanlator?: string;
  
	/** Language code (e.g., 'en', 'ja') */
	language?: string;
}

/**
 * Represents a single page in a chapter
 */
export interface Page {
	/** Page index (0-based) */
	index: number;
  
	/** Image URL */
	imageUrl: string;
  
	/** Custom HTTP headers for the image request */
	headers?: Record<string, string>;
  
	/** Image width (if known) */
	width?: number;
  
	/** Image height (if known) */
	height?: number;
}

