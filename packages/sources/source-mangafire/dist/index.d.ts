import { BaseSource } from '@joyboy-parser/core';
import { SearchOptions, Manga, Chapter, Page, Genre, PaginationBase } from '@joyboy-parser/types';

/**
 * @joyboy-parser/source-mangafire
 * MangaFire.to parser implementation
 * Compatible with Node.js, Browser, and React Native
 *
 * Website: https://mangafire.to
 * Features: 52k+ manga titles, free, no ads
 */

/**
 * MangaFire source parser
 * Scrapes manga data from mangafire.to
 */
declare class MangaFireSource extends BaseSource {
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
    private defaultHeaders;
    /**
     * Override fetchHtml to include proper headers
     */
    protected fetchHtmlWithHeaders(url: string): Promise<string>;
    /**
     * Search for manga on MangaFire
     * URL pattern: /filter?keyword={query}&page={page}
     */
    search(query: string, options?: SearchOptions): Promise<Manga[]>;
    /**
     * Get detailed manga information
     * URL pattern: /manga/{slug}.{id}
     */
    getMangaDetails(id: string): Promise<Manga>;
    /**
     * Get chapters for a manga
     * Chapters are embedded in the manga page
     */
    getChapters(mangaId: string): Promise<Chapter[]>;
    /**
     * Get pages for a chapter
     * URL pattern: /read/{slug}.{id}/{lang}/chapter-{num}
     */
    getChapterPages(chapterId: string): Promise<Page[]>;
    /**
     * Get manga by page (pagination helper)
     */
    getByPage(searchLabel: string, pageNumber: number): Promise<Manga[]>;
    /**
     * List all manga with pagination
     */
    listAll(options?: SearchOptions): Promise<Manga[]>;
    /**
     * Get trending manga
     */
    getTrending(options?: SearchOptions): Promise<Manga[]>;
    /**
     * Get latest updated manga
     */
    getLatest(options?: SearchOptions): Promise<Manga[]>;
    /**
     * Get popular manga
     */
    getPopular(options?: SearchOptions): Promise<Manga[]>;
    /**
     * List available genres
     */
    listGenres(): Promise<Genre[]>;
    /**
     * Extract pagination info from a page
     */
    extractPaginationInfo(url: string): Promise<PaginationBase>;
    /**
     * Parse search/filter results page
     */
    private parseSearchResults;
    /**
     * Parse manga details page
     */
    private parseMangaDetails;
    /**
     * Parse chapters from manga page
     */
    private parseChapters;
    /**
     * Parse chapter pages
     * MangaFire loads images dynamically, we need to extract from script or data attributes
     */
    private parseChapterPages;
    /**
     * Parse HTML string to DOM document
     */
    private parseHtmlDoc;
}

export { MangaFireSource as default };
