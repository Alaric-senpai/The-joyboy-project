# 

<div align="center">

<img src="banner.png" />

----

# 🏴‍☠️ The JoyBoy Project

### *The Ultimate Modular Parser Ecosystem for Manga, Manhwa & Webtoons*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

**Cross-Platform** • **Type-Safe** • **Extensible** • **Production-Ready**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Contributing](#-contributing)

---

</div>

## 📖 Table of Contents

- [Overview](#-overview)
- [Why JoyBoy?](#-why-joyboy)
- [Features](#-features)
- [Architecture](#-architecture)
- [Packages](#-packages)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage Examples](#-usage-examples)
- [Creating Custom Parsers](#-creating-custom-parsers)
- [Source Registry](#-source-registry)
- [Platform Support](#-platform-support)
- [API Reference](#-api-reference)
- [Available Sources](#-available-sources)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Community](#-community)
- [License](#-license)

---

## 🌟 Overview

**JoyBoy** is a modern, TypeScript-first parser ecosystem inspired by [Kotatsu's](https://github.com/KotatsuApp/Kotatsu) extension architecture. It provides a unified, modular framework for fetching manga, manhwa, and webtoon content from various sources across the web.

Built for developers who need:
- 🎯 **Consistency**: Unified API across all sources
- 🔒 **Type Safety**: Full TypeScript support with strict typing
- 🌐 **Cross-Platform**: Works in Node.js, browsers, and React Native
- 🔌 **Extensibility**: Easy-to-create parser plugins
- ⚡ **Performance**: Tree-shakeable ESM bundles with minimal overhead
- 🛡️ **Reliability**: Built-in retry logic, error handling, and caching

---

## 💡 Why JoyBoy?

### The Problem
Building manga/manhwa readers requires integrating multiple sources, each with:
- Different APIs and HTML structures
- Inconsistent data formats
- Varying error handling needs
- Platform-specific limitations

### The Solution
JoyBoy provides:
- ✅ **Standardized Interfaces**: All sources implement the same contract
- ✅ **Dynamic Loading**: Load parsers on-demand, reducing bundle size
- ✅ **Built-in Utilities**: Request management, caching, error handling
- ✅ **Source Registry**: Discover and manage available parsers
- ✅ **Developer-Friendly**: Simple API, comprehensive docs, great DX

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🏗️ **Architecture**
- Modular plugin system
- Dynamic source loading
- Singleton registry pattern
- Dependency injection ready
- Zero-config setup

</td>
<td width="50%">

### 🔧 **Developer Experience**
- Full TypeScript support
- Comprehensive type definitions
- Auto-generated documentation
- CLI scaffolding tools
- Hot module reloading

</td>
</tr>
<tr>
<td width="50%">

### 🌐 **Cross-Platform**
- Node.js 18+ support
- Browser compatibility
- React Native ready
- Edge runtime compatible
- Deno support (planned)

</td>
<td width="50%">

### ⚡ **Performance**
- Tree-shakeable bundles
- Lazy loading support
- Request caching
- Automatic retries
- Rate limiting

</td>
</tr>
<tr>
<td width="50%">

### 🔍 **Discovery**
- Source registry/catalog
- Searchable metadata
- Language filtering
- Tag-based organization
- Auto-discovery

</td>
<td width="50%">

### 🛡️ **Reliability**
- Structured error types
- Retry mechanisms
- Timeout handling
- CORS support
- Custom headers

</td>
</tr>
</table>

---

## 🏛️ Architecture

JoyBoy follows a layered architecture inspired by Kotatsu's extension system:

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                          │
│         (Node.js / Browser / React Native)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │   @joyboy/runtime     │
                │   Dynamic Loader      │
                └───────────┬───────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼────┐  ┌──────▼──────┐ ┌─────▼──────┐
    │ Source     │  │   Source    │ │  Source    │
    │ MangaDex   │  │ Mangakakalot│ │  Webtoon   │
    └───────┬────┘  └──────┬──────┘ └─────┬──────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
                ┌───────────▼────────────┐
                │   @joyboy/core         │
                │   BaseSource + Utils   │
                └───────────┬────────────┘
                            │
                ┌───────────▼────────────┐
                │   @joyboy/types        │
                │   Interfaces & Types   │
                └────────────────────────┘
```

### Component Responsibilities

| Component | Purpose | Dependencies |
|-----------|---------|--------------|
| **@joyboy/types** | Type definitions and interfaces | None |
| **@joyboy/core** | Base classes, utilities, runtime | types |
| **@joyboy/source-registry** | Source discovery and metadata | types |
| **@joyboy/source-*** | Parser implementations | core, types |
| **@joyboy/source-template** | Scaffolding for new parsers | - |

---

## 📦 Packages

### Core Packages

#### 🎯 [@joyboy/types](./packages/types)
Pure TypeScript definitions with zero runtime dependencies.

```typescript
import type { Manga, Chapter, Page, SourceInfo } from '@joyboy/types';
```

**Exports:**
- Entity types: `Manga`, `Chapter`, `Page`
- Source interfaces: `Source`, `SourceInfo`, `SourceCapabilities`
- Options: `SearchOptions`, `RequestOptions`
- Errors: `SourceError`, `ErrorType`

---

#### ⚙️ [@joyboy/core](./packages/core)
Core SDK with runtime, base classes, and utilities.

```typescript
import { JoyBoy, BaseSource } from '@joyboy/core';
```

**Exports:**
- `JoyBoy` - Main runtime class
- `BaseSource` - Abstract base class for parsers
- `SourceRegistry` - Parser registry
- `RequestManager` - HTTP utilities
- `CacheManager` - In-memory caching

**Size:** ~15KB minified (tree-shakeable)

---

#### 📚 [@joyboy/source-registry](./packages/source-registry)
Dynamic source catalog with search and filtering.

```typescript
import { getAllSources, searchSources } from '@joyboy/source-registry';
```

**Features:**
- Auto-discovery of installed sources
- Search by name, language, tags
- Filter by SFW/NSFW, language
- Rich metadata (icons, descriptions, install commands)

---

### Source Parsers

#### 📖 [@joyboy/source-mangadex](./packages/source-mangadex)
Official MangaDex API parser with full feature support.

**Features:**
- ✅ Search with filters
- ✅ Manga details
- ✅ Chapter lists
- ✅ Page fetching
- ✅ Latest updates
- ✅ Popular manga
- ✅ Multi-language support

**Languages:** English, Japanese, Spanish, French, German, Portuguese, Russian, Chinese

---

#### 🛠️ [@joyboy/source-template](./packages/source-template)
CLI tool for creating new parser packages.

```bash
npx @joyboy/source-template
```

Generates a complete parser project with:
- TypeScript configuration
- Build setup (tsup)
- Test framework (vitest)
- Pre-configured package.json
- README template

---

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install @joyboy/core @joyboy/source-mangadex

# Using pnpm
pnpm add @joyboy/core @joyboy/source-mangadex

# Using yarn
yarn add @joyboy/core @joyboy/source-mangadex
```

### Basic Usage

```typescript
import { JoyBoy } from '@joyboy/core';

// 1. Load a source parser
await JoyBoy.loadSource('@joyboy/source-mangadex');

// 2. Get the loaded source
const mangadex = JoyBoy.getSource('mangadex');

// 3. Search for manga
const results = await mangadex.search('One Piece');
console.log(`Found ${results.length} results`);

// 4. Get manga details
const manga = await mangadex.getMangaDetails(results[0].id);
console.log(`Title: ${manga.title}`);
console.log(`Author: ${manga.author}`);
console.log(`Status: ${manga.status}`);

// 5. Get chapters
const chapters = await mangadex.getChapters(manga.id);
console.log(`Chapters: ${chapters.length}`);

// 6. Get chapter pages
const pages = await mangadex.getChapterPages(chapters[0].id);
console.log(`Pages: ${pages.length}`);

// 7. Display the first page
console.log(`First page URL: ${pages[0].imageUrl}`);
```

---

## 📚 Usage Examples

### Example 1: Node.js CLI Application

```typescript
import { JoyBoy } from '@joyboy/core';
import MangaDexSource from '@joyboy/source-mangadex';

async function main() {
  // Load source directly with instance
  await JoyBoy.loadSource(new MangaDexSource());
  
  const source = JoyBoy.getSource('mangadex');
  
  // Search
  const results = await source.search('Naruto', {
    page: 1,
    limit: 10
  });
  
  results.forEach((manga, index) => {
    console.log(`${index + 1}. ${manga.title}`);
    console.log(`   Author: ${manga.author || 'Unknown'}`);
    console.log(`   Status: ${manga.status || 'Unknown'}`);
    console.log(`   URL: ${manga.url}`);
    console.log('');
  });
}

main().catch(console.error);
```

---

### Example 2: React Native Mobile App

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import { JoyBoy } from '@joyboy/core';

function MangaSearchScreen() {
  const [manga, setManga] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadManga() {
      try {
        // Load source
        await JoyBoy.loadSource('@joyboy/source-mangadex');
        const source = JoyBoy.getSource('mangadex');
        
        // Search
        const results = await source.search('One Piece');
        setManga(results);
      } catch (error) {
        console.error('Error loading manga:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadManga();
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <FlatList
      data={manga}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Image 
            source={{ uri: item.coverUrl }} 
            style={styles.cover}
            resizeMode="cover"
          />
          <View style={styles.info}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cover: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    color: '#999',
  },
});

export default MangaSearchScreen;
```

---

### Example 3: Next.js Web Application

```typescript
// app/manga/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { JoyBoy } from '@joyboy/core';
import type { Manga } from '@joyboy/types';

export default function MangaPage() {
  const [manga, setManga] = useState<Manga[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load source on mount
    JoyBoy.loadSource('@joyboy/source-mangadex');
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const source = JoyBoy.getSource('mangadex');
      const results = await source.search(query);
      setManga(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Manga Search</h1>
      
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search manga..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {manga.map((item) => (
          <div key={item.id} className="border rounded-lg overflow-hidden shadow-lg">
            <img 
              src={item.coverUrl} 
              alt={item.title}
              className="w-full h-64 object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 truncate">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.author}</p>
              <p className="text-xs text-gray-500 mt-2">{item.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Example 4: Multi-Source Search

```typescript
import { JoyBoy } from '@joyboy/core';
import { getAllSources } from '@joyboy/source-registry';

async function searchAllSources(query: string) {
  // Load all available sources
  const allSources = getAllSources();
  
  for (const sourceInfo of allSources) {
    await JoyBoy.loadSource(sourceInfo.packageName);
  }
  
  // Search across all sources
  const results = await JoyBoy.searchAll(query);
  
  // Display results grouped by source
  for (const [sourceId, items] of results.entries()) {
    console.log(`\n📚 ${sourceId}: ${items.length} results`);
    
    items.slice(0, 3).forEach(manga => {
      console.log(`  • ${manga.title}`);
    });
  }
}

searchAllSources('One Piece');
```

---

## 🔨 Creating Custom Parsers

### Method 1: Using the CLI Template

```bash
# Run the interactive generator
npx @joyboy/source-template

# Follow the prompts:
# • Source name: MangaKakalot
# • Base URL: https://mangakakalot.com
# • Description: MangaKakalot parser
```

This generates a complete project structure:
```
source-mangakakalot/
├── src/
│   └── index.ts          # Parser implementation
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

---

### Method 2: Manual Implementation

```typescript
import { BaseSource } from '@joyboy/core';
import type { Manga, Chapter, Page, SearchOptions } from '@joyboy/types';

export default class MyParserSource extends BaseSource {
  // Required metadata
  id = 'myparser';
  name = 'My Parser';
  version = '1.0.0';
  baseUrl = 'https://example.com';
  
  // Optional metadata
  icon = 'https://example.com/favicon.ico';
  description = 'Custom parser for example.com';
  languages = ['en'];
  isNsfw = false;
  
  // Capabilities
  supportsSearch = true;
  supportsTrending = false;
  supportsLatest = true;
  supportsFilters = false;

  /**
   * Search for manga
   */
  async search(query: string, options?: SearchOptions): Promise<Manga[]> {
    // Build URL with query parameters
    const url = this.buildUrl('/search', { 
      q: query,
      page: options?.page || 1
    });
    
    // Fetch HTML content
    const html = await this.fetchHtml(url);
    
    // Parse HTML and extract manga data
    return this.parseSearchResults(html);
  }

  /**
   * Get manga details
   */
  async getMangaDetails(id: string): Promise<Manga> {
    const url = `${this.baseUrl}/manga/${id}`;
    const html = await this.fetchHtml(url);
    
    return this.parseMangaDetails(html, id);
  }

  /**
   * Get chapters for a manga
   */
  async getChapters(mangaId: string): Promise<Chapter[]> {
    const url = `${this.baseUrl}/manga/${mangaId}`;
    const html = await this.fetchHtml(url);
    
    return this.parseChapterList(html);
  }

  /**
   * Get pages for a chapter
   */
  async getChapterPages(chapterId: string): Promise<Page[]> {
    const url = `${this.baseUrl}/chapter/${chapterId}`;
    const html = await this.fetchHtml(url);
    
    return this.parsePageList(html);
  }

  /**
   * Parse search results from HTML
   */
  private parseSearchResults(html: string): Manga[] {
    const manga: Manga[] = [];
    
    // Example: Extract manga from HTML
    // Use regex, DOM parser, or libraries like cheerio
    
    // Simple regex example (use proper HTML parser in production)
    const mangaRegex = /<div class="manga-item">(.*?)<\/div>/gs;
    const matches = html.matchAll(mangaRegex);
    
    for (const match of matches) {
      const content = match[1];
      
      // Extract data
      const id = this.extractId(content);
      const title = this.extractTitle(content);
      const coverUrl = this.extractCoverUrl(content);
      
      manga.push({
        id,
        title,
        coverUrl,
        sourceId: this.id,
        url: `${this.baseUrl}/manga/${id}`
      });
    }
    
    return manga;
  }

  /**
   * Parse manga details
   */
  private parseMangaDetails(html: string, id: string): Manga {
    return {
      id,
      title: this.extractTitle(html),
      altTitles: this.extractAltTitles(html),
      coverUrl: this.extractCoverUrl(html),
      author: this.extractAuthor(html),
      artist: this.extractArtist(html),
      genres: this.extractGenres(html),
      description: this.extractDescription(html),
      status: this.extractStatus(html),
      sourceId: this.id,
      url: `${this.baseUrl}/manga/${id}`
    };
  }

  /**
   * Parse chapter list
   */
  private parseChapterList(html: string): Chapter[] {
    const chapters: Chapter[] = [];
    
    // Extract chapters from HTML
    // Implementation details...
    
    return chapters;
  }

  /**
   * Parse page list
   */
  private parsePageList(html: string): Page[] {
    const pages: Page[] = [];
    
    // Extract image URLs from HTML
    // Implementation details...
    
    return pages;
  }

  // Helper methods for extraction
  private extractId(html: string): string {
    // Implementation...
    return '';
  }

  private extractTitle(html: string): string {
    // Implementation...
    return '';
  }

  private extractCoverUrl(html: string): string | undefined {
    // Implementation...
    return undefined;
  }

  private extractAuthor(html: string): string | undefined {
    // Implementation...
    return undefined;
  }

  private extractArtist(html: string): string | undefined {
    // Implementation...
    return undefined;
  }

  private extractGenres(html: string): string[] {
    // Implementation...
    return [];
  }

  private extractDescription(html: string): string | undefined {
    // Implementation...
    return undefined;
  }

  private extractStatus(html: string): Manga['status'] {
    // Implementation...
    return 'unknown';
  }

  private extractAltTitles(html: string): string[] {
    // Implementation...
    return [];
  }
}
```

---

### Best Practices for Parser Development

1. **Error Handling**: Use `createError()` for consistent error reporting
2. **Rate Limiting**: Respect source's rate limits
3. **Caching**: Utilize built-in cache for repeated requests
4. **Headers**: Set appropriate referer and user-agent headers
5. **Testing**: Write tests for all methods
6. **Documentation**: Add JSDoc comments for public methods

---

## 📋 Source Registry

The source registry provides a centralized catalog of all available parsers.

### Using the Registry

```typescript
import { 
  getAllSources, 
  getSourceById,
  searchSources,
  sourceCatalog 
} from '@joyboy/source-registry';
import { JoyBoy } from '@joyboy/core';

// Get all available sources
const allSources = getAllSources();
console.log(`Total sources: ${allSources.length}`);

// Get a specific source
const mangadex = getSourceById('mangadex');
console.log(mangadex?.name); // "MangaDex"

// Search sources
const mangaSources = searchSources('manga');
console.log(`Found ${mangaSources.length} manga sources`);

// Filter by language
const englishSources = sourceCatalog.getSourcesByLanguage('en');

// Get only SFW sources
const sfwSources = sourceCatalog.getSFWSources();

// Get official sources
const officialSources = sourceCatalog.getOfficialSources();

// Load all sources
for (const source of allSources) {
  await JoyBoy.loadSource(source.packageName);
}
```

### Registry Entry Format

```typescript
interface RegistryEntry {
  id: string;                    // 'mangadex'
  name: string;                  // 'MangaDex'
  version: string;               // '1.0.0'
  baseUrl: string;               // 'https://api.mangadex.org'
  packageName: string;           // '@joyboy/source-mangadex'
  icon?: string;                 // Icon URL
  description?: string;          // Description
  languages?: string[];          // ['en', 'ja', ...]
  isNsfw?: boolean;              // Content rating
  official?: boolean;            // Official/community parser
  tags?: string[];               // ['manga', 'api', ...]
  repository?: string;           // GitHub URL
  installCommand?: string;       // 'npm install ...'
  lastUpdated?: string;          // ISO timestamp
}
```

### Updating the Registry

```bash
# Automatically scan and update sources.json
cd packages/source-registry
pnpm update-registry
```

This scans all `source-*` packages in the workspace and updates the registry.

---

## 🌐 Platform Support

### Node.js

Full support for Node.js 18+.

```typescript
import { JoyBoy } from '@joyboy/core';

// Works out of the box
await JoyBoy.loadSource('@joyboy/source-mangadex');
```

**Requirements:**
- Node.js >= 18.0.0 (native fetch API)
- ESM support (`"type": "module"` in package.json)

---

### Browser

Compatible with all modern browsers.

```typescript
// Using a bundler (Vite, Webpack, Rollup)
import { JoyBoy } from '@joyboy/core';

await JoyBoy.loadSource('@joyboy/source-mangadex');
```

**Considerations:**
- CORS: Some sources may require proxy
- Bundle size: Use dynamic imports for code splitting
- Storage: Use IndexedDB for caching (not implemented yet)

---

### React Native

Full support with native fetch API.

```typescript
import { JoyBoy } from '@joyboy/core';

// Works in React Native
await JoyBoy.loadSource('@joyboy/source-mangadex');
```

**Requirements:**
- React Native >= 0.60 (includes fetch)
- For older versions, polyfill fetch with `whatwg-fetch`

**Example:**
```typescript
// Metro configuration
module.exports = {
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
  },
};
```

---

## 📖 API Reference

### JoyBoy Runtime

#### `JoyBoy.loadSource(source)`
Load a source parser dynamically.

```typescript
// From package name
await JoyBoy.loadSource('@joyboy/source-mangadex');

// From instance
await JoyBoy.loadSource(new MangaDexSource());

// From lazy loader
await JoyBoy.loadSource(() => import('@joyboy/source-mangadex'));
```

---

#### `JoyBoy.getSource(id)`
Get a loaded source by ID.

```typescript
const mangadex = JoyBoy.getSource('mangadex');
```

**Throws:** Error if source is not loaded.

---

#### `JoyBoy.listSources()`
Get all loaded sources.

```typescript
const sources = JoyBoy.listSources();
sources.forEach(source => {
  console.log(`${source.name} (${source.id})`);
});
```

---

#### `JoyBoy.hasSource(id)`
Check if a source is loaded.

```typescript
if (JoyBoy.hasSource('mangadex')) {
  // Source is loaded
}
```

---

#### `JoyBoy.unloadSource(id)`
Unload a specific source.

```typescript
JoyBoy.unloadSource('mangadex');
```

---

#### `JoyBoy.clearSources()`
Unload all sources.

```typescript
JoyBoy.clearSources();
```

---

#### `JoyBoy.searchAll(query, sourceIds?)`
Search across multiple sources.

```typescript
// Search all loaded sources
const results = await JoyBoy.searchAll('One Piece');

// Search specific sources
const results = await JoyBoy.searchAll('One Piece', ['mangadex', 'mangakakalot']);

// Results is a Map<string, Manga[]>
for (const [sourceId, items] of results) {
  console.log(`${sourceId}: ${items.length} results`);
}
```

---

### Source Interface

All parsers implement the `Source` interface:

#### `source.search(query, options?)`
Search for manga.

```typescript
const results = await source.search('One Piece', {
  page: 1,
  limit: 20,
  includedGenres: ['action', 'adventure'],
  excludedGenres: ['horror'],
  status: 'ongoing',
  sort: 'popular'
});
```

---

#### `source.getMangaDetails(id)`
Get detailed manga information.

```typescript
const manga = await source.getMangaDetails('manga-id');
```

---

#### `source.getChapters(mangaId)`
Get all chapters for a manga.

```typescript
const chapters = await source.getChapters('manga-id');
```

---

#### `source.getChapterPages(chapterId)`
Get all pages for a chapter.

```typescript
const pages = await source.getChapterPages('chapter-id');
```

---

#### `source.getTrending(options?)` *(Optional)*
Get trending manga.

```typescript
if (source.getTrending) {
  const trending = await source.getTrending({ limit: 20 });
}
```

---

#### `source.getLatest(options?)` *(Optional)*
Get latest updates.

```typescript
if (source.getLatest) {