# @joyboy-parser/source-manhuafast

Complete parser for ManhuaFast.net - a WordPress-based manga/manhwa/manhua site.

## Features

✅ Full-text search
✅ Manga details (title, author, description, genres, status)
✅ Chapter listing
✅ Page/image extraction
✅ Popular manga
✅ Latest updates

## Installation

```bash
npm install @joyboy-parser/source-manhuafast
# or
pnpm add @joyboy-parser/source-manhuafast
```

## Usage

### Standalone

```typescript
import ManhuaFastSource from '@joyboy-parser/source-manhuafast';

const source = new ManhuaFastSource();

// Search for manga
const results = await source.search('solo leveling');
console.log(results[0].title);

// Get manga details
const manga = await source.getMangaDetails(results[0].id);
console.log(manga.author, manga.status);

// Get chapters
const chapters = await source.getChapters(manga.id);
console.log(`${chapters.length} chapters available`);

// Get pages for a chapter
const pages = await source.getChapterPages(chapters[0].id);
console.log(`Chapter has ${pages.length} pages`);

// Download an image
const firstPage = pages[0];
// Use firstPage.imageUrl with firstPage.headers
```

### With JoyBoy Core

```typescript
import { JoyBoy } from '@joyboy-parser/core';
import ManhuaFastSource from '@joyboy-parser/source-manhuafast';

// Register the source
JoyBoy.registerSource(new ManhuaFastSource());

// Use it
const source = JoyBoy.getSource('manhuafast');
const results = await source.search('martial peak');
```

## Supported Features

| Feature | Supported |
|---------|-----------|
| Search | ✅ |
| Manga Details | ✅ |
| Chapters | ✅ |
| Pages | ✅ |
| Popular | ✅ |
| Latest | ✅ |
| Filters | ❌ |
| Trending | ❌ |

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run demo
pnpm tsx src/demo.ts

# Test
pnpm test
```

## API

### Methods

#### `search(query: string, options?: SearchOptions): Promise<Manga[]>`
Search for manga by title.

#### `getMangaDetails(id: string): Promise<Manga>`
Get detailed information about a manga. The `id` is the manga's slug (URL path).

#### `getChapters(mangaId: string): Promise<Chapter[]>`
Get all chapters for a manga, ordered chronologically.

#### `getChapterPages(chapterId: string): Promise<Page[]>`
Get all pages/images for a chapter. The `chapterId` is the full chapter URL.

#### `getPopular(options?: SearchOptions): Promise<Manga[]>`
Get popular manga sorted by views.

#### `getLatest(options?: SearchOptions): Promise<Manga[]>`
Get recently updated manga.

## Technical Details

- **Website**: manhuafast.net
- **Type**: WordPress with MangaStream/Madara theme
- **HTML Parser**: linkedom (compatible with Node.js, Browser, and React Native)
- **Image Loading**: Lazy-loaded with `data-src` attributes
- **Chapter URL Format**: Full URL required (not just slug)

## Notes

- ManhuaFast uses a WordPress-based manga theme (similar to MangaStream/Madara)
- Images are lazy-loaded, so the parser checks both `data-src` and `src` attributes
- The `id` for manga is the URL slug (e.g., "solo-leveling")
- Chapter IDs are full URLs for compatibility
- All images require the `Referer` header set to the base URL

## License

MIT
