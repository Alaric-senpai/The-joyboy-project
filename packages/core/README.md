
# @joyboy/core

Core SDK and runtime for the JoyBoy parser ecosystem.

## Installation

```bash
npm install @joyboy/core @joyboy/types
```

## Features

- 🔌 Dynamic parser loading (static, dynamic, remote)
- 🔍 Type-safe interfaces  
- 🌐 Cross-platform (Node.js, Browser, React Native)
- 🔄 Built-in retry and error handling
- 💾 Optional caching layer
- 📦 Tree-shakeable ESM bundles

## Quick Start

```typescript
import { JoyBoy } from '@joyboy/core';

// Load a parser
await JoyBoy.loadSource('@joyboy/source-mangadex');

// Get the loaded source
const mangadex = JoyBoy.getSource('mangadex');

// Search for manga
const results = await mangadex.search('One Piece');
```

## API Reference

### JoyBoy Runtime

#### `JoyBoy.loadSource(source)`

Load a source parser dynamically.

```typescript
// From package name
await JoyBoy.loadSource('@joyboy/source-mangadex');

// From instance
import MangaDexSource from '@joyboy/source-mangadex';
await JoyBoy.loadSource(new MangaDexSource());

// From lazy loader
await JoyBoy.loadSource(() => import('@joyboy/source-mangadex'));
```

#### `JoyBoy.getSource(id)`

Get a loaded source by ID.

```typescript
const mangadex = JoyBoy.getSource('mangadex');
```

#### `JoyBoy.listSources()`

Get all loaded sources.

```typescript
const sources = JoyBoy.listSources();
```

#### `JoyBoy.searchAll(query, sourceIds?)`

Search across multiple sources.

```typescript
const results = await JoyBoy.searchAll('One Piece');
// Returns Map<string, Manga[]>
```

### BaseSource

Abstract base class for creating parsers.

```typescript
import { BaseSource } from '@joyboy/core';
import type { Manga, Chapter, Page } from '@joyboy/types';

export default class MySource extends BaseSource {
  id = 'mysource';
  name = 'My Source';
  version = '1.0.0';
  baseUrl = 'https://example.com';

  async getMangaDetails(id: string): Promise<Manga> {
    // Implementation
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    // Implementation
  }

  async getChapterPages(chapterId: string): Promise<Page[]> {
    // Implementation
  }
}
```

### Utilities

#### RequestManager

```typescript
protected async request<T>(url: string, options?: RequestOptions): Promise<T>
protected async fetchHtml(url: string, options?: RequestOptions): Promise<string>
```

#### Error Handling

```typescript
import { isSourceError, formatError } from '@joyboy/core';

try {
  await source.search('query');
} catch (error) {
  if (isSourceError(error)) {
    console.error(formatError(error));
  }
}
```

## Creating a Custom Parser

See [Creating Custom Parsers](../../docs/creating-parsers.md) for detailed guide.

## License

MIT

#