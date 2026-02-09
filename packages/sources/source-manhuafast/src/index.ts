/**
 * ManhuaFast.net Parser for JoyBoy
 * Scrapes manga from https://manhuafast.net
 * Site uses WordPress with Madara theme
 */

import { BaseSource } from '@joyboy-parser/core';
import type { Manga, Chapter, Page, SearchOptions, PaginationBase, Genre, RequestOptions } from '@joyboy-parser/types';

// Default headers to mimic browser requests
const DEFAULT_HEADERS: Record<string, string> = {
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
	'Accept-Language': 'en-US,en;q=0.9',
	'Accept-Encoding': 'gzip, deflate, br',
	'Connection': 'keep-alive',
	'Upgrade-Insecure-Requests': '1',
	'Sec-Fetch-Dest': 'document',
	'Sec-Fetch-Mode': 'navigate',
	'Sec-Fetch-Site': 'none',
	'Sec-Fetch-User': '?1'
};

/**
 * ManhuaFast source implementation
 * WordPress/Madara-based manga site scraper
 */
export default class ManhuaFastSource extends BaseSource {
	id = 'manhuafast';
	name = 'ManhuaFast';
	version = '1.0.0';
	baseUrl = 'https://manhuafast.net';
	icon = 'https://manhuafast.net/wp-content/uploads/2021/09/cropped-unnamed-32x32.png';
	description = 'ManhuaFast.net - Read Manhua, Manhwa, and Manga online';
	languages = ['en'];
	isNsfw = false;

	// Capabilities
	supportsSearch = true;
	supportsTrending = true;
	supportsLatest = true;
	supportsFilters = true;
	supportsPopular = true;

	/**
	 * Override fetchHtml to add default browser headers
	 */
	protected async fetchWithHeaders(url: string, extraHeaders?: Record<string, string>): Promise<string> {
		const options: RequestOptions = {
			headers: {
				...DEFAULT_HEADERS,
				...extraHeaders
			}
		};
		return this.fetchHtml(url, options);
	}

	/**
	 * Search for manga by query
	 */
	async search(query: string, options?: SearchOptions): Promise<Manga[]> {
		try {
			const page = options?.page || 1;
			const url = `${this.baseUrl}/page/${page}/?s=${encodeURIComponent(query)}&post_type=wp-manga`;

			const html = await this.fetchWithHeaders(url);
			const document = this.transformToHtml(html).document;

			return this.parseSearchResults(document);
		} catch (error) {
			throw this.createError(
				'PARSE',
				`Failed to search for "${query}": ${(error as Error).message}`,
				error as Error,
				{ query, page: options?.page }
			);
		}
	}

	/**
	 * Get detailed manga information
	 */
	async getMangaDetails(id: string): Promise<Manga> {
		try {
			const url = `${this.baseUrl}/manga/${id}/`;

			const html = await this.fetchWithHeaders(url);
			const document = this.transformToHtml(html).document;

			return this.parseMangaDetails(document, id);
		} catch (error) {
			throw this.createError(
				'PARSE',
				`Failed to get manga details for "${id}": ${(error as Error).message}`,
				error as Error,
				{ mangaId: id }
			);
		}
	}

	/**
	 * Get all chapters for a manga
	 */
	async getChapters(mangaId: string): Promise<Chapter[]> {
		try {
			// Use the AJAX endpoint with POST to get all chapters without pagination
			const url = `${this.baseUrl}/manga/${mangaId}/ajax/chapters/`;
			const options: RequestOptions = {
				headers: {
					...DEFAULT_HEADERS,
					'X-Requested-With': 'XMLHttpRequest'
				},
				method: 'POST'
			};
			const html = await this.fetchHtml(url, options);
			const document = this.transformToHtml(html).document;

			return this.parseChapters(document, mangaId);
		} catch (error) {
			throw this.createError(
				'PARSE',
				`Failed to get chapters for "${mangaId}": ${(error as Error).message}`,
				error as Error,
				{ mangaId }
			);
		}
	}

	/**
	 * Get all pages for a chapter
	 */
	async getChapterPages(chapterId: string): Promise<Page[]> {
		try {
			// chapterId format: "manga-slug/chapter-X"
			const url = `${this.baseUrl}/manga/${chapterId}/`;

			const html = await this.fetchWithHeaders(url);
			const document = this.transformToHtml(html).document;

			return this.parseChapterPages(document);
		} catch (error) {
			throw this.createError(
				'PARSE',
				`Failed to get chapter pages for "${chapterId}": ${(error as Error).message}`,
				error as Error,
				{ chapterId }
			);
		}
	}

	/**
	 * Get manga by page number for a category/genre
	 */
	async getByPage(searchLabel: string, pageNumber: number): Promise<Manga[]> {
		try {
			const url = `${this.baseUrl}/manga-genre/${searchLabel}/page/${pageNumber}/`;

			const html = await this.fetchWithHeaders(url);
			const document = this.transformToHtml(html).document;

			return this.parseSearchResults(document);
		} catch (error) {
			throw this.createError(
				'PARSE',
				`Failed to get manga by page for "${searchLabel}": ${(error as Error).message}`,
				error as Error,
				{ searchLabel, pageNumber }
			);
		}
	}

	/**
	 * List all manga with pagination
	 */
	async listAll(options?: SearchOptions): Promise<Manga[]> {
		try {
			const page = options?.page || 1;
			const url = `${this.baseUrl}/manga/page/${page}/?m_orderby=latest`;

			const html = await this.fetchWithHeaders(url);
			const document = this.transformToHtml(html).document;

			return this.parseSearchResults(document);
		} catch (error) {
			throw this.createError(
				'PARSE',
				`Failed to list all manga: ${(error as Error).message}`,
				error as Error,
				{ page: options?.page }
			);
		}
	}

	/**
	 * List all available genres
	 */
	async listGenres(): Promise<Genre[]> {
		try {
			const url = `${this.baseUrl}/manga/`;
			const html = await this.fetchWithHeaders(url);
			const document = this.transformToHtml(html).document;

			const genres: Genre[] = [];
			const genreLinks = document.querySelectorAll('a[href*="/manga-genre/"]');
			const seenGenres = new Set<string>();

			genreLinks.forEach((link: any) => {
				const href = link.getAttribute('href') || '';
				const match = href.match(/\/manga-genre\/([^/]+)\/?$/);

				if (match && !seenGenres.has(match[1])) {
					const slug = match[1];
					seenGenres.add(slug);

					// Convert slug to proper label (e.g., "martial-arts" -> "Martial Arts")
					const label = slug
						.split('-')
						.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' ');

					genres.push({ label, id: slug });
				}
			});

			// Sort alphabetically
			return genres.sort((a, b) => a.label.localeCompare(b.label));
		} catch (error) {
			throw this.createError(
				'PARSE',
				`Failed to list genres: ${(error as Error).message}`,
				error as Error
			);
		}
	}

	/**
	 * Extract pagination info from URL
	 */
	async extractPaginationInfo(url: string): Promise<PaginationBase> {
		try {
			const html = await this.fetchWithHeaders(url);
			const document = this.transformToHtml(html).document;

			let totalPages = 1;
			const pageNumbers = document.querySelectorAll('.wp-pagenavi a, .page-numbers');
			pageNumbers.forEach((el: any) => {
				const text = el.textContent?.trim();
				if (text && !isNaN(parseInt(text))) {
					const num = parseInt(text, 10);
					if (num > totalPages) totalPages = num;
				}
			});

			return { totalPages };
		} catch (error) {
			throw this.createError(
				'PARSE',
				`Failed to extract pagination info from "${url}": ${(error as Error).message}`,
				error as Error,
				{ url }
			);
		}
	}

	// --- Private parsing methods ---

	/**
	 * Parse search results from listing pages
	 */
	private parseSearchResults(document: any): Manga[] {
		const mangas: Manga[] = [];

		// Try different selectors for manga items
		const items = document.querySelectorAll(
			'.page-item-detail, .c-tabs-item__content, .row.c-tabs-item'
		);

		items.forEach((item: any) => {
			try {
				const manga = this.parseMangaCard(item);
				if (manga) mangas.push(manga);
			} catch (e) {
				// Skip invalid items
			}
		});

		return mangas;
	}

	/**
	 * Parse a manga card element
	 */
	private parseMangaCard(item: any): Manga | null {
		const titleLink = item.querySelector('h3 a, h5 a, .post-title a, .item-title a');
		if (!titleLink) return null;

		const title = titleLink.textContent?.trim() || '';
		const href = titleLink.getAttribute('href') || '';

		const match = href.match(/\/manga\/([^/]+)\/?/);
		if (!match) return null;

		const id = match[1];
		const img = item.querySelector('img');
		const cover = img?.getAttribute('data-src') || img?.getAttribute('src') || '';

		return {
			id,
			title,
			coverUrl: cover,
			url: href,
			sourceId: this.id
		};
	}

	/**
	 * Parse full manga details from manga page
	 */
	private parseMangaDetails(document: any, id: string): Manga {
		const titleEl = document.querySelector('.post-title h1, h1');
		const title = titleEl?.textContent?.trim() || id;

		const coverEl = document.querySelector('.summary_image img, .tab-summary img');
		const coverUrl = coverEl?.getAttribute('data-src') || coverEl?.getAttribute('src') || '';

		const descEl = document.querySelector('.summary__content, .description-summary');
		let description = descEl?.textContent?.trim() || '';
		description = description.replace(/Show more/gi, '').trim();

		let status: string = 'unknown';
		const statusContainers = document.querySelectorAll('.post-content_item, .post-status');
		statusContainers.forEach((container: any) => {
			const label = container.querySelector('.summary-heading')?.textContent?.toLowerCase() || '';
			if (label.includes('status')) {
				status = container.querySelector('.summary-content')?.textContent?.trim()?.toLowerCase() || 'unknown';
			}
		});

		const genres: string[] = [];
		const genreLinks = document.querySelectorAll('.genres-content a, .mg_genres a');
		genreLinks.forEach((link: any) => {
			const genre = link.textContent?.trim();
			if (genre) genres.push(genre);
		});

		const authorEl = document.querySelector('.author-content a');
		const author = authorEl?.textContent?.trim() || '';

		return {
			id,
			title,
			coverUrl,
			description,
			status,
			genres,
			author,
			url: `${this.baseUrl}/manga/${id}/`,
			sourceId: this.id
		};
	}

	/**
	 * Parse chapters from manga page
	 */
	private parseChapters(document: any, mangaId: string): Chapter[] {
		const chapters: Chapter[] = [];

		// First, try to find the main chapter list container to avoid sidebar widgets
		const chapterContainer = document.querySelector('#manga-chapters-holder, .listing-chapters_wrap, .page-content-listing, .version-chap');
		const searchRoot = chapterContainer || document;

		const chapterItems = searchRoot.querySelectorAll('.wp-manga-chapter, li.wp-manga-chapter, .chapter-item');

		chapterItems.forEach((item: any, index: number) => {
			const link = item.querySelector('a');
			if (!link) return;

			const href = link.getAttribute('href') || '';
			const title = link.textContent?.trim() || '';

			// Filter out chapters that don't belong to this manga
			// The URL must contain /manga/ and the manga ID (handle case-insensitivity)
			const hrefLower = href.toLowerCase();
			const mangaIdLower = mangaId.toLowerCase();

			if (!hrefLower.includes('/manga/') || !hrefLower.includes(mangaIdLower)) {
				return; // Skip this chapter as it belongs to a different manga
			}

			const chapterMatch = title.match(/chapter\s*(\d+(?:\.\d+)?)/i);
			const chapterNumber = chapterMatch ? parseFloat(chapterMatch[1]) : index + 1;

			const idMatch = href.match(/\/manga\/([^/]+\/[^/]+)\/?$/);
			const chapterId = idMatch ? idMatch[1] : `${mangaId}/chapter-${chapterNumber}`;

			const dateEl = item.querySelector('.chapter-release-date, .post-on');
			const dateText = dateEl?.textContent?.trim() || '';

			chapters.push({
				id: chapterId,
				title,
				number: chapterNumber,
				url: href,
				date: dateText
			});
		});

		return chapters;
	}

	/**
	 * Parse chapter pages (images)
	 */
	private parseChapterPages(document: any): Page[] {
		const pages: Page[] = [];
		const images = document.querySelectorAll('.reading-content img, .page-break img');

		images.forEach((img: any, index: number) => {
			let imageUrl = img.getAttribute('data-src') ||
				img.getAttribute('src') ||
				img.getAttribute('data-lazy-src') || '';

			imageUrl = imageUrl.trim();
			if (!imageUrl || imageUrl.includes('loading') || imageUrl.includes('placeholder')) return;

			pages.push({
				index: index,
				imageUrl,
				width: parseInt(img.getAttribute('width') || '0', 10) || undefined,
				height: parseInt(img.getAttribute('height') || '0', 10) || undefined
			});
		});

		return pages;
	}
}
