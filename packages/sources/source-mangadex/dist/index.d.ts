import { BaseSource } from '@joyboy-parser/core';
import { Manga, SearchOptions, Chapter, Page, PaginationBase, Genre } from '@joyboy-parser/types';

/**
 * @joyboy-parser/source-mangadex
 * MangaDex parser implementation
 * Compatible with Node.js, Browser, and React Native
 */

/**
 * MangaDex source parser
 */
declare class MangaDexSource extends BaseSource {
    getbyPage(searchLabel: string, pageNumber: number): Promise<Manga[]>;
    id: string;
    name: string;
    version: string;
    baseUrl: string;
    icon: string;
    description: string;
    languages: string[];
    supportsSearch: boolean;
    supportsTrending: boolean;
    supportsLatest: boolean;
    supportsFilters: boolean;
    supportsPopular: boolean;
    /**
     * Search for manga on MangaDex
     */
    search(query: string, options?: SearchOptions): Promise<Manga[]>;
    /**
     * Get detailed manga information
     */
    getMangaDetails(id: string): Promise<Manga>;
    /**
     * Get chapters for a manga
     */
    getChapters(mangaId: string, offset?: number, limit?: number): Promise<Chapter[]>;
    /**
     * Get pages for a chapter
     */
    getChapterPages(chapterId: string): Promise<Page[]>;
    sitema(): Promise<void>;
    /**
     * Get latest manga updates
     */
    getLatest(options?: SearchOptions): Promise<Manga[]>;
    /**
     * Get popular manga
     */
    getPopular(options?: SearchOptions): Promise<Manga[]>;
    /**
     * Parse MangaDex manga data into standard format
     */
    private parseManga;
    /**
     * Get manga by page number for a search term
     */
    getByPage(searchLabel: string, pageNumber: number): Promise<Manga[]>;
    /**
     * List all manga with optional filters
     */
    listAll(options?: SearchOptions): Promise<Manga[]>;
    /**
     * Extract pagination information from API response
     */
    extractPaginationInfo(url: string): Promise<PaginationBase>;
    listGenres(): Promise<Genre[]>;
    /**
     * Parse MangaDex chapter data
     */
    private parseChapter;
    /**
     * Parse status string to standard format
     */
    private parseStatus;
    /**
     * Parse content rating
     */
    private parseRating;
}

export { MangaDexSource as default };
