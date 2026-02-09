import { BaseSource } from '@joyboy-parser/core';

// src/index.ts
var DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1"
};
var ManhuaFastSource = class extends BaseSource {
  id = "manhuafast";
  name = "ManhuaFast";
  version = "1.0.0";
  baseUrl = "https://manhuafast.net";
  icon = "https://manhuafast.net/wp-content/uploads/2021/09/cropped-unnamed-32x32.png";
  description = "ManhuaFast.net - Read Manhua, Manhwa, and Manga online";
  languages = ["en"];
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
  async fetchWithHeaders(url, extraHeaders) {
    const options = {
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
  async search(query, options) {
    try {
      const page = options?.page || 1;
      const url = `${this.baseUrl}/page/${page}/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
      const html = await this.fetchWithHeaders(url);
      const document = this.transformToHtml(html).document;
      return this.parseSearchResults(document);
    } catch (error) {
      throw this.createError(
        "PARSE",
        `Failed to search for "${query}": ${error.message}`,
        error,
        { query, page: options?.page }
      );
    }
  }
  /**
   * Get detailed manga information
   */
  async getMangaDetails(id) {
    try {
      const url = `${this.baseUrl}/manga/${id}/`;
      const html = await this.fetchWithHeaders(url);
      const document = this.transformToHtml(html).document;
      return this.parseMangaDetails(document, id);
    } catch (error) {
      throw this.createError(
        "PARSE",
        `Failed to get manga details for "${id}": ${error.message}`,
        error,
        { mangaId: id }
      );
    }
  }
  /**
   * Get all chapters for a manga
   */
  async getChapters(mangaId) {
    try {
      const url = `${this.baseUrl}/manga/${mangaId}/ajax/chapters/`;
      const options = {
        headers: {
          ...DEFAULT_HEADERS,
          "X-Requested-With": "XMLHttpRequest"
        },
        method: "POST"
      };
      const html = await this.fetchHtml(url, options);
      const document = this.transformToHtml(html).document;
      return this.parseChapters(document, mangaId);
    } catch (error) {
      throw this.createError(
        "PARSE",
        `Failed to get chapters for "${mangaId}": ${error.message}`,
        error,
        { mangaId }
      );
    }
  }
  /**
   * Get all pages for a chapter
   */
  async getChapterPages(chapterId) {
    try {
      const url = `${this.baseUrl}/manga/${chapterId}/`;
      const html = await this.fetchWithHeaders(url);
      const document = this.transformToHtml(html).document;
      return this.parseChapterPages(document);
    } catch (error) {
      throw this.createError(
        "PARSE",
        `Failed to get chapter pages for "${chapterId}": ${error.message}`,
        error,
        { chapterId }
      );
    }
  }
  /**
   * Get manga by page number for a category/genre
   */
  async getByPage(searchLabel, pageNumber) {
    try {
      const url = `${this.baseUrl}/manga-genre/${searchLabel}/page/${pageNumber}/`;
      const html = await this.fetchWithHeaders(url);
      const document = this.transformToHtml(html).document;
      return this.parseSearchResults(document);
    } catch (error) {
      throw this.createError(
        "PARSE",
        `Failed to get manga by page for "${searchLabel}": ${error.message}`,
        error,
        { searchLabel, pageNumber }
      );
    }
  }
  /**
   * List all manga with pagination
   */
  async listAll(options) {
    try {
      const page = options?.page || 1;
      const url = `${this.baseUrl}/manga/page/${page}/?m_orderby=latest`;
      const html = await this.fetchWithHeaders(url);
      const document = this.transformToHtml(html).document;
      return this.parseSearchResults(document);
    } catch (error) {
      throw this.createError(
        "PARSE",
        `Failed to list all manga: ${error.message}`,
        error,
        { page: options?.page }
      );
    }
  }
  /**
   * List all available genres
   */
  async listGenres() {
    try {
      const url = `${this.baseUrl}/manga/`;
      const html = await this.fetchWithHeaders(url);
      const document = this.transformToHtml(html).document;
      const genres = [];
      const genreLinks = document.querySelectorAll('a[href*="/manga-genre/"]');
      const seenGenres = /* @__PURE__ */ new Set();
      genreLinks.forEach((link) => {
        const href = link.getAttribute("href") || "";
        const match = href.match(/\/manga-genre\/([^/]+)\/?$/);
        if (match && !seenGenres.has(match[1])) {
          const slug = match[1];
          seenGenres.add(slug);
          const label = slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
          genres.push({ label, id: slug });
        }
      });
      return genres.sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
      throw this.createError(
        "PARSE",
        `Failed to list genres: ${error.message}`,
        error
      );
    }
  }
  /**
   * Extract pagination info from URL
   */
  async extractPaginationInfo(url) {
    try {
      const html = await this.fetchWithHeaders(url);
      const document = this.transformToHtml(html).document;
      let totalPages = 1;
      const pageNumbers = document.querySelectorAll(".wp-pagenavi a, .page-numbers");
      pageNumbers.forEach((el) => {
        const text = el.textContent?.trim();
        if (text && !isNaN(parseInt(text))) {
          const num = parseInt(text, 10);
          if (num > totalPages) totalPages = num;
        }
      });
      return { totalPages };
    } catch (error) {
      throw this.createError(
        "PARSE",
        `Failed to extract pagination info from "${url}": ${error.message}`,
        error,
        { url }
      );
    }
  }
  // --- Private parsing methods ---
  /**
   * Parse search results from listing pages
   */
  parseSearchResults(document) {
    const mangas = [];
    const items = document.querySelectorAll(
      ".page-item-detail, .c-tabs-item__content, .row.c-tabs-item"
    );
    items.forEach((item) => {
      try {
        const manga = this.parseMangaCard(item);
        if (manga) mangas.push(manga);
      } catch (e) {
      }
    });
    return mangas;
  }
  /**
   * Parse a manga card element
   */
  parseMangaCard(item) {
    const titleLink = item.querySelector("h3 a, h5 a, .post-title a, .item-title a");
    if (!titleLink) return null;
    const title = titleLink.textContent?.trim() || "";
    const href = titleLink.getAttribute("href") || "";
    const match = href.match(/\/manga\/([^/]+)\/?/);
    if (!match) return null;
    const id = match[1];
    const img = item.querySelector("img");
    const cover = img?.getAttribute("data-src") || img?.getAttribute("src") || "";
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
  parseMangaDetails(document, id) {
    const titleEl = document.querySelector(".post-title h1, h1");
    const title = titleEl?.textContent?.trim() || id;
    const coverEl = document.querySelector(".summary_image img, .tab-summary img");
    const coverUrl = coverEl?.getAttribute("data-src") || coverEl?.getAttribute("src") || "";
    const descEl = document.querySelector(".summary__content, .description-summary");
    let description = descEl?.textContent?.trim() || "";
    description = description.replace(/Show more/gi, "").trim();
    let status = "unknown";
    const statusContainers = document.querySelectorAll(".post-content_item, .post-status");
    statusContainers.forEach((container) => {
      const label = container.querySelector(".summary-heading")?.textContent?.toLowerCase() || "";
      if (label.includes("status")) {
        status = container.querySelector(".summary-content")?.textContent?.trim()?.toLowerCase() || "unknown";
      }
    });
    const genres = [];
    const genreLinks = document.querySelectorAll(".genres-content a, .mg_genres a");
    genreLinks.forEach((link) => {
      const genre = link.textContent?.trim();
      if (genre) genres.push(genre);
    });
    const authorEl = document.querySelector(".author-content a");
    const author = authorEl?.textContent?.trim() || "";
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
  parseChapters(document, mangaId) {
    const chapters = [];
    const chapterContainer = document.querySelector("#manga-chapters-holder, .listing-chapters_wrap, .page-content-listing, .version-chap");
    const searchRoot = chapterContainer || document;
    const chapterItems = searchRoot.querySelectorAll(".wp-manga-chapter, li.wp-manga-chapter, .chapter-item");
    chapterItems.forEach((item, index) => {
      const link = item.querySelector("a");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const title = link.textContent?.trim() || "";
      const hrefLower = href.toLowerCase();
      const mangaIdLower = mangaId.toLowerCase();
      if (!hrefLower.includes("/manga/") || !hrefLower.includes(mangaIdLower)) {
        return;
      }
      const chapterMatch = title.match(/chapter\s*(\d+(?:\.\d+)?)/i);
      const chapterNumber = chapterMatch ? parseFloat(chapterMatch[1]) : index + 1;
      const idMatch = href.match(/\/manga\/([^/]+\/[^/]+)\/?$/);
      const chapterId = idMatch ? idMatch[1] : `${mangaId}/chapter-${chapterNumber}`;
      const dateEl = item.querySelector(".chapter-release-date, .post-on");
      const dateText = dateEl?.textContent?.trim() || "";
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
  parseChapterPages(document) {
    const pages = [];
    const images = document.querySelectorAll(".reading-content img, .page-break img");
    images.forEach((img, index) => {
      let imageUrl = img.getAttribute("data-src") || img.getAttribute("src") || img.getAttribute("data-lazy-src") || "";
      imageUrl = imageUrl.trim();
      if (!imageUrl || imageUrl.includes("loading") || imageUrl.includes("placeholder")) return;
      pages.push({
        index,
        imageUrl,
        width: parseInt(img.getAttribute("width") || "0", 10) || void 0,
        height: parseInt(img.getAttribute("height") || "0", 10) || void 0
      });
    });
    return pages;
  }
};

export { ManhuaFastSource as default };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map