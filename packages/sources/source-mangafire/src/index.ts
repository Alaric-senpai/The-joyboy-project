/**
 * @joyboy-parser/source-mangafire
 * MangaFire.to parser implementation
 * Compatible with Node.js, Browser, and React Native
 * 
 * Website: https://mangafire.to
 * Features: 52k+ manga titles, free, no ads
 */

import { BaseSource } from '@joyboy-parser/core';
import type { Manga, Chapter, Page, SearchOptions, PaginationBase, Genre } from '@joyboy-parser/types';

// MangaFire genre mapping
const GENRES: Genre[] = [
	{ label: 'Action', id: 1 },
	{ label: 'Adventure', id: 2 },
	{ label: 'Comedy', id: 3 },
	{ label: 'Drama', id: 4 },
	{ label: 'Fantasy', id: 5 },
	{ label: 'Horror', id: 6 },
	{ label: 'Mystery', id: 7 },
	{ label: 'Romance', id: 8 },
	{ label: 'Sci-Fi', id: 9 },
	{ label: 'Slice of Life', id: 10 },
	{ label: 'Sports', id: 11 },
	{ label: 'Supernatural', id: 12 },
	{ label: 'Thriller', id: 13 },
	{ label: 'Psychological', id: 14 },
	{ label: 'School Life', id: 15 },
	{ label: 'Shounen', id: 16 },
	{ label: 'Shoujo', id: 17 },
	{ label: 'Seinen', id: 18 },
	{ label: 'Josei', id: 19 },
	{ label: 'Isekai', id: 20 },
	{ label: 'Martial Arts', id: 21 },
	{ label: 'Mecha', id: 22 },
	{ label: 'Military', id: 23 },
	{ label: 'Music', id: 24 },
	{ label: 'Ecchi', id: 25 },
	{ label: 'Harem', id: 26 },
	{ label: 'Historical', id: 27 },
	{ label: 'Super Power', id: 28 },
];

/**
 * MangaFire source parser
 * Scrapes manga data from mangafire.to
 */
export default class MangaFireSource extends BaseSource {
	id = 'mangafire';
	name = 'MangaFire';
	version = '1.0.0';
	baseUrl = 'https://mangafire.to';
	icon = 'https://mangafire.to/assets/sites/mangafire/favicon.ico';
	description = 'MangaFire - Free manga reader with 52k+ titles';
	languages = ['en'];
	isNsfw = false;

	// Capabilities
	supportsSearch = true;
	supportsTrending = true;
	supportsLatest = true;
	supportsFilters = true;
	supportsPopular = true;

	// Default headers to bypass 403 blocks
	private defaultHeaders: Record<string, string> = {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
		'Accept-Language': 'en-US,en;q=0.9',
		'Referer': 'https://mangafire.to/',
		'DNT': '1',
		'Connection': 'keep-alive',
		'Upgrade-Insecure-Requests': '1'
	};

	/**
	 * Override fetchHtml to include proper headers
	 */
	protected async fetchHtmlWithHeaders(url: string): Promise<string> {
		return this.fetchHtml(url, { headers: this.defaultHeaders });
	}

	/**
	 * Search for manga on MangaFire
	 * URL pattern: /filter?keyword={query}&page={page}
	 */
	async search(query: string, options?: SearchOptions): Promise<Manga[]> {
		const page = options?.page || 1;
		const params: Record<string, any> = {
			keyword: query,
			page: page
		};

		// Add genre filters if specified
		if (options?.includedGenres && options.includedGenres.length > 0) {
			params.genre = options.includedGenres.join(',');
		}

		// Add status filter
		if (options?.status) {
			const statusMap: Record<string, string> = {
				'ongoing': 'releasing',
				'completed': 'completed',
				'hiatus': 'on_hiatus',
				'cancelled': 'discontinued'
			};
			params.status = statusMap[options.status] || options.status;
		}

		// Add sort option
		if (options?.sort) {
			const sortMap: Record<string, string> = {
				'latest': 'recently_updated',
				'popular': 'most_viewed',
				'rating': 'scores',
				'alphabetical': 'title_az'
			};
			params.sort = sortMap[options.sort] || 'most_viewed';
		}

		const url = this.buildUrl('/filter', params);
		const html = await this.fetchHtmlWithHeaders(url);
		return this.parseSearchResults(html)
	}

	/**
	 * Get detailed manga information
	 * URL pattern: /manga/{slug}.{id}
	 */
	async getMangaDetails(id: string): Promise<Manga> {
		// id format: "slug.shortId" e.g., "one-piecee.dkw"
		const url = `${this.baseUrl}/manga/${id}`;
		const html = await this.fetchHtmlWithHeaders(url);
		return this.parseMangaDetails(html, id);
	}

	/**
	 * Get chapters for a manga
	 * Chapters are embedded in the manga page
	 */
	async getChapters(mangaId: string): Promise<Chapter[]> {
		const url = `${this.baseUrl}/manga/${mangaId}`;
		const html = await this.fetchHtmlWithHeaders(url);
		return this.parseChapters(html, mangaId);
	}

	/**
	 * Get pages for a chapter
	 * URL pattern: /read/{slug}.{id}/{lang}/chapter-{num}
	 */
	async getChapterPages(chapterId: string): Promise<Page[]> {
		// chapterId format: "slug.id/en/chapter-num" e.g., "one-piecee.dkw/en/chapter-1173"
		const url = `${this.baseUrl}/read/${chapterId}`;
		const html = await this.fetchHtmlWithHeaders(url);
		return this.parseChapterPages(html);
	}

	/**
	 * Get manga by page (pagination helper)
	 */
	async getByPage(searchLabel: string, pageNumber: number): Promise<Manga[]> {
		return this.search(searchLabel, { page: pageNumber });
	}

	/**
	 * List all manga with pagination
	 */
	async listAll(options?: SearchOptions): Promise<Manga[]> {
		const page = options?.page || 1;
		const url = this.buildUrl('/filter', { page, sort: 'most_viewed' });
		const html = await this.fetchHtmlWithHeaders(url);
		return this.parseSearchResults(html);
	}

	/**
	 * Get trending manga
	 */
	async getTrending(options?: SearchOptions): Promise<Manga[]> {
		const page = options?.page || 1;
		const url = this.buildUrl('/filter', { page, sort: 'trending' });
		const html = await this.fetchHtmlWithHeaders(url);
		return this.parseSearchResults(html);
	}

	/**
	 * Get latest updated manga
	 */
	async getLatest(options?: SearchOptions): Promise<Manga[]> {
		const page = options?.page || 1;
		const url = this.buildUrl('/filter', { page, sort: 'recently_updated' });
		const html = await this.fetchHtmlWithHeaders(url);
		return this.parseSearchResults(html);
	}

	/**
	 * Get popular manga
	 */
	async getPopular(options?: SearchOptions): Promise<Manga[]> {
		const page = options?.page || 1;
		const url = this.buildUrl('/filter', { page, sort: 'most_viewed' });
		const html = await this.fetchHtmlWithHeaders(url);
		return this.parseSearchResults(html);
	}

	/**
	 * List available genres
	 */
	async listGenres(): Promise<Genre[]> {
		return GENRES;
	}

	/**
	 * Extract pagination info from a page
	 */
	async extractPaginationInfo(url: string): Promise<PaginationBase> {
		const html = await this.fetchHtmlWithHeaders(url);
		const doc = this.parseHtmlDoc(html);

		// Look for pagination elements
		const pagination = doc.querySelector('.pagination, .page-item, nav[aria-label="pagination"]');
		if (!pagination) {
			return { totalPages: 1, currentPage: 1, hasNextPage: false, hasPreviousPage: false };
		}

		// Try to find last page number
		const pageLinks = doc.querySelectorAll('.pagination a, .page-link');
		let maxPage = 1;
		let currentPage = 1;

		pageLinks.forEach((link: any) => {
			const text = link.textContent?.trim();
			const pageNum = parseInt(text || '0', 10);
			if (!isNaN(pageNum) && pageNum > maxPage) {
				maxPage = pageNum;
			}
			if (link.classList?.contains('active') || link.parentElement?.classList?.contains('active')) {
				currentPage = pageNum || currentPage;
			}
		});

		return {
			totalPages: maxPage,
			currentPage,
			hasNextPage: currentPage < maxPage,
			hasPreviousPage: currentPage > 1
		};
	}

	// --- Private parsing methods ---

	/**
	 * Parse search/filter results page
	 */
	private parseSearchResults(html: string): Manga[] {
		const doc = this.parseHtmlDoc(html);
		const mangaList: Manga[] = [];

		// Select manga cards - MangaFire uses various container classes
		const mangaCards = doc.querySelectorAll('.manga-poster, .unit, .original.card-lg, .inner');

		mangaCards.forEach((card: any) => {
			try {
				// Find the link element
				const linkEl = card.querySelector('a[href*="/manga/"]') || card.closest('a[href*="/manga/"]');
				if (!linkEl) return;

				const href = linkEl.getAttribute('href') || '';
				// Extract id from URL: /manga/title-slug.id -> title-slug.id
				const idMatch = href.match(/\/manga\/([^\/]+)$/);
				if (!idMatch) return;

				const id = idMatch[1];

				// Get title
				const titleEl = card.querySelector('.manga-name, .title, h3, h6, .name') || linkEl;
				const title = titleEl?.textContent?.trim() || titleEl?.getAttribute('title') || '';

				// Get cover image
				const imgEl = card.querySelector('img');
				const coverUrl = imgEl?.getAttribute('src') || 
					imgEl?.getAttribute('data-src') || 
					imgEl?.getAttribute('data-lazy-src') || '';

				if (title && id) {
					mangaList.push({
						id,
						title,
						coverUrl,
						sourceId: this.id,
						url: `${this.baseUrl}/manga/${id}`
					});
				}
			} catch (e) {
				// Skip problematic entries
			}
		});

		return mangaList;
	}

	/**
	 * Parse manga details page
	 */
	private parseMangaDetails(html: string, id: string): Manga {
		const doc = this.parseHtmlDoc(html);

		// Get title - try multiple selectors
		const titleEl = doc.querySelector('h1, .manga-name, .name, [itemprop="name"]');
		const title = titleEl?.textContent?.trim() || '';

		// Get alternative titles
		const altTitleEl = doc.querySelector('h6, .alt-name, .other-name');
		const altTitles = altTitleEl?.textContent?.split(';').map((t: string) => t.trim()).filter(Boolean) || [];

		// Get cover image
		const coverEl = doc.querySelector('.poster img, .manga-poster img, img.manga-cover, .cover img');
		const coverUrl = coverEl?.getAttribute('src') || coverEl?.getAttribute('data-src') || '';

		// Get description/synopsis
		const descEl = doc.querySelector('.description, .synopsis, [itemprop="description"], .summary, .content');
		const description = descEl?.textContent?.trim() || '';

		// Get author
		const authorEl = doc.querySelector('a[href*="/author/"], .author a, [itemprop="author"]');
		const author = authorEl?.textContent?.trim() || '';

		// Get genres
		const genreEls = doc.querySelectorAll('a[href*="/genre/"], .genres a, .tags a');
		const genres: string[] = [];
		genreEls.forEach((el: any) => {
			const genre = el.textContent?.trim();
			if (genre) genres.push(genre);
		});

		// Get status
		let status: Manga['status'] = 'unknown';
		const statusEl = doc.querySelector('.info-item:has(.status), .status, [data-status]');
		const statusText = statusEl?.textContent?.toLowerCase() || '';
		if (statusText.includes('ongoing') || statusText.includes('releasing')) {
			status = 'ongoing';
		} else if (statusText.includes('completed') || statusText.includes('finished')) {
			status = 'completed';
		} else if (statusText.includes('hiatus')) {
			status = 'hiatus';
		} else if (statusText.includes('cancelled') || statusText.includes('discontinued')) {
			status = 'cancelled';
		}

		// Get year
		const yearMatch = html.match(/Published:\s*(\w+\s+\d+,\s+)?(\d{4})/i) || 
			html.match(/(\d{4})\s+to/i);
		const year = yearMatch ? parseInt(yearMatch[2] || yearMatch[1], 10) : undefined;

		// Get rating
		const ratingEl = doc.querySelector('.score, .rating, [itemprop="ratingValue"]');
		const ratingText = ratingEl?.textContent?.trim();

		return {
			id,
			title,
			altTitles: altTitles.length > 0 ? altTitles : undefined,
			coverUrl,
			author,
			genres: genres.length > 0 ? genres : undefined,
			description,
			status,
			sourceId: this.id,
			url: `${this.baseUrl}/manga/${id}`,
			year,
			metadata: ratingText ? { rating: ratingText } : undefined
		};
	}

	/**
	 * Parse chapters from manga page
	 */
	private parseChapters(html: string, mangaId: string): Chapter[] {
		const doc = this.parseHtmlDoc(html);
		const chapters: Chapter[] = [];

		// MangaFire lists chapters with links like /read/{slug}.{id}/{lang}/chapter-{num}
		const chapterLinks = doc.querySelectorAll('a[href*="/read/"]');

		chapterLinks.forEach((link: any, index: number) => {
			try {
				const href = link.getAttribute('href') || '';
				// Extract chapter info from URL: /read/one-piecee.dkw/en/chapter-1173
				const match = href.match(/\/read\/([^\/]+)\/(\w+)\/chapter-([\d.]+)/);
				if (!match) return;

				const [, slug, lang, chapterNum] = match;

				// Build chapter ID (path after /read/)
				const chapterId = `${slug}/${lang}/chapter-${chapterNum}`;

				// Get chapter title from link text
				const titleText = link.textContent?.trim() || '';
				// Extract title part after "Chapter X:"
				const titleMatch = titleText.match(/Chapter\s+[\d.]+[:\s]*(.+)?/i);
				const chapterTitle = titleMatch?.[1]?.trim() || `Chapter ${chapterNum}`;

				// Try to get date
				const dateEl = link.querySelector('.date, time, .chapter-date') || 
					link.parentElement?.querySelector('.date, time, .chapter-date');
				const dateText = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime');

				chapters.push({
					id: chapterId,
					title: chapterTitle,
					number: parseFloat(chapterNum),
					url: `${this.baseUrl}/read/${chapterId}`,
					date: dateText,
					language: lang
				});
			} catch (e) {
				// Skip problematic chapters
			}
		});

		// Remove duplicates and sort by chapter number descending (newest first)
		const uniqueChapters = chapters.filter((ch, idx, arr) => 
			arr.findIndex(c => c.id === ch.id) === idx
		);
		
		return uniqueChapters.sort((a, b) => (b.number || 0) - (a.number || 0));
	}

	/**
	 * Parse chapter pages
	 * MangaFire loads images dynamically, we need to extract from script or data attributes
	 */
	private parseChapterPages(html: string): Page[] {
		const pages: Page[] = [];

		// Try to find image URLs in script tags (common pattern for manga readers)
		// Look for JSON data or array of image URLs
		const scriptMatch = html.match(/images\s*[=:]\s*(\[[\s\S]*?\])/i) ||
			html.match(/pages\s*[=:]\s*(\[[\s\S]*?\])/i) ||
			html.match(/chapter\s*[=:]\s*{[\s\S]*?images\s*[=:]\s*(\[[\s\S]*?\])/i);

		if (scriptMatch) {
			try {
				// Clean and parse JSON
				const jsonStr = scriptMatch[1]
					.replace(/'/g, '"')
					.replace(/,\s*]/, ']');
				const imageUrls: any[] = JSON.parse(jsonStr);
				
				imageUrls.forEach((item: any, index: number) => {
					if (typeof item === 'string' && item.startsWith('http')) {
						pages.push({
							index,
							imageUrl: item
						});
					} else if (typeof item === 'object' && item !== null && item.url) {
						pages.push({
							index,
							imageUrl: item.url
						});
					}
				});
			} catch (e) {
				// JSON parse failed, try alternative methods
			}
		}

		// Fallback: Parse img tags directly
		if (pages.length === 0) {
			const doc = this.parseHtmlDoc(html);
			const imgEls = doc.querySelectorAll('.reader-area img, .container-reader img, #readerarea img, .page-img, img[data-page]');
			
			imgEls.forEach((img: any, index: number) => {
				const src = img.getAttribute('src') || 
					img.getAttribute('data-src') || 
					img.getAttribute('data-lazy-src');
				
				if (src && (src.startsWith('http') || src.startsWith('//'))) {
					pages.push({
						index,
						imageUrl: src.startsWith('//') ? `https:${src}` : src
					});
				}
			});
		}

		// Another fallback: Look for data-* attributes with page info
		if (pages.length === 0) {
			const doc = this.parseHtmlDoc(html);
			const pageContainers = doc.querySelectorAll('[data-page-image], [data-img], [data-url]');
			
			pageContainers.forEach((el: any, index: number) => {
				const src = el.getAttribute('data-page-image') || 
					el.getAttribute('data-img') || 
					el.getAttribute('data-url');
				
				if (src) {
					pages.push({
						index,
						imageUrl: src.startsWith('//') ? `https:${src}` : src
					});
				}
			});
		}

		return pages;
	}

	/**
	 * Parse HTML string to DOM document
	 */
	private parseHtmlDoc(html: string): any {
		// Use the inherited transformToHtml method from BaseSource
		const parsed = (this as any).transformToHtml(html);
		return parsed.document;
	}
}
