import { BaseSource } from '@joyboy-parser/core';
import { SearchOptions, Manga, Chapter, Page, Genre, PaginationBase } from '@joyboy-parser/types';

/**
 * ManhuaFast.net Parser for JoyBoy
 * Scrapes manga from https://manhuafast.net
 * Site uses WordPress with Madara theme
 */

/**
 * ManhuaFast source implementation
 * WordPress/Madara-based manga site scraper
 */
declare class ManhuaFastSource extends BaseSource {
    id: string;
    name: string;
    version: string;
    baseUrl: string;
    icon: string;
    description: string;
    languages: string[];
    isNsfw: boolean;
    supportsSearch: boolean;
    supportsTrending: boolean;
    supportsLatest: boolean;
    supportsFilters: boolean;
    supportsPopular: boolean;
    /**
     * Override fetchHtml to add default browser headers
     */
    protected fetchWithHeaders(url: string, extraHeaders?: Record<string, string>): Promise<string>;
    /**
     * Search for manga by query
     */
    search(query: string, options?: SearchOptions): Promise<Manga[]>;
    /**
     * Get detailed manga information
     */
    getMangaDetails(id: string): Promise<Manga>;
    /**
     * Get all chapters for a manga
     */
    getChapters(mangaId: string): Promise<Chapter[]>;
    /**
     * Get all pages for a chapter
     */
    getChapterPages(chapterId: string): Promise<Page[]>;
    /**
     * Get manga by page number for a category/genre
     */
    getByPage(searchLabel: string, pageNumber: number): Promise<Manga[]>;
    /**
     * List all manga with pagination
     */
    listAll(options?: SearchOptions): Promise<Manga[]>;
    /**
     * List all available genres
     */
    listGenres(): Promise<Genre[]>;
    /**
     * Extract pagination info from URL
     */
    extractPaginationInfo(url: string): Promise<PaginationBase>;
    /**
     * Parse search results from listing pages
     */
    private parseSearchResults;
    /**
     * Parse a manga card element
     */
    private parseMangaCard;
    /**
     * Parse full manga details from manga page
     */
    private parseMangaDetails;
    /**
     * Parse chapters from manga page
     */
    private parseChapters;
    /**
     * Parse chapter pages (images)
     */
    private parseChapterPages;
}

export { ManhuaFastSource as default };
