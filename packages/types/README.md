
# @joyboy-parser/types

TypeScript type definitions for the JoyBoy parser ecosystem.

## Installation

```bash
npm install @joyboy-parser/types
```

## Types

### Entity Types

```typescript
import type { Manga, Chapter, Page } from '@joyboy-parser/types';
```

#### Manga

```typescript
interface Manga {
  id: string;
  title: string;
  altTitles?: string[];
  coverUrl?: string;
  author?: string;
  artist?: string;
  genres?: string[];
  description?: string;
  status?: MangaStatus;
  sourceId: string;
  url?: string;
  rating?: ContentRating;
  year?: number;
  metadata?: Record<string, any>;
}
```

#### Chapter

```typescript
interface Chapter {
  id: string;
  title: string;
  number?: number;
  volume?: number;
  date?: string;
  url?: string;
  pages?: number;
  scanlator?: string;
  language?: string;
}
```

#### Page

```typescript
interface Page {
  index: number;
  imageUrl: string;
  headers?: Record<string, string>;
  width?: number;
  height?: number;
}
```

### Source Types

```typescript
import type { Source, SourceInfo, SourceCapabilities } from '@joyboy-parser/types';
```

### Options

```typescript
import type { SearchOptions, RequestOptions } from '@joyboy-parser/types';
```

### Errors

```typescript
import { ErrorType, type SourceError } from '@joyboy-parser/types';
```

## License

MIT
