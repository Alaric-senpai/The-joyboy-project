/**
 * @joyboy-parser/source-manhuafast
 * ManhuaFast parser implementation for WordPress-based manga sites
 * Compatible with Node.js, Browser, and React Native
 */

import { BaseSource } from '@joyboy-parser/core';
import type { Manga, Chapter, Page, SearchOptions, PaginationBase } from '@joyboy-parser/types';
import { parseHTML } from 'linkedom';

export default class ManhuaFastSource extends BaseSource {
	getbyPage(searchLabel: string, pageNumber: number): Promise<Manga[]> {
		throw new Error('Method not implemented.');
	}
	listAll(options?: SearchOptions): Promise<Manga[]> {
		throw new Error('Method not implemented.');
	}
	extractPaginationInfo(url: string): Promise<PaginationBase> {
		throw new Error('Method not implemented.');
	}
	id = 'manhuafast';
	name = 'ManhuaFast';
	version = '1.0.0';
	baseUrl = 'https://manhuafast.net';
	icon = 'https://manhuafast.net/wp-content/uploads/2024/01/cropped-favicon-32x32.png';
	description = 'ManhuaFast parser for WordPress-based manga sites';

	supportsSearch = true;
	supportsTrending = false;
	supportsLatest = true;
	supportsFilters = false;
	supportsPopular = true;

	/**
	 * Search for manga by query
	 */
	async search(query: string, options?: SearchOptions): Promise<Manga[]> {
		const params: Record<string, any> = {
			s: query,
			post_type: 'wp-manga'
		};

		const url = this.buildUrl('/', params);
		const html = await this.fetchHtml(url);
		return this.parseSearchResults(html);
	}

	/**
	 * Get full manga details by ID (slug)
	 */
	async getMangaDetails(id: string): Promise<Manga> {
		const url = `${this.baseUrl}/manga/${id}`;
		const html = await this.fetchHtml(url);
		return this.parseMangaDetails(html, id);
	}

	/**
	 * Get all chapters for a manga by its ID (slug)
	 */
	async getChapters(mangaId: string): Promise<Chapter[]> {
		const url = `${this.baseUrl}/manga/${mangaId}`;
		const html = await this.fetchHtml(url);
		return this.parseChapters(html, mangaId);
	}

	/**
	 * Get all pages (images) for a specific chapter
	 */
	async getChapterPages(chapterId: string): Promise<Page[]> {
		const html = await this.fetchHtml(chapterId);
		return this.parsePages(html);
	}

	/**
	 * Get latest manga updates
	 */
	async getLatest(options?: SearchOptions): Promise<Manga[]> {
		const url = `${this.baseUrl}/manga/`;
		const html = await this.fetchHtml(url);
		return this.parseSearchResults(html);
	}

	/**
	 * Get popular manga
	 */
	async getPopular(options?: SearchOptions): Promise<Manga[]> {
		const params = {
			'm_orderby': 'views'
		};
		const url = this.buildUrl('/manga/', params);
		const html = await this.fetchHtml(url);
		return this.parseSearchResults(html);
	}

	/**
	 * Parse search results from HTML
	 */
	private parseSearchResults(html: string): Manga[] {
		const { document } = parseHTML(html);
		const results: Manga[] = [];

		const elements = document.querySelectorAll('.c-tabs-item__content, .row.c-tabs-item__content');
		
		elements.forEach((element) => {
			const linkEl = element.querySelector('.post-title a, h3 a, h4 a');
			const title = linkEl?.textContent?.trim() || '';
			const href = linkEl?.getAttribute('href') || '';
			
			if (!title || !href) return;

			// Extract ID from URL (e.g., /manga/some-manga-title/ -> some-manga-title)
			const id = href.split('/manga/')[1]?.replace(/\/$/, '') || '';
			if (!id) return;

			const imgEl = element.querySelector('img');
			const coverUrl = imgEl?.getAttribute('data-src') || 
							 imgEl?.getAttribute('src') || '';

			// Get genres
			const genres: string[] = [];
			const genreLinks = element.querySelectorAll('.mg_genres a, .genres a');
			genreLinks.forEach((genreEl) => {
				const genre = genreEl.textContent?.trim();
				if (genre) genres.push(genre);
			});

			results.push({
				id,
				title,
				coverUrl: coverUrl || undefined,
				genres: genres.length > 0 ? genres : undefined,
				sourceId: this.id,
				url: href
			});
		});

		return results;
	}

	/**
	 * Parse manga details from HTML
	 */
	private parseMangaDetails(html: string, id: string): Manga {
		const { document } = parseHTML(html);

		const titleEl = document.querySelector('.post-title h1, .post-title h3');
		const title = titleEl?.textContent?.trim() || '';
		
		const imgEl = document.querySelector('.summary_image img');
		const coverUrl = imgEl?.getAttribute('data-src') || 
						 imgEl?.getAttribute('src') || '';

		// Get description
		const descriptionEls = document.querySelectorAll('.summary__content p, .description-summary p');
		const description = Array.from(descriptionEls)
			.map(el => el.textContent?.trim() || '')
			.filter(text => text)
			.join('\n\n');

		// Get metadata
		let author: string | undefined;
		let artist: string | undefined;
		let status: Manga['status'] = 'unknown';
		const genres: string[] = [];

		const metaItems = document.querySelectorAll('.post-content_item, .summary-content');
		metaItems.forEach((item) => {
			const headingEl = item.querySelector('.summary-heading h5, .post-content_item-heading');
			const heading = headingEl?.textContent?.trim().toLowerCase() || '';
			const contentEl = item.querySelector('.summary-content, .post-content_item-content');

			if (heading.includes('author')) {
				author = contentEl?.textContent?.trim();
			} else if (heading.includes('artist')) {
				artist = contentEl?.textContent?.trim();
			} else if (heading.includes('status')) {
				const statusText = contentEl?.textContent?.trim().toLowerCase() || '';
				if (statusText.includes('ongoing')) status = 'ongoing';
				else if (statusText.includes('completed')) status = 'completed';
				else if (statusText.includes('hiatus')) status = 'hiatus';
				else if (statusText.includes('cancelled')) status = 'cancelled';
			} else if (heading.includes('genre')) {
				const genreLinks = contentEl?.querySelectorAll('a');
				genreLinks?.forEach((genreEl) => {
					const genre = genreEl.textContent?.trim();
					if (genre) genres.push(genre);
				});
			}
		});

		// Alternative genre parsing
		if (genres.length === 0) {
			const genreLinks = document.querySelectorAll('.genres-content a, .mg_genres a');
			genreLinks.forEach((genreEl) => {
				const genre = genreEl.textContent?.trim();
				if (genre) genres.push(genre);
			});
		}

		return {
			id,
			title,
			coverUrl: coverUrl || undefined,
			author,
			artist,
			genres: genres.length > 0 ? genres : undefined,
			description: description || undefined,
			status,
			sourceId: this.id,
			url: `${this.baseUrl}/manga/${id}`
		};
	}

	/**
	 * Parse chapters from manga page HTML
	 */
	private parseChapters(html: string, mangaId: string): Chapter[] {
		const { document } = parseHTML(html);
		const chapters: Chapter[] = [];

		const chapterElements = document.querySelectorAll('.wp-manga-chapter, .chapter-item');
		
		chapterElements.forEach((element, index) => {
			const linkEl = element.querySelector('a');
			const chapterUrl = linkEl?.getAttribute('href');
			
			if (!chapterUrl) return;

			const chapterText = linkEl?.textContent?.trim() || '';
			
			// Extract chapter number from text like "Chapter 123" or "Ch. 123"
			const chapterMatch = chapterText.match(/chapter\s+(\d+\.?\d*)/i) || 
								 chapterText.match(/ch\.?\s+(\d+\.?\d*)/i);
			const number = chapterMatch ? parseFloat(chapterMatch[1]) : undefined;

			// Get chapter title (text after chapter number)
			let title = chapterText;
			if (chapterMatch) {
				title = chapterText.replace(chapterMatch[0], '').replace(/^[\s:\-–—]+/, '').trim();
			}
			if (!title || title === chapterText) {
				title = `Chapter ${number || index + 1}`;
			}

			// Get release date
			const dateEl = element.querySelector('.chapter-release-date, .post-on');
			const date = dateEl?.textContent?.trim() || undefined;

			chapters.push({
				id: chapterUrl,
				title,
				number,
				url: chapterUrl,
				date
			});
		});

		// WordPress often shows newest first, reverse to get chronological order
		return chapters.reverse();
	}

	/**
	 * Parse pages from chapter HTML
	 */
	private parsePages(html: string): Page[] {
		const { document } = parseHTML(html);
		const pages: Page[] = [];

		// Try different selectors for different WordPress manga themes
		const selectors = [
			'.reading-content img',
			'.page-break img',
			'#readerarea img',
			'.wp-manga-chapter-img'
		];

		for (const selector of selectors) {
			const images = document.querySelectorAll(selector);
			if (images.length > 0) {
				images.forEach((element, index) => {
					let imageUrl = element.getAttribute('data-src') || 
								   element.getAttribute('data-lazy-src') || 
								   element.getAttribute('src') || '';

					imageUrl = imageUrl.trim();

					// Skip empty URLs, placeholders, and very small images
					if (!imageUrl || 
						imageUrl.includes('placeholder') || 
						imageUrl.includes('loading') ||
						imageUrl.includes('1x1')) {
						return;
					}

					// Ensure absolute URL
					if (imageUrl.startsWith('//')) {
						imageUrl = 'https:' + imageUrl;
					} else if (imageUrl.startsWith('/')) {
						imageUrl = this.baseUrl + imageUrl;
					}

					pages.push({
						index,
						imageUrl,
						headers: {
							'Referer': this.baseUrl + '/'
						}
					});
				});
				break; // Found images with this selector, stop trying others
			}
		}

		if (pages.length === 0) {
			throw this.createError(
				'PARSE',
				'No images found on chapter page. The website structure may have changed.'
			);
		}

		return pages;
	}
}
