# @joyboy-parser/source-template

CLI tool and template for creating new JoyBoy source parsers. Quickly scaffold a new parser with all the boilerplate code.

## Installation

```bash
npm install -g @joyboy-parser/source-template
# or
pnpm add -g @joyboy-parser/source-template
# or
yarn global add @joyboy-parser/source-template
```

## Usage

### Interactive Mode

Run the CLI tool to create a new source parser:

```bash
npx @joyboy-parser/source-template
# or if installed globally
create-joyboy-source
```

You'll be prompted for:
- Source name (e.g., "MySource")
- Source ID (e.g., "my-source")
- Base URL (e.g., "https://example.com")
- Description
- Version
- Author

### Manual Creation

You can also use this as a template repository or copy the template files manually.

## Generated Structure

The CLI creates a new package with:

```
@joyboy-parser/source-{name}/
├── src/
│   └── index.ts          # Main parser implementation
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

## Example Output

```typescript
import { BaseSource } from '@joyboy-parser/core';
import type { Manga, Chapter, Page, SearchOptions } from '@joyboy-parser/types';

export default class MySource extends BaseSource {
  id = 'my-source';
  name = 'MySource';
  version = '1.0.0';
  baseUrl = 'https://example.com';
  
  supportsSearch = true;
  
  async search(query: string, options?: SearchOptions): Promise<Manga[]> {
    // TODO: Implement search
    throw new Error('Not implemented');
  }
  
  async getMangaDetails(id: string): Promise<Manga> {
    // TODO: Implement getMangaDetails
    throw new Error('Not implemented');
  }
  
  async getChapters(mangaId: string): Promise<Chapter[]> {
    // TODO: Implement getChapters
    throw new Error('Not implemented');
  }
  
  async getChapterPages(chapterId: string): Promise<Page[]> {
    // TODO: Implement getChapterPages
    throw new Error('Not implemented');
  }
}
```

## Next Steps

After generating your source:

1. Install dependencies:
   ```bash
   cd source-{name}
   pnpm install
   ```

2. Implement the parser methods in `src/index.ts`

3. Test your parser:
   ```typescript
   import { JoyBoy } from '@joyboy-parser/core';
   
   await JoyBoy.loadSource('./dist/index.js');
   const source = JoyBoy.getSource('my-source');
   ```

4. Build and publish:
   ```bash
   pnpm build
   npm publish
   ```

## Documentation

For guides on implementing parsers, see:
- [JoyBoy Documentation](https://github.com/Alaric-senpai/The-joyboy-project)
- [@joyboy-parser/core API Reference](https://github.com/Alaric-senpai/The-joyboy-project/tree/main/packages/core)
- [Example Sources](https://github.com/Alaric-senpai/The-joyboy-project/tree/main/packages)

## License

MIT
