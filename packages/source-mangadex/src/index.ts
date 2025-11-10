/**
 * @joyboy/source-mangadex
 * MangaDex parser implementation
 * Compatible with Node.js, Browser, and React Native
 */

import { BaseSource } from '@joyboy/core';
import type { Manga, Chapter, Page, SearchOptions } from '@joyboy/types';

// MangaDex API response types
interface MangaDexManga {
	id: string;
	attributes: {
		title: Record<string, string>;
		altTitles?: Array<Record<string, string>>;
		description?: Record<string, string>;
		status?: string;
		year?: number;
		tags?: Array<{ 
			id: string;
			attributes: { name: Record<string, string> } 
		}>;
		contentRating?: string;
	};
	relationships: Array<{
		type: string;
		id: string;
		attributes?: any;
	}>;
}

interface MangaDexChapter {
	id: string;
	attributes: {
		title?: string;
		chapter?: string;
		volume?: string;
		publishAt: string;
		pages: number;
		translatedLanguage: string;
	};
	relationships: Array<{
		type: string;
		id?: string;
		attributes?: { name?: string };
	}>;
}

interface MangaDexPageResponse {
	baseUrl: string;
	chapter: {
		hash: string;
		data: string[];
		dataSaver: string[];
	};
}

/**
 * MangaDex source parser
 */
export default class MangaDexSource extends BaseSource {
	id = 'mangadex';
	name = 'MangaDex';
	version = '1.0.0';
	baseUrl = 'https://api.mangadex.org';
	icon = 'https://mangadex.org/favicon.ico';
	description = 'Official MangaDex API parser';
	languages = ['en'];
  
	supportsSearch = true;
	supportsTrending = false;
	supportsLatest = true;
	supportsFilters = true;
	supportsPopular = true;

	/**
	 * Search for manga on MangaDex
	 */
	async search(query: string, options?: SearchOptions): Promise<Manga[]> {
		const params: Record<string, any> = {
			title: query,
			limit: options?.limit || 20,
			offset: options?.page ? (options.page - 1) * (options.limit || 20) : 0,
			includes: ['cover_art', 'author', 'artist'],
			order: { relevance: 'desc' }
		};
    
		if (options?.includedGenres?.length) {
			params.includedTags = options.includedGenres;
		}
    
		if (options?.excludedGenres?.length) {
			params.excludedTags = options.excludedGenres;
		}
    
		if (options?.status) {
			params.status = [options.status];
		}
    
		const response = await this.request<{ data: MangaDexManga[] }>(
			this.buildUrl('/manga', params)
		);
    
		return response.data.map(item => this.parseManga(item));
	}

	/**
	 * Get detailed manga information
	 */
	async getMangaDetails(id: string): Promise<Manga> {
		const response = await this.request<{ data: MangaDexManga }>(
			this.buildUrl(`/manga/${id}`, { 
				includes: ['cover_art', 'author', 'artist'] 
			})
		);
    
		return this.parseManga(response.data);
	}

	/**
	 * Get chapters for a manga
	 */
	async getChapters(mangaId: string): Promise<Chapter[]> {
		const allChapters: Chapter[] = [];
		let offset = 0;
		const limit = 500;
    
		// MangaDex has pagination, fetch all chapters
		while (true) {
			const params = {
				manga: mangaId,
				translatedLanguage: ['en'],
				order: { chapter: 'asc' },
				limit,
				offset,
				includes: ['scanlation_group'],
				contentRating: ['safe', 'suggestive', 'erotica', 'pornographic']
			};
      
			const response = await this.request<{ 
				data: MangaDexChapter[];
				limit: number;
				offset: number;
				total: number;
			}>(this.buildUrl('/chapter', params));
      
			allChapters.push(...response.data.map(item => this.parseChapter(item)));
      
			if (offset + limit >= response.total) {
				break;
			}
      
			offset += limit;
		}
    
		return allChapters;
	}

	/**
	 * Get pages for a chapter
	 */
	async getChapterPages(chapterId: string): Promise<Page[]> {
		const response = await this.request<MangaDexPageResponse>(
			this.buildUrl(`/at-home/server/${chapterId}`)
		);
    
		const { baseUrl, chapter } = response;
    
		return chapter.data.map((filename, index) => ({
			index,
			imageUrl: `${baseUrl}/data/${chapter.hash}/${filename}`,
			headers: {
				'Referer': 'https://mangadex.org/'
			}
		}));
	}

	/**
	 * Get latest manga updates
	 */
	async getLatest(options?: SearchOptions): Promise<Manga[]> {
		const params = {
			limit: options?.limit || 20,
			offset: options?.page ? (options.page - 1) * (options.limit || 20) : 0,
			includes: ['cover_art', 'author', 'artist'],
			order: { createdAt: 'desc' },
			contentRating: ['safe', 'suggestive']
		};
    
		const response = await this.request<{ data: MangaDexManga[] }>(
			this.buildUrl('/manga', params)
		);
    
		return response.data.map(item => this.parseManga(item));
	}

	/**
	 * Get popular manga
	 */
	async getPopular(options?: SearchOptions): Promise<Manga[]> {
		const params = {
			limit: options?.limit || 20,
			offset: options?.page ? (options.page - 1) * (options.limit || 20) : 0,
			includes: ['cover_art', 'author', 'artist'],
			order: { followedCount: 'desc' },
			contentRating: ['safe', 'suggestive']
		};
    
		const response = await this.request<{ data: MangaDexManga[] }>(
			this.buildUrl('/manga', params)
		);
    
		return response.data.map(item => this.parseManga(item));
	}

	/**
	 * Parse MangaDex manga data into standard format
	 */
	private parseManga(data: MangaDexManga): Manga {
		const title = data.attributes.title.en || 
									Object.values(data.attributes.title)[0] || 
									'Unknown';
    
		const description = data.attributes.description?.en || 
											 (data.attributes.description ? 
												Object.values(data.attributes.description)[0] : 
												'');
    
		const coverArt = data.relationships.find(r => r.type === 'cover_art');
		const coverUrl = coverArt?.attributes?.fileName
			? `https://uploads.mangadex.org/covers/${data.id}/${coverArt.attributes.fileName}`
			: undefined;
    
		const author = data.relationships
			.find(r => r.type === 'author')
			?.attributes?.name;
    
		const artist = data.relationships
			.find(r => r.type === 'artist')
			?.attributes?.name;
    
		const genres = data.attributes.tags?.map(tag => 
			tag.attributes.name.en || Object.values(tag.attributes.name)[0]
		) || [];
    
		return {
			id: data.id,
			title,
			coverUrl,
			author,
			artist,
			genres,
			description,
			status: this.parseStatus(data.attributes.status),
			year: data.attributes.year,
			rating: this.parseRating(data.attributes.contentRating),
			sourceId: this.id,
			url: `https://mangadex.org/title/${data.id}`
		};
	}

	/**
	 * Parse MangaDex chapter data
	 */
	private parseChapter(data: MangaDexChapter): Chapter {
		const scanlator = data.relationships
			.find(r => r.type === 'scanlation_group')
			?.attributes?.name;
    
		const chapterNum = data.attributes.chapter ? 
											parseFloat(data.attributes.chapter) : 
											undefined;
    
		const volumeNum = data.attributes.volume ? 
										 parseInt(data.attributes.volume) : 
										 undefined;
    
		return {
			id: data.id,
			title: data.attributes.title || `Chapter ${chapterNum || '?'}`,
			number: chapterNum,
			volume: volumeNum,
			date: data.attributes.publishAt,
			pages: data.attributes.pages,
			scanlator,
			language: data.attributes.translatedLanguage,
			url: `https://mangadex.org/chapter/${data.id}`
		};
	}

	/**
	 * Parse status string to standard format
	 */
	private parseStatus(status?: string): Manga['status'] {
		switch (status?.toLowerCase()) {
			case 'ongoing': return 'ongoing';
			case 'completed': return 'completed';
			case 'hiatus': return 'hiatus';
			case 'cancelled': return 'cancelled';
			default: return 'unknown';
		}
	}

	/**
	 * Parse content rating
	 */
	private parseRating(rating?: string): Manga['rating'] {
		switch (rating?.toLowerCase()) {
			case 'safe': return 'safe';
			case 'suggestive': return 'suggestive';
			case 'erotica': return 'erotica';
			case 'pornographic': return 'pornographic';
			default: return 'safe';
		}
	}
}

