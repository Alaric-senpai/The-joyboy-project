# @joyboy-parser/source-manhuafast

Manhuafast source parser

## Installation

```bash
npm install @joyboy-parser/source-manhuafast
```

## Usage

```typescript

const source = new @joyboy-parser/source-manhuafast();

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

## additional
- generate integrity sha256

pnpm gen-hash


all downlaods links are to be made available via jsdeliver or github rawcontent




Additionally, this template generates a `source-meta.json` file containing registry-friendly metadata. Ensure you review and update the generated `source-meta.json` before submitting; you can validate it with `pnpm run validate-meta`.

## License

MIT
