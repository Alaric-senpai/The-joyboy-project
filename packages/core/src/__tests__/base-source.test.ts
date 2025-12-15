/**
 * Tests for BaseSource
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseSource } from '../base-source';
import type { Manga, Chapter, Page, SearchOptions, PaginationBase, Genre } from '@joyboy-parser/types';

// Concrete implementation for testing
class TestSource extends BaseSource {
  getByPage(searchLabel: string, pageNumber: number): Promise<Manga[]> {
    throw new Error('Method not implemented.');
  }
  listGenres(): Promise<Genre[]> {
    throw new Error('Method not implemented.');
  }
  id = 'test-source';
  name = 'Test Source';
  version = '1.0.0';
  baseUrl = 'https://example.com';

  async search(query: string, options?: SearchOptions): Promise<Manga[]> {
    return [
      {
        id: '1',
        title: `Result for ${query}`,
        sourceId: this.id,
        url: `${this.baseUrl}/manga/1`,
        coverUrl: `${this.baseUrl}/covers/1.jpg`,
        description: 'Test manga',
        author: 'Author 1',
        artist: 'Artist 1',
        genres: ['Action', 'Adventure'],
        status: 'ongoing'
      }
    ];
  }

  async getMangaDetails(id: string): Promise<Manga> {
    return {
      id,
      title: `Manga ${id}`,
      sourceId: this.id,
      url: `${this.baseUrl}/manga/${id}`,
      coverUrl: `${this.baseUrl}/covers/${id}.jpg`,
      description: `Description for manga ${id}`,
      author: 'Author 1, Author 2',
      artist: 'Artist 1',
      genres: ['Action', 'Drama'],
      status: 'ongoing',
      altTitles: ['Alt Title 1'],
      year: 2024
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    return [
      {
        id: '1',
        title: 'Chapter 1',
        number: 1,
        url: `${this.baseUrl}/manga/${mangaId}/chapter/1`,
        date: '2024-01-01'
      },
      {
        id: '2',
        title: 'Chapter 2',
        number: 2,
        url: `${this.baseUrl}/manga/${mangaId}/chapter/2`,
        date: '2024-01-08'
      }
    ];
  }

  async getChapterPages(chapterId: string): Promise<Page[]> {
    return [
      {
        imageUrl: `${this.baseUrl}/pages/${chapterId}/1.jpg`,
        index: 0
      },
      {
        imageUrl: `${this.baseUrl}/pages/${chapterId}/2.jpg`,
        index: 1
      },
      {
        imageUrl: `${this.baseUrl}/pages/${chapterId}/3.jpg`,
        index: 2
      }
    ];
  }

  async getbyPage(searchLabel: string, pageNumber: number): Promise<Manga[]> {
    return [
      {
        id: `${pageNumber}-1`,
        title: `${searchLabel} - Page ${pageNumber} - Manga 1`,
        sourceId: this.id,
        url: `${this.baseUrl}/manga/${pageNumber}-1`,
        coverUrl: `${this.baseUrl}/covers/${pageNumber}-1.jpg`,
        description: 'Test manga from pagination',
        status: 'ongoing'
      }
    ];
  }

  async listAll(options?: SearchOptions): Promise<Manga[]> {
    return this.search('', options);
  }

  async extractPaginationInfo(url: string): Promise<PaginationBase> {
    return {
      totalPages: 10
    };
  }
}

// Test source with optional methods
class FullFeaturedSource extends TestSource {
  getByPage(searchLabel: string, pageNumber: number): Promise<Manga[]> {
    throw new Error('Method not implemented.');
  }
  listGenres(): Promise<Genre[]> {
    throw new Error('Method not implemented.');
  }
  supportsTrending = true;
  supportsLatest = true;
  supportsPopular = true;
  supportsFilters = true;

  async getTrending(options?: SearchOptions): Promise<Manga[]> {
    return [
      {
        id: 'trending-1',
        title: 'Trending Manga 1',
        sourceId: this.id,
        url: `${this.baseUrl}/manga/trending-1`,
        coverUrl: `${this.baseUrl}/covers/trending-1.jpg`,
        description: 'Trending manga',
        genres: ['Action'],
        status: 'ongoing'
      }
    ];
  }

  async getLatest(options?: SearchOptions): Promise<Manga[]> {
    return [
      {
        id: 'latest-1',
        title: 'Latest Manga 1',
        sourceId: this.id,
        url: `${this.baseUrl}/manga/latest-1`,
        coverUrl: `${this.baseUrl}/covers/latest-1.jpg`,
        description: 'Latest manga',
        genres: ['Romance'],
        status: 'ongoing'
      }
    ];
  }

  async getPopular(options?: SearchOptions): Promise<Manga[]> {
    return [
      {
        id: 'popular-1',
        title: 'Popular Manga 1',
        sourceId: this.id,
        url: `${this.baseUrl}/manga/popular-1`,
        coverUrl: `${this.baseUrl}/covers/popular-1.jpg`,
        description: 'Popular manga',
        genres: ['Action', 'Adventure'],
        status: 'completed'
      }
    ];
  }
}

describe('BaseSource', () => {
  let source: TestSource;
  let fullSource: FullFeaturedSource;

  beforeEach(() => {
    source = new TestSource();
    fullSource = new FullFeaturedSource();
  });

  describe('Basic Properties', () => {
    it('should have required properties', () => {
      expect(source.id).toBe('test-source');
      expect(source.name).toBe('Test Source');
      expect(source.version).toBe('1.0.0');
      expect(source.baseUrl).toBe('https://example.com');
    });

    it('should have default capability flags', () => {
      expect(source.supportsSearch).toBe(true);
      expect(source.supportsTrending).toBe(true);
      expect(source.supportsLatest).toBe(true);
      expect(source.supportsFilters).toBe(true);
      expect(source.supportsPopular).toBe(true);
    });

    it('should allow custom capability flags', () => {
      expect(fullSource.supportsTrending).toBe(true);
      expect(fullSource.supportsLatest).toBe(true);
      expect(fullSource.supportsPopular).toBe(true);
      expect(fullSource.supportsFilters).toBe(true);
    });
  });

  describe('search()', () => {
    it('should search for manga', async () => {
      const results = await source.search('one piece');

      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('one piece');
      expect(results[0].id).toBe('1');
    });

    it('should return manga with required fields', async () => {
      const results = await source.search('test');
      const manga = results[0];

      expect(manga).toHaveProperty('id');
      expect(manga).toHaveProperty('title');
      expect(manga).toHaveProperty('sourceId');
      expect(manga).toHaveProperty('url');
      expect(manga).toHaveProperty('coverUrl');
      expect(manga).toHaveProperty('description');
      expect(manga).toHaveProperty('author');
      expect(manga).toHaveProperty('artist');
      expect(manga).toHaveProperty('genres');
      expect(manga).toHaveProperty('status');
    });

    it('should handle empty search results', async () => {
      // Override search to return empty
      const emptySource = new TestSource();
      emptySource.search = async () => [];

      const results = await emptySource.search('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('getMangaDetails()', () => {
    it('should get manga details by ID', async () => {
      const manga = await source.getMangaDetails('123');

      expect(manga.id).toBe('123');
      expect(manga.title).toContain('123');
      expect(manga.url).toContain('123');
    });

    it('should return detailed manga information', async () => {
      const manga = await source.getMangaDetails('1');

      expect(manga.description).toBeDefined();
      expect(manga.author).toBe('Author 1, Author 2');
      expect(manga.artist).toBe('Artist 1');
      expect(manga.genres).toContain('Action');
      expect(manga.altTitles).toContain('Alt Title 1');
      expect(manga.year).toBe(2024);
    });
  });

  describe('getChapters()', () => {
    it('should get chapters for manga', async () => {
      const chapters = await source.getChapters('manga-1');

      expect(chapters).toHaveLength(2);
      expect(chapters[0].id).toBe('1');
      expect(chapters[1].id).toBe('2');
    });

    it('should return chapters with required fields', async () => {
      const chapters = await source.getChapters('manga-1');
      const chapter = chapters[0];

      expect(chapter).toHaveProperty('id');
      expect(chapter).toHaveProperty('title');
      expect(chapter).toHaveProperty('number');
      expect(chapter).toHaveProperty('url');
      expect(chapter).toHaveProperty('date');
    });

    it('should have ordered chapter numbers', async () => {
      const chapters = await source.getChapters('manga-1');

      expect(chapters[0].number).toBe(1);
      expect(chapters[1].number).toBe(2);
    });
  });

  describe('getChapterPages()', () => {
    it('should get pages for chapter', async () => {
      const pages = await source.getChapterPages('chapter-1');

      expect(pages).toHaveLength(3);
      expect(pages[0].index).toBe(0);
      expect(pages[1].index).toBe(1);
      expect(pages[2].index).toBe(2);
    });

    it('should return pages with correct URLs', async () => {
      const pages = await source.getChapterPages('chapter-1');

      pages.forEach((page, index) => {
        expect(page.imageUrl).toContain('chapter-1');
        expect(page.imageUrl).toContain(`${index + 1}.jpg`);
        expect(page.index).toBe(index);
      });
    });

    it('should handle chapters with no pages', async () => {
      const emptySource = new TestSource();
      emptySource.getChapterPages = async () => [];

      const pages = await emptySource.getChapterPages('empty-chapter');
      expect(pages).toHaveLength(0);
    });
  });

  describe('getbyPage()', () => {
    it('should get manga by page number', async () => {
      const results = await source.getbyPage('popular', 2);

      expect(results).toHaveLength(1);
      expect(results[0].id).toContain('2-');
      expect(results[0].title).toContain('Page 2');
    });

    it('should handle different search labels', async () => {
      const results1 = await source.getbyPage('trending', 1);
      const results2 = await source.getbyPage('latest', 1);

      expect(results1[0].title).toContain('trending');
      expect(results2[0].title).toContain('latest');
    });
  });

  describe('extractPaginationInfo()', () => {
    it('should extract pagination from URL', async () => {
      const url = 'https://example.com/manga?page=1';
      const pagination = await source.extractPaginationInfo(url);

      expect(pagination.totalPages).toBe(10);
    });

    it('should return pagination structure', async () => {
      const url = 'https://example.com/manga';
      const pagination = await source.extractPaginationInfo(url);

      expect(typeof pagination.totalPages).toBe('number');
    });
  });

  describe('Optional Methods', () => {
    it('should support getTrending when implemented', async () => {
      expect(fullSource.supportsTrending).toBe(true);
      expect(fullSource.getTrending).toBeDefined();

      const trending = await fullSource.getTrending!();
      expect(trending).toHaveLength(1);
      expect(trending[0].id).toBe('trending-1');
    });

    it('should support getLatest when implemented', async () => {
      expect(fullSource.supportsLatest).toBe(true);
      expect(fullSource.getLatest).toBeDefined();

      const latest = await fullSource.getLatest!();
      expect(latest).toHaveLength(1);
      expect(latest[0].id).toBe('latest-1');
    });

    it('should support getPopular when implemented', async () => {
      expect(fullSource.supportsPopular).toBe(true);
      expect(fullSource.getPopular).toBeDefined();

      const popular = await fullSource.getPopular!();
      expect(popular).toHaveLength(1);
      expect(popular[0].id).toBe('popular-1');
    });

    it('should not have optional methods on basic TestSource', () => {
      // TestSource only has the required abstract methods
      // Optional methods are only on FullFeaturedSource
      expect(typeof (source as any).getTrending).toBe('undefined');
      expect(typeof (source as any).getLatest).toBe('undefined');
      expect(typeof (source as any).getPopular).toBe('undefined');
    });
  });

  describe('Request Manager', () => {
    it('should have request manager instance', () => {
      expect(source['requestManager']).toBeDefined();
      expect(typeof source['request']).toBe('function');
      expect(typeof source['fetchHtml']).toBe('function');
    });

    it('should have utility methods', () => {
      expect(typeof source['createError']).toBe('function');
      expect(typeof source['delay']).toBe('function');
      expect(typeof source['buildUrl']).toBe('function');
    });
  });

  describe('HTML Parsing', () => {
    it('should be able to parse HTML', async () => {
      const html = '<div><h1>Test</h1></div>';
      const parsed = (source as any).transformToHtml(html);

      expect(parsed).toBeDefined();
      expect(parsed.document.querySelector('h1')?.textContent).toBe('Test');
    });

    it('should handle malformed HTML gracefully', () => {
      const malformed = '<div><h1>Unclosed';
      const parsed = (source as any).transformToHtml(malformed);

      expect(parsed).toBeDefined();
    });

    it('should parse complex HTML structures', () => {
      const html = `
        <div class="manga-list">
          <div class="manga-item" data-id="1">
            <h2>Manga 1</h2>
            <p>Description 1</p>
          </div>
          <div class="manga-item" data-id="2">
            <h2>Manga 2</h2>
            <p>Description 2</p>
          </div>
        </div>
      `;

      const parsed = (source as any).transformToHtml(html);
      const items = parsed.document.querySelectorAll('.manga-item');

      expect(items).toHaveLength(2);
      expect(items[0].getAttribute('data-id')).toBe('1');
      expect(items[1].querySelector('h2')?.textContent).toBe('Manga 2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in manga titles', async () => {
      const specialSource = new TestSource();
      specialSource.search = async (query) => [{
        id: '1',
        title: `Special: ${query} & Co. <Test>`,
        sourceId: specialSource.id,
        url: 'https://example.com/manga/1',
        coverUrl: 'https://example.com/cover.jpg',
        description: 'Test & <Special>',
        status: 'ongoing'
      }];

      const results = await specialSource.search('test');
      expect(results[0].title).toContain('&');
      expect(results[0].title).toContain('<');
    });

    it('should handle very long descriptions', async () => {
      const longDesc = 'a'.repeat(10000);
      const testSource = new TestSource();
      testSource.getMangaDetails = async (id) => ({
        id,
        title: 'Test',
        sourceId: testSource.id,
        url: 'https://example.com',
        coverUrl: 'https://example.com/cover.jpg',
        description: longDesc,
        status: 'ongoing'
      });

      const manga = await testSource.getMangaDetails('1');
      expect(manga.description?.length).toBe(10000);
    });

    it('should handle empty or undefined optional fields', async () => {
      const emptySource = new TestSource();
      emptySource.getMangaDetails = async (id) => ({
        id,
        title: 'Test',
        sourceId: emptySource.id,
        url: 'https://example.com',
        status: 'ongoing'
      });

      const manga = await emptySource.getMangaDetails('1');
      expect(manga.author).toBeUndefined();
      expect(manga.artist).toBeUndefined();
      expect(manga.genres).toBeUndefined();
    });
  });
  describe('parseSitemap()', () => {
    it('should parse Mangadex sitemap correctly', async () => {
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mangadex.org/about</loc>
  </url>
  <url>
    <loc>https://mangadex.org/announcements</loc>
  </url>
  <url>
    <loc>https://mangadex.org/titles</loc>
  </url>
</urlset>`;

      // Spy on the protected request method
      vi.spyOn(source as any, 'request').mockResolvedValue(sitemapXml);

      const urls = await source.parseSitemap('https://mangadex.org/sitemap.xml');

      expect(urls).toBeDefined();
      expect(urls).toHaveLength(3);
      expect(urls![0].loc).toBe('https://mangadex.org/about');
      expect(urls![2].loc).toBe('https://mangadex.org/titles');

      // Verify request was called with correct headers
      expect((source as any).request).toHaveBeenCalledWith(
        'https://mangadex.org/sitemap.xml',
        expect.objectContaining({
          headers: {
            accepts: 'application/xml'
          }
        })
      );
    });

    it('should handle failed requests gracefully', async () => {
      vi.spyOn(source as any, 'request').mockRejectedValue(new Error('Network error'));

      const result = await source.parseSitemap('https://example.com/sitemap.xml');
      expect(result).toBeNull();
    });

    it('should handle invalid XML', async () => {
      vi.spyOn(source as any, 'request').mockResolvedValue('Invalid XML');

      const result = await source.parseSitemap('https://example.com/sitemap.xml');
      // sitemapParser probably returns undefined/null or throws for invalid XML?
      // Based on implementation: sitemapParser.parse('Invalid XML') -> res
      // res?.urlset?.url
      // If invalid XML, res might be valid object but not have urlset, or return undefined.
      // Let's assume it returns empty array or null based on the ? checks.
      // Actually sitemapParser.parse might not throw but return structure.
      // If it returns null/undefined, safe navigation will handle it.
      // Let's verify what happens with sitemapParser.parse('invalid') in previous output?
      // The user didn't run that.
      // The implementation returns `res?.urlset?.url || []`.
      expect(result).toEqual([]);
    });
  });

});
