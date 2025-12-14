import { BaseSource } from '@joyboy-parser/core';

// src/index.ts
var MangaDexSource = class extends BaseSource {
  getbyPage(searchLabel, pageNumber) {
    throw new Error("Method not implemented.");
  }
  id = "mangadex";
  name = "MangaDex";
  version = "1.0.0";
  baseUrl = "https://api.mangadex.org";
  icon = "https://mangadex.org/favicon.ico";
  description = "Official MangaDex API parser";
  languages = ["en"];
  supportsSearch = true;
  supportsTrending = false;
  supportsLatest = true;
  supportsFilters = true;
  supportsPopular = true;
  /**
   * Search for manga on MangaDex
   */
  async search(query, options) {
    const params = {
      title: query,
      limit: options?.limit || 20,
      offset: options?.page ? (options.page - 1) * (options.limit || 20) : 0,
      includes: ["cover_art", "author", "artist"],
      contentRating: ["safe", "suggestive"]
    };
    const response = await this.request(
      this.buildUrl("/manga", params)
    );
    return response.data.map((item) => this.parseManga(item));
  }
  /**
   * Get detailed manga information
   */
  async getMangaDetails(id) {
    const response = await this.request(
      this.buildUrl(`/manga/${id}`, {
        includes: ["cover_art", "author", "artist"]
      })
    );
    return this.parseManga(response.data);
  }
  /**
   * Get chapters for a manga
   */
  async getChapters(mangaId, offset = 0, limit = 100) {
    const allChapters = [];
    while (true) {
      const params = {
        manga: mangaId,
        translatedLanguage: ["en"],
        order: { chapter: "asc" },
        limit,
        offset,
        includes: ["scanlation_group"],
        contentRating: ["safe", "suggestive", "erotica", "pornographic"]
      };
      const response = await this.request(this.buildUrl("/chapter", params));
      allChapters.push(...response.data.map((item) => this.parseChapter(item)));
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
  async getChapterPages(chapterId) {
    const chapterResponse = await this.request(
      this.buildUrl(`/chapter/${chapterId}`, {
        includes: ["scanlation_group"]
      })
    );
    if (chapterResponse.data.attributes.externalUrl) {
      throw this.createError(
        "NOT_FOUND",
        `Chapter is hosted externally at: ${chapterResponse.data.attributes.externalUrl}. Please visit the external site to read this chapter.`,
        void 0,
        {
          externalUrl: chapterResponse.data.attributes.externalUrl,
          isExternal: true
        }
      );
    }
    const response = await this.request(
      this.buildUrl(`/at-home/server/${chapterId}`)
    );
    const { baseUrl, chapter } = response;
    return chapter.data.map((filename, index) => ({
      index,
      imageUrl: `${baseUrl}/data/${chapter.hash}/${filename}`,
      headers: {
        Referer: "https://mangadex.org/"
      }
    }));
  }
  /**
   * Get latest manga updates
   */
  async getLatest(options) {
    const params = {
      limit: options?.limit || 20,
      offset: options?.page ? (options.page - 1) * (options.limit || 20) : 0,
      includes: ["cover_art", "author", "artist"],
      order: { createdAt: "desc" },
      contentRating: ["safe", "suggestive"]
    };
    const response = await this.request(
      this.buildUrl("/manga", params)
    );
    return response.data.map((item) => this.parseManga(item));
  }
  /**
   * Get popular manga
   */
  async getPopular(options) {
    const params = {
      limit: options?.limit || 20,
      offset: options?.page ? (options.page - 1) * (options.limit || 20) : 0,
      includes: ["cover_art", "author", "artist"],
      order: { followedCount: "desc" },
      contentRating: ["safe", "suggestive"]
    };
    const response = await this.request(
      this.buildUrl("/manga", params)
    );
    return response.data.map((item) => this.parseManga(item));
  }
  /**
   * Parse MangaDex manga data into standard format
   */
  parseManga(data) {
    const title = data.attributes.title.en || Object.values(data.attributes.title)[0] || "Unknown";
    const description = data.attributes.description?.en || (data.attributes.description ? Object.values(data.attributes.description)[0] : "");
    const coverArt = data.relationships.find((r) => r.type === "cover_art");
    const coverUrl = coverArt?.attributes?.fileName ? `https://uploads.mangadex.org/covers/${data.id}/${coverArt.attributes.fileName}` : void 0;
    const author = data.relationships.find((r) => r.type === "author")?.attributes?.name;
    const artist = data.relationships.find((r) => r.type === "artist")?.attributes?.name;
    const genres = data.attributes.tags?.map(
      (tag) => tag.attributes.name.en || Object.values(tag.attributes.name)[0]
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
   * Get manga by page number for a search term
   */
  async getByPage(searchLabel, pageNumber) {
    return this.search(searchLabel, { page: pageNumber });
  }
  /**
   * List all manga with optional filters
   */
  async listAll(options) {
    const params = {
      limit: options?.limit || 20,
      offset: options?.page ? (options.page - 1) * (options.limit || 20) : 0,
      includes: ["cover_art", "author", "artist"],
      contentRating: ["safe", "suggestive"]
    };
    const response = await this.request(
      this.buildUrl("/manga", params)
    );
    return response.data.map((item) => this.parseManga(item));
  }
  /**
   * Extract pagination information from API response
   */
  async extractPaginationInfo(url) {
    try {
      const response = await this.request(url);
      const totalPages = Math.ceil(response.total / response.limit);
      return {
        totalPages
      };
    } catch (error) {
      return { totalPages: 1 };
    }
  }
  // listGenres(){
  // }
  listGenres() {
    throw new Error("not implemented");
  }
  /**
   * Parse MangaDex chapter data
   */
  parseChapter(data) {
    const scanlator = data.relationships.find((r) => r.type === "scanlation_group")?.attributes?.name;
    const chapterNum = data.attributes.chapter ? parseFloat(data.attributes.chapter) : void 0;
    const volumeNum = data.attributes.volume ? parseInt(data.attributes.volume) : void 0;
    return {
      id: data.id,
      title: data.attributes.title || `Chapter ${chapterNum || "?"}`,
      number: chapterNum,
      volume: volumeNum,
      date: data.attributes.publishAt,
      pages: data.attributes.pages,
      scanlator,
      language: data.attributes.translatedLanguage,
      url: `https://mangadex.org/chapter/${data.id}`,
      externalUrl: data.attributes.externalUrl
    };
  }
  /**
   * Parse status string to standard format
   */
  parseStatus(status) {
    switch (status?.toLowerCase()) {
      case "ongoing":
        return "ongoing";
      case "completed":
        return "completed";
      case "hiatus":
        return "hiatus";
      case "cancelled":
        return "cancelled";
      default:
        return "unknown";
    }
  }
  /**
   * Parse content rating
   */
  parseRating(rating) {
    switch (rating?.toLowerCase()) {
      case "safe":
        return "safe";
      case "suggestive":
        return "suggestive";
      case "erotica":
        return "erotica";
      case "pornographic":
        return "pornographic";
      default:
        return "safe";
    }
  }
};

export { MangaDexSource as default };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map