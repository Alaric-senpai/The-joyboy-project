# @joyboy-parser/source-mangafire

A parser for the mangafire website

## Installation

```bash
npm install @joyboy-parser/source-mangafire
```

## Usage

```typescript
import { JoyBoy } from '@joyboy-parser/core';

await JoyBoy.loadSource('@joyboy-parser/source-mangafire');
const source = JoyBoy.getSource('mangafire');

const results = await source.search('query');
const manga = await source.getMangaDetails(results[0].id);
const chapters = await source.getChapters(manga.id);
const pages = await source.getChapterPages(chapters[0].id);
```

## Development

1. Implement the parser methods in `src/index.ts`
2. Test: `pnpm test`
3. Build: `pnpm build`

## License

MIT
