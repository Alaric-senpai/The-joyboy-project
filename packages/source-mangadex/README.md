
# @joyboy/source-mangadex

MangaDex parser for the JoyBoy ecosystem.

## Installation

```bash
npm install @joyboy/source-mangadex
```

## Features

- ✅ Search with filters
- ✅ Manga details
- ✅ Chapter lists
- ✅ Page fetching
- ✅ Latest updates
- ✅ Popular manga
- ✅ Multi-language support (10+ languages)

## Usage

### With JoyBoy Runtime

```typescript
import { JoyBoy } from '@joyboy/core';

await JoyBoy.loadSource('@joyboy/source-mangadex');
const mangadex = JoyBoy.getSource('mangadex');

const results = await mangadex.search('One Piece');
```

### Direct Usage

```typescript
import MangaDexSource from '@joyboy/source-mangadex';

const mangadex = new MangaDexSource();
const results = await mangadex.search('Naruto');
```

## Supported Operations

```typescript
// Search
await mangadex.search('query', {
  page: 1,
  limit: 20,
  includedGenres: ['action'],
  status: 'ongoing'
});

// Get manga details
await mangadex.getMangaDetails('manga-id');

// Get chapters
await mangadex.getChapters('manga-id');

// Get pages
await mangadex.getChapterPages('chapter-id');

// Get latest
await mangadex.getLatest({ limit: 20 });

// Get popular
await mangadex.getPopular({ limit: 20 });
```

## Supported Languages

English, Japanese, Spanish, French, German, Portuguese, Russian, Chinese, Korean, Italian

## License

MIT