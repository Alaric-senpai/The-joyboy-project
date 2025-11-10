/*
# @joyboy/source-mangadex

MangaDex parser for the JoyBoy ecosystem.

## Installation

```bash
npm install @joyboy/source-mangadex
# or
pnpm add @joyboy/source-mangadex
# or
yarn add @joyboy/source-mangadex
```

## Usage

### With JoyBoy Runtime

```typescript
import { JoyBoy } from '@joyboy/core';

// Load the source
await JoyBoy.loadSource('@joyboy/source-mangadex');

// Get the source
const mangadex = JoyBoy.getSource('mangadex');

// Search
const results = await mangadex.search('One Piece');

// Get manga details
const manga = await mangadex.getMangaDetails(results[0].id);

// Get chapters
const chapters = await mangadex.getChapters(manga.id);

// Get chapter pages
const pages = await mangadex.getChapterPages(chapters[0].id);
```

### Direct Usage

```typescript
import MangaDexSource from '@joyboy/source-mangadex';

const mangadex = new MangaDexSource();

const results = await mangadex.search('Naruto');
console.log(results);
```

## Features

- ✅ Search manga
- ✅ Get manga details
- ✅ Get chapters
- ✅ Get chapter pages
- ✅ Get latest updates
- ✅ Get popular manga
- ✅ Filter by genre
- ✅ Filter by status

## API

See the [JoyBoy documentation](https://github.com/yourusername/joyboy) for full API details.

## License

MIT
*/
