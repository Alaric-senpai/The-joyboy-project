import { BaseSource } from '@joyboy-parser/core';

// src/index.ts
var GENRES = [
  { label: "Action", id: 1 },
  { label: "Adventure", id: 2 },
  { label: "Comedy", id: 3 },
  { label: "Drama", id: 4 },
  { label: "Fantasy", id: 5 },
  { label: "Horror", id: 6 },
  { label: "Mystery", id: 7 },
  { label: "Romance", id: 8 },
  { label: "Sci-Fi", id: 9 },
  { label: "Slice of Life", id: 10 },
  { label: "Sports", id: 11 },
  { label: "Supernatural", id: 12 },
  { label: "Thriller", id: 13 },
  { label: "Psychological", id: 14 },
  { label: "School Life", id: 15 },
  { label: "Shounen", id: 16 },
  { label: "Shoujo", id: 17 },
  { label: "Seinen", id: 18 },
  { label: "Josei", id: 19 },
  { label: "Isekai", id: 20 },
  { label: "Martial Arts", id: 21 },
  { label: "Mecha", id: 22 },
  { label: "Military", id: 23 },
  { label: "Music", id: 24 },
  { label: "Ecchi", id: 25 },
  { label: "Harem", id: 26 },
  { label: "Historical", id: 27 },
  { label: "Super Power", id: 28 }
];
var MangaFireSource = class extends BaseSource {
  id = "mangafire";
  name = "MangaFire";
  version = "1.0.0";
  baseUrl = "https://mangafire.to";
  icon = "https://mangafire.to/assets/sites/mangafire/favicon.ico";
  description = "MangaFire - Free manga reader with 52k+ titles";
  languages = ["en"];
  isNsfw = false;
  // Capabilities
  supportsSearch = true;
  supportsTrending = true;
  supportsLatest = true;
  supportsFilters = true;
  supportsPopular = true;
  // Default headers to bypass 403 blocks
  defaultHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://mangafire.to/",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
  };
  /**
   * Override fetchHtml to include proper headers
   */
  async fetchHtmlWithHeaders(url) {
    return this.fetchHtml(url, { headers: this.defaultHeaders });
  }
  /**
   * Search for manga on MangaFire
   * URL pattern: /filter?keyword={query}&page={page}
   */
  async search(query, options) {
    const page = options?.page || 1;
    const params = {
      keyword: query,
      page
    };
    if (options?.includedGenres && options.includedGenres.length > 0) {
      params.genre = options.includedGenres.join(",");
    }
    if (options?.status) {
      const statusMap = {
        "ongoing": "releasing",
        "completed": "completed",
        "hiatus": "on_hiatus",
        "cancelled": "discontinued"
      };
      params.status = statusMap[options.status] || options.status;
    }
    if (options?.sort) {
      const sortMap = {
        "latest": "recently_updated",
        "popular": "most_viewed",
        "rating": "scores",
        "alphabetical": "title_az"
      };
      params.sort = sortMap[options.sort] || "most_viewed";
    }
    const url = this.buildUrl("/filter", params);
    const html = await this.fetchHtmlWithHeaders(url);
    return this.parseSearchResults(html);
  }
  /**
   * Get detailed manga information
   * URL pattern: /manga/{slug}.{id}
   */
  async getMangaDetails(id) {
    const url = `${this.baseUrl}/manga/${id}`;
    const html = await this.fetchHtmlWithHeaders(url);
    return this.parseMangaDetails(html, id);
  }
  /**
   * Get chapters for a manga
   * Chapters are embedded in the manga page
   */
  async getChapters(mangaId) {
    const url = `${this.baseUrl}/manga/${mangaId}`;
    const html = await this.fetchHtmlWithHeaders(url);
    return this.parseChapters(html, mangaId);
  }
  /**
   * Get pages for a chapter
   * URL pattern: /read/{slug}.{id}/{lang}/chapter-{num}
   */
  async getChapterPages(chapterId) {
    const url = `${this.baseUrl}/read/${chapterId}`;
    const html = await this.fetchHtmlWithHeaders(url);
    return this.parseChapterPages(html);
  }
  /**
   * Get manga by page (pagination helper)
   */
  async getByPage(searchLabel, pageNumber) {
    return this.search(searchLabel, { page: pageNumber });
  }
  /**
   * List all manga with pagination
   */
  async listAll(options) {
    const page = options?.page || 1;
    const url = this.buildUrl("/filter", { page, sort: "most_viewed" });
    const html = await this.fetchHtmlWithHeaders(url);
    return this.parseSearchResults(html);
  }
  /**
   * Get trending manga
   */
  async getTrending(options) {
    const page = options?.page || 1;
    const url = this.buildUrl("/filter", { page, sort: "trending" });
    const html = await this.fetchHtmlWithHeaders(url);
    return this.parseSearchResults(html);
  }
  /**
   * Get latest updated manga
   */
  async getLatest(options) {
    const page = options?.page || 1;
    const url = this.buildUrl("/filter", { page, sort: "recently_updated" });
    const html = await this.fetchHtmlWithHeaders(url);
    return this.parseSearchResults(html);
  }
  /**
   * Get popular manga
   */
  async getPopular(options) {
    const page = options?.page || 1;
    const url = this.buildUrl("/filter", { page, sort: "most_viewed" });
    const html = await this.fetchHtmlWithHeaders(url);
    return this.parseSearchResults(html);
  }
  /**
   * List available genres
   */
  async listGenres() {
    return GENRES;
  }
  /**
   * Extract pagination info from a page
   */
  async extractPaginationInfo(url) {
    const html = await this.fetchHtmlWithHeaders(url);
    const doc = this.parseHtmlDoc(html);
    const pagination = doc.querySelector('.pagination, .page-item, nav[aria-label="pagination"]');
    if (!pagination) {
      return { totalPages: 1, currentPage: 1, hasNextPage: false, hasPreviousPage: false };
    }
    const pageLinks = doc.querySelectorAll(".pagination a, .page-link");
    let maxPage = 1;
    let currentPage = 1;
    pageLinks.forEach((link) => {
      const text = link.textContent?.trim();
      const pageNum = parseInt(text || "0", 10);
      if (!isNaN(pageNum) && pageNum > maxPage) {
        maxPage = pageNum;
      }
      if (link.classList?.contains("active") || link.parentElement?.classList?.contains("active")) {
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
  parseSearchResults(html) {
    const doc = this.parseHtmlDoc(html);
    const mangaList = [];
    const mangaCards = doc.querySelectorAll(".manga-poster, .unit, .original.card-lg, .inner");
    mangaCards.forEach((card) => {
      try {
        const linkEl = card.querySelector('a[href*="/manga/"]') || card.closest('a[href*="/manga/"]');
        if (!linkEl) return;
        const href = linkEl.getAttribute("href") || "";
        const idMatch = href.match(/\/manga\/([^\/]+)$/);
        if (!idMatch) return;
        const id = idMatch[1];
        const titleEl = card.querySelector(".manga-name, .title, h3, h6, .name") || linkEl;
        const title = titleEl?.textContent?.trim() || titleEl?.getAttribute("title") || "";
        const imgEl = card.querySelector("img");
        const coverUrl = imgEl?.getAttribute("src") || imgEl?.getAttribute("data-src") || imgEl?.getAttribute("data-lazy-src") || "";
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
      }
    });
    return mangaList;
  }
  /**
   * Parse manga details page
   */
  parseMangaDetails(html, id) {
    const doc = this.parseHtmlDoc(html);
    const titleEl = doc.querySelector('h1, .manga-name, .name, [itemprop="name"]');
    const title = titleEl?.textContent?.trim() || "";
    const altTitleEl = doc.querySelector("h6, .alt-name, .other-name");
    const altTitles = altTitleEl?.textContent?.split(";").map((t) => t.trim()).filter(Boolean) || [];
    const coverEl = doc.querySelector(".poster img, .manga-poster img, img.manga-cover, .cover img");
    const coverUrl = coverEl?.getAttribute("src") || coverEl?.getAttribute("data-src") || "";
    const descEl = doc.querySelector('.description, .synopsis, [itemprop="description"], .summary, .content');
    const description = descEl?.textContent?.trim() || "";
    const authorEl = doc.querySelector('a[href*="/author/"], .author a, [itemprop="author"]');
    const author = authorEl?.textContent?.trim() || "";
    const genreEls = doc.querySelectorAll('a[href*="/genre/"], .genres a, .tags a');
    const genres = [];
    genreEls.forEach((el) => {
      const genre = el.textContent?.trim();
      if (genre) genres.push(genre);
    });
    let status = "unknown";
    const statusEl = doc.querySelector(".info-item:has(.status), .status, [data-status]");
    const statusText = statusEl?.textContent?.toLowerCase() || "";
    if (statusText.includes("ongoing") || statusText.includes("releasing")) {
      status = "ongoing";
    } else if (statusText.includes("completed") || statusText.includes("finished")) {
      status = "completed";
    } else if (statusText.includes("hiatus")) {
      status = "hiatus";
    } else if (statusText.includes("cancelled") || statusText.includes("discontinued")) {
      status = "cancelled";
    }
    const yearMatch = html.match(/Published:\s*(\w+\s+\d+,\s+)?(\d{4})/i) || html.match(/(\d{4})\s+to/i);
    const year = yearMatch ? parseInt(yearMatch[2] || yearMatch[1], 10) : void 0;
    const ratingEl = doc.querySelector('.score, .rating, [itemprop="ratingValue"]');
    const ratingText = ratingEl?.textContent?.trim();
    return {
      id,
      title,
      altTitles: altTitles.length > 0 ? altTitles : void 0,
      coverUrl,
      author,
      genres: genres.length > 0 ? genres : void 0,
      description,
      status,
      sourceId: this.id,
      url: `${this.baseUrl}/manga/${id}`,
      year,
      metadata: ratingText ? { rating: ratingText } : void 0
    };
  }
  /**
   * Parse chapters from manga page
   */
  parseChapters(html, mangaId) {
    const doc = this.parseHtmlDoc(html);
    const chapters = [];
    const chapterLinks = doc.querySelectorAll('a[href*="/read/"]');
    chapterLinks.forEach((link, index) => {
      try {
        const href = link.getAttribute("href") || "";
        const match = href.match(/\/read\/([^\/]+)\/(\w+)\/chapter-([\d.]+)/);
        if (!match) return;
        const [, slug, lang, chapterNum] = match;
        const chapterId = `${slug}/${lang}/chapter-${chapterNum}`;
        const titleText = link.textContent?.trim() || "";
        const titleMatch = titleText.match(/Chapter\s+[\d.]+[:\s]*(.+)?/i);
        const chapterTitle = titleMatch?.[1]?.trim() || `Chapter ${chapterNum}`;
        const dateEl = link.querySelector(".date, time, .chapter-date") || link.parentElement?.querySelector(".date, time, .chapter-date");
        const dateText = dateEl?.textContent?.trim() || dateEl?.getAttribute("datetime");
        chapters.push({
          id: chapterId,
          title: chapterTitle,
          number: parseFloat(chapterNum),
          url: `${this.baseUrl}/read/${chapterId}`,
          date: dateText,
          language: lang
        });
      } catch (e) {
      }
    });
    const uniqueChapters = chapters.filter(
      (ch, idx, arr) => arr.findIndex((c) => c.id === ch.id) === idx
    );
    return uniqueChapters.sort((a, b) => (b.number || 0) - (a.number || 0));
  }
  /**
   * Parse chapter pages
   * MangaFire loads images dynamically, we need to extract from script or data attributes
   */
  parseChapterPages(html) {
    const pages = [];
    const scriptMatch = html.match(/images\s*[=:]\s*(\[[\s\S]*?\])/i) || html.match(/pages\s*[=:]\s*(\[[\s\S]*?\])/i) || html.match(/chapter\s*[=:]\s*{[\s\S]*?images\s*[=:]\s*(\[[\s\S]*?\])/i);
    if (scriptMatch) {
      try {
        const jsonStr = scriptMatch[1].replace(/'/g, '"').replace(/,\s*]/, "]");
        const imageUrls = JSON.parse(jsonStr);
        imageUrls.forEach((item, index) => {
          if (typeof item === "string" && item.startsWith("http")) {
            pages.push({
              index,
              imageUrl: item
            });
          } else if (typeof item === "object" && item !== null && item.url) {
            pages.push({
              index,
              imageUrl: item.url
            });
          }
        });
      } catch (e) {
      }
    }
    if (pages.length === 0) {
      const doc = this.parseHtmlDoc(html);
      const imgEls = doc.querySelectorAll(".reader-area img, .container-reader img, #readerarea img, .page-img, img[data-page]");
      imgEls.forEach((img, index) => {
        const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
        if (src && (src.startsWith("http") || src.startsWith("//"))) {
          pages.push({
            index,
            imageUrl: src.startsWith("//") ? `https:${src}` : src
          });
        }
      });
    }
    if (pages.length === 0) {
      const doc = this.parseHtmlDoc(html);
      const pageContainers = doc.querySelectorAll("[data-page-image], [data-img], [data-url]");
      pageContainers.forEach((el, index) => {
        const src = el.getAttribute("data-page-image") || el.getAttribute("data-img") || el.getAttribute("data-url");
        if (src) {
          pages.push({
            index,
            imageUrl: src.startsWith("//") ? `https:${src}` : src
          });
        }
      });
    }
    return pages;
  }
  /**
   * Parse HTML string to DOM document
   */
  parseHtmlDoc(html) {
    const parsed = this.transformToHtml(html);
    return parsed.document;
  }
};

export { MangaFireSource as default };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map