# @joyboy-parser/source-demo

descrit d

## Installation

```bash
npm install @joyboy-parser/source-demo
```

## Usage

```typescript
import { JoyBoy } from '@joyboy-parser/core';

await JoyBoy.loadSource('@joyboy-parser/source-demo');
const source = JoyBoy.getSource('demo');

const results = await source.search('query');
const manga = await source.getMangaDetails(results[0].id);
const chapters = await source.getChapters(manga.id);
const pages = await source.getChapterPages(chapters[0].id);
```

## Development

1. Implement the parser methods in `src/index.ts`
2. Test: `pnpm test`
3. Build: `pnpm build`

## Publishing / Registry

When publishing or submitting your source to a registry, make sure to include the compiled `dist` folder and its contents (JS files and type declarations). The registry expects the distributable files under the package's `dist` folder so they can be loaded by the runtime.

Additionally, this template generates a `source-meta.json` file containing registry-friendly metadata. Ensure you review and update the generated `source-meta.json` before submitting; you can validate it with `pnpm run validate-meta`.

## License

MIT
