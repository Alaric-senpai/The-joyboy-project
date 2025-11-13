# 🏴‍☠️ JoyBoy - Complete Offline Development Guide

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [File Creation Checklist](#file-creation-checklist)
3. [Data Flow & Architecture](#data-flow--architecture)
4. [Development Workflow](#development-workflow)
5. [Implementation Plan](#implementation-plan)
6. [Code Snippets Library](#code-snippets-library)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Guide](#deployment-guide)
9. [Troubleshooting](#troubleshooting)
10. [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview

### What is JoyBoy?

A **modular TypeScript parser ecosystem** for manga/manhwa/webtoon content, inspired by Kotatsu's Android app architecture.

### Core Principles

1. **Modularity** - Each source is an independent package
2. **Type Safety** - Strict TypeScript with comprehensive types
3. **Cross-Platform** - Node.js, Browser, React Native
4. **Dynamic Loading** - Load parsers at runtime
5. **Extensibility** - Easy to create new parsers

### Tech Stack

- **Language**: TypeScript 5.3
- **Runtime**: Node.js 18+, Browser, React Native
- **Build Tool**: tsup (powered by esbuild)
- **Monorepo**: pnpm workspaces + Turbo
- **Testing**: Vitest
- **Module Format**: ESM (ES Modules)

---

## 📝 File Creation Checklist

### Phase 1: Root Setup ✅

- [ ] `package.json` - Root package with workspaces
- [ ] `pnpm-workspace.yaml` - Define workspace packages
- [ ] `turbo.json` - Turbo build configuration
- [ ] `tsconfig.base.json` - Base TypeScript config
- [ ] `.gitignore` - Git ignore rules
- [ ] `README.md` - Main project documentation
- [ ] `CONTRIBUTING.md` - Contribution guidelines
- [ ] `LICENSE` - MIT License
- [ ] `assets/banner.svg` - Project banner

### Phase 2: Types Package ✅

```
packages/types/
├── src/
│   ├── entities.ts      ✅ Manga, Chapter, Page types
│   ├── source.ts        ✅ Source interfaces
│   ├── errors.ts        ✅ Error types
│   └── index.ts         ✅ Main export
├── package.json         ✅
├── tsconfig.json        ✅
└── tsup.config.ts       ✅
```

### Phase 3: Core Package ✅

```
packages/core/
├── src/
│   ├── utils/
│   │   ├── request.ts        ✅ HTTP request manager
│   │   ├── cache.ts          ✅ Caching utilities
│   │   └── errors.ts         ✅ Error utilities
│   ├── base-source.ts        ✅ Abstract base class
│   ├── registry.ts           ✅ Source registry
│   ├── runtime.ts            ✅ JoyBoy runtime
│   ├── remote-loader.ts      ✅ Dynamic loader
│   └── index.ts              ✅ Main export
├── package.json              ✅
├── tsconfig.json             ✅
├── tsup.config.ts            ✅
└── README.md                 ✅
```

### Phase 4: Source Registry Package ✅

```
packages/source-registry/
├── src/
│   ├── index.ts              ✅ Main catalog
│   └── remote-registry.ts    ✅ Remote sync
├── scripts/
│   └── update-registry.js    ✅ Auto-update script
├── sources.json              ✅ Source catalog
├── package.json              ✅
├── tsconfig.json             ✅
├── tsup.config.ts            ✅
└── README.md                 ✅
```

### Phase 5: MangaDex Source ✅

```
packages/source-mangadex/
├── src/
│   └── index.ts              ✅ MangaDex parser
├── package.json              ✅
├── tsconfig.json             ✅
├── tsup.config.ts            ✅
└── README.md                 ✅
```

### Phase 6: Source Template ✅

```
packages/source-template/
├── template/
│   └── src/
│       └── index.ts          ✅ Template source
├── scripts/
│   └── create.js             ✅ CLI generator
├── package.json              ✅
└── README.md                 ✅
```

---

## 🔄 Data Flow & Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────┐
│                 USER APPLICATION                │
│         (Mobile/Web/Desktop Client)             │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   @joyboy-parser/core        │
         │   - JoyBoy Runtime    │
         │   - Source Registry   │
         │   - Remote Loader     │
         └───────────┬───────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ Source  │ │ Source  │ │ Source  │
    │   A     │ │   B     │ │   C     │
    └────┬────┘ └────┬────┘ └────┬────┘
         │           │           │
         └───────────┼───────────┘
                     │
         ┌───────────▼───────────┐
         │   External Sources    │
         │   (APIs, Websites)    │
         └───────────────────────┘
```

### Detailed Request Flow

```
1. User Action
   └─> Search "One Piece"

2. JoyBoy Runtime
   └─> Get loaded source by ID
   └─> Call source.search("One Piece")

3. Source Parser (e.g., MangaDex)
   └─> Build API URL with query
   └─> Make HTTP request via RequestManager
   └─> Parse response JSON/HTML
   └─> Transform to standard Manga[] format
   └─> Return results

4. Application
   └─> Receive standardized Manga[] array
   └─> Display in UI

5. User Selects Manga
   └─> Call source.getMangaDetails(id)
   └─> Get chapters: source.getChapters(mangaId)
   └─> Get pages: source.getChapterPages(chapterId)
```

### Data Transformation Pipeline

```
External Source Data
        ↓
[Parser-Specific Format]
        ↓
   Parse & Extract
        ↓
[Standard JoyBoy Types]
        ↓
  Return to Runtime
        ↓
   User Application
```

### Source Loading Flow

```
Scenario 1: Static Import (Development)
─────────────────────────────────────
import MangaDexSource from '@joyboy-parser/source-mangadex'
         ↓
await JoyBoy.loadSource(new MangaDexSource())
         ↓
   Register in SourceRegistry
         ↓
   Ready to use

Scenario 2: Dynamic NPM Import (Production)
─────────────────────────────────────────────
await JoyBoy.loadSource('@joyboy-parser/source-mangadex')
         ↓
   Dynamic import() at runtime
         ↓
   Instantiate source class
         ↓
   Register in SourceRegistry
         ↓
   Ready to use

Scenario 3: Remote URL Loading (Mobile)
────────────────────────────────────────
1. Fetch sources.json from remote registry
2. User selects "MangaDex" from list
3. Fetch source code from CDN URL
4. Validate code structure & checksum
5. Load via RemoteSourceLoader
6. Cache locally for offline use
7. Register in SourceRegistry
8. Ready to use
```

---

## 🛠️ Development Workflow

### Initial Setup

```bash
# 1. Create project directory
mkdir joyboy && cd joyboy

# 2. Initialize git
git init

# 3. Create all files according to checklist

# 4. Install dependencies
pnpm install

# 5. Build all packages
pnpm build

# 6. Run tests
pnpm test
```

### Daily Development Workflow

```bash
# 1. Start development mode (watch mode)
pnpm dev

# 2. Work on specific package
cd packages/core
pnpm dev

# 3. Test as you develop
pnpm test

# 4. Lint code
pnpm lint

# 5. Build for production
pnpm build
```

### Creating a New Source

```bash
# Method 1: Using template CLI
npx @joyboy-parser/source-template

# Method 2: Manual
cd packages
mkdir source-myparser
cd source-myparser
# Copy structure from source-mangadex
# Implement parser methods
pnpm build
```

### Testing Workflow

```bash
# Test specific package
cd packages/source-mangadex
pnpm test

# Test all packages
pnpm test

# Test with coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

---

## 📊 Implementation Plan

### Week 1: Foundation

**Day 1-2: Project Setup**
- [ ] Create monorepo structure
- [ ] Set up build system (tsup, turbo)
- [ ] Configure TypeScript
- [ ] Set up git and .gitignore

**Day 3-4: Types Package**
- [ ] Define all TypeScript interfaces
- [ ] Document types with JSDoc
- [ ] Build and test

**Day 5-7: Core Package - Part 1**
- [ ] Implement BaseSource class
- [ ] Create RequestManager utility
- [ ] Build CacheManager
- [ ] Error handling utilities

### Week 2: Core Runtime

**Day 1-3: Core Package - Part 2**
- [ ] Implement SourceRegistry
- [ ] Build JoyBoy runtime
- [ ] Add validation logic
- [ ] Write unit tests

**Day 4-5: Remote Loading**
- [ ] Implement RemoteSourceLoader
- [ ] Add security validation
- [ ] Handle different platforms

**Day 6-7: Testing & Documentation**
- [ ] Write comprehensive tests
- [ ] Document API
- [ ] Create usage examples

### Week 3: Source Registry

**Day 1-3: Registry Package**
- [ ] Implement SourceCatalog
- [ ] Add search/filter methods
- [ ] Create RemoteRegistry
- [ ] Build update-registry script

**Day 4-5: First Parser**
- [ ] Implement MangaDex source
- [ ] Test all methods
- [ ] Handle edge cases

**Day 6-7: Template Generator**
- [ ] Create parser template
- [ ] Build CLI tool
- [ ] Test generation process

### Week 4: Polish & Deploy

**Day 1-2: Documentation**
- [ ] Write comprehensive README
- [ ] API documentation
- [ ] Create examples

**Day 3-4: Testing**
- [ ] Integration tests
- [ ] Cross-platform testing
- [ ] Performance testing

**Day 5-6: Deployment**
- [ ] Publish to NPM
- [ ] Set up CI/CD
- [ ] Create demo apps

**Day 7: Launch**
- [ ] Announce on social media
- [ ] Create demo video
- [ ] Write blog post

---

## 💻 Code Snippets Library

### Creating a Simple Parser

```typescript
// packages/source-myparser/src/index.ts
import { BaseSource } from '@joyboy-parser/core';
import type { Manga, Chapter, Page } from '@joyboy-parser/types';

export default class MyParserSource extends BaseSource {
  id = 'myparser';
  name = 'My Parser';
  version = '1.0.0';
  baseUrl = 'https://example.com';
  
  async getMangaDetails(id: string): Promise<Manga> {
    const url = `${this.baseUrl}/manga/${id}`;
    const html = await this.fetchHtml(url);
    
    // Parse HTML
    const titleMatch = html.match(/<h1 class="title">(.*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1] : 'Unknown';
    
    return {
      id,
      title,
      sourceId: this.id,
      url
    };
  }
  
  async getChapters(mangaId: string): Promise<Chapter[]> {
    const url = `${this.baseUrl}/manga/${mangaId}`;
    const html = await this.fetchHtml(url);
    
    // Parse chapters
    const chapters: Chapter[] = [];
    const regex = /<a href="\/chapter\/(.*?)">(.*?)<\/a>/g;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      chapters.push({
        id: match[1],
        title: match[2]
      });
    }
    
    return chapters;
  }
  
  async getChapterPages(chapterId: string): Promise<Page[]> {
    const url = `${this.baseUrl}/chapter/${chapterId}`;
    const html = await this.fetchHtml(url);
    
    // Parse pages
    const pages: Page[] = [];
    const regex = /<img src="(.*?)" data-page="(\d+)"/g;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      pages.push({
        index: parseInt(match[2]),
        imageUrl: match[1]
      });
    }
    
    return pages;
  }
}
```

### Using the Parser in Node.js

```typescript
// example.ts
import { JoyBoy } from '@joyboy-parser/core';
import MyParserSource from '@joyboy-parser/source-myparser';

async function main() {
  // Load source
  await JoyBoy.loadSource(new MyParserSource());
  
  // Get source
  const parser = JoyBoy.getSource('myparser');
  
  // Use it
  const manga = await parser.getMangaDetails('some-manga-id');
  console.log(manga.title);
  
  const chapters = await parser.getChapters(manga.id);
  console.log(`Found ${chapters.length} chapters`);
  
  const pages = await parser.getChapterPages(chapters[0].id);
  console.log(`Chapter has ${pages.length} pages`);
}

main();
```

### React Native Component

```typescript
// MangaReader.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { JoyBoy } from '@joyboy-parser/core';

export function MangaReader({ chapterId }: { chapterId: string }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChapter() {
      try {
        const source = JoyBoy.getSource('mangadex');
        const chapterPages = await source.getChapterPages(chapterId);
        setPages(chapterPages);
      } catch (error) {
        console.error('Failed to load chapter:', error);
      } finally {
        setLoading(false);
      }
    }
    loadChapter();
  }, [chapterId]);

  if (loading) return <Text>Loading...</Text>;

  return (
    <ScrollView>
      {pages.map((page) => (
        <Image
          key={page.index}
          source={{ uri: page.imageUrl }}
          style={{ width: '100%', height: 600 }}
          resizeMode="contain"
        />
      ))}
    </ScrollView>
  );
}
```

### Error Handling Pattern

```typescript
import { isSourceError, ErrorType } from '@joyboy-parser/core';

async function safeSearch(query: string) {
  try {
    const source = JoyBoy.getSource('mangadex');
    return await source.search(query);
  } catch (error) {
    if (isSourceError(error)) {
      switch (error.type) {
        case ErrorType.NETWORK:
          console.error('Network error, check connection');
          break;
        case ErrorType.RATE_LIMIT:
          console.error('Rate limited, try again later');
          break;
        case ErrorType.NOT_FOUND:
          console.error('Resource not found');
          break;
        default:
          console.error('Unknown error:', error.message);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    return [];
  }
}
```

### Caching Implementation

```typescript
import { CacheManager } from '@joyboy-parser/core';

const cache = new CacheManager();

async function getCachedManga(id: string) {
  // Check cache first
  const cached = cache.get(`manga:${id}`);
  if (cached) {
    return cached;
  }
  
  // Fetch if not cached
  const source = JoyBoy.getSource('mangadex');
  const manga = await source.getMangaDetails(id);
  
  // Cache for 1 hour
  cache.set(`manga:${id}`, manga, 60 * 60 * 1000);
  
  return manga;
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// packages/core/__tests__/base-source.test.ts
import { describe, it, expect } from 'vitest';
import { BaseSource } from '../src/base-source';
import type { Manga, Chapter, Page } from '@joyboy-parser/types';

class TestSource extends BaseSource {
  id = 'test';
  name = 'Test';
  version = '1.0.0';
  baseUrl = 'https://test.com';
  
  async getMangaDetails(id: string): Promise<Manga> {
    return {
      id,
      title: 'Test Manga',
      sourceId: this.id
    };
  }
  
  async getChapters(): Promise<Chapter[]> {
    return [];
  }
  
  async getChapterPages(): Promise<Page[]> {
    return [];
  }
}

describe('BaseSource', () => {
  it('should create source instance', () => {
    const source = new TestSource();
    expect(source.id).toBe('test');
    expect(source.name).toBe('Test');
  });
  
  it('should build URL with params', () => {
    const source = new TestSource();
    const url = source['buildUrl']('/search', { q: 'test', page: 1 });
    expect(url).toBe('https://test.com/search?q=test&page=1');
  });
  
  it('should handle errors properly', async () => {
    const source = new TestSource();
    const error = source['createError']('NETWORK', 'Test error');
    expect(error.type).toBe('NETWORK_ERROR');
    expect(error.sourceId).toBe('test');
  });
});
```

### Integration Tests

```typescript
// packages/source-mangadex/__tests__/integration.test.ts
import { describe, it, expect } from 'vitest';
import MangaDexSource from '../src';

describe('MangaDex Integration', () => {
  const source = new MangaDexSource();
  
  it('should search for manga', async () => {
    const results = await source.search('One Piece');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('title');
  });
  
  it('should get manga details', async () => {
    const results = await source.search('One Piece');
    const manga = await source.getMangaDetails(results[0].id);
    expect(manga.title).toBeTruthy();
    expect(manga.sourceId).toBe('mangadex');
  });
  
  it('should get chapters', async () => {
    const results = await source.search('One Piece');
    const chapters = await source.getChapters(results[0].id);
    expect(Array.isArray(chapters)).toBe(true);
  });
}, { timeout: 30000 }); // Longer timeout for API calls
```

### Testing Checklist

- [ ] Unit tests for all utilities
- [ ] Unit tests for BaseSource methods
- [ ] Integration tests for each parser
- [ ] Error handling tests
- [ ] Caching tests
- [ ] Cross-platform tests (Node, Browser, RN)
- [ ] Performance tests
- [ ] Load tests for concurrent requests

---

## 🚀 Deployment Guide

### Publishing to NPM

```bash
# 1. Update versions
pnpm changeset

# 2. Build all packages
pnpm build

# 3. Run tests
pnpm test

# 4. Publish
pnpm changeset publish

# 5. Push tags
git push --follow-tags
```

### NPM Package Structure

```json
{
  "name": "@joyboy-parser/core",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "README.md"
  ]
}
```

### CDN Setup

```bash
# Packages automatically available on:

# jsDelivr
https://cdn.jsdelivr.net/npm/@joyboy-parser/core@1.0.0/dist/index.js

# unpkg
https://unpkg.com/@joyboy-parser/core@1.0.0/dist/index.js
```

### GitHub Release

```bash
# 1. Tag version
git tag v1.0.0

# 2. Push tag
git push origin v1.0.0

# 3. Create release on GitHub
# - Add release notes
# - Attach build artifacts
# - Mark as latest
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue: "Module not found"**
```bash
# Solution: Rebuild packages
pnpm clean
pnpm build
```

**Issue: "Type errors in imports"**
```bash
# Solution: Ensure types are built
cd packages/types
pnpm build
```

**Issue: "CORS errors in browser"**
```typescript
// Solution: Use a proxy for development
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const url = `${proxyUrl}${actualUrl}`;
```

**Issue: "React Native can't resolve module"**
```javascript
// metro.config.js
module.exports = {
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
  },
};
```

### Debug Mode

```typescript
// Enable debug logging
process.env.JOYBOY_DEBUG = 'true';

// In code
if (process.env.JOYBOY_DEBUG) {
  console.log('Debug info:', data);
}
```

---

## 🔮 Future Enhancements

### Phase 2 Features

- [ ] **Persistent Caching**
  - IndexedDB for browser
  - AsyncStorage for React Native
  - File system for Node.js

- [ ] **Download Manager**
  - Queue system
  - Progress tracking
  - Resume capability
  - Batch downloads

- [ ] **Reading History**
  - Track read chapters
  - Continue reading
  - Reading statistics

- [ ] **Bookmark System**
  - Save favorites
  - Organize collections
  - Sync across devices

### Phase 3 Features

- [ ] **Advanced Search**
  - Fuzzy matching
  - Advanced filters
  - Search suggestions

- [ ] **Image Processing**
  - Image optimization
  - Lazy loading
  - Preloading

- [ ] **Offline Mode**
  - Download for offline
  - Smart sync
  - Storage management

### Phase 4 Features

- [ ] **Community Features**
  - User reviews
  - Ratings
  - Comments

- [ ] **Recommendations**
  - Similar manga
  - Personalized suggestions
  - Trending content

- [ ] **Analytics**
  - Usage statistics
  - Popular content
  - Performance metrics

---

## 📚 Reference Materials

### Key Concepts to Remember

1. **Every source extends BaseSource**
2. **All data types are in @joyboy-parser/types**
3. **JoyBoy runtime manages all sources**
4. **Registry provides source discovery**
5. **Remote loading enables dynamic updates**

### Mental Models

**Think of sources as plugins:**
- Each plugin is self-contained
- All plugins share the same interface
- Runtime loads and manages plugins
- Users can add/remove plugins dynamically

**Think of the registry as an app store:**
- Browse available parsers
- Install what you need
- Update when available
- Uninstall to save space

### Quick Commands Reference

```bash
# Development
pnpm dev                    # Watch all packages
pnpm build                  # Build all packages
pnpm test                   # Run all tests
pnpm lint                   # Lint code

# Package-specific
cd packages/core && pnpm dev
cd packages/core && pnpm build
cd packages/core && pnpm test

# Creating sources
npx @joyboy-parser/source-template  # Generate new parser
pnpm update-registry         # Update sources.json

# Publishing
pnpm changeset              # Create changeset
pnpm changeset version      # Bump versions
pnpm changeset publish      # Publish to NPM
```

### File Structure Quick Reference

```
joyboy/
├── packages/
│   ├── types/           → Pure TypeScript definitions
│   ├── core/            → Runtime + Base classes
│   ├── source-registry/ → Source catalog
│   ├── source-*/        → Parser implementations
│   └── source-template/ → Parser generator
├── docs/                → Documentation
├── examples/            → Example apps
└── scripts/             → Build scripts
```

---

## ✅ Final Checklist Before Going Offline

- [ ] All files created according to structure
- [ ] Dependencies installed (`pnpm install`)
- [ ] All packages build successfully (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Types are correct (no TypeScript errors)
- [ ] Documentation is complete
- [ ] Examples work
- [ ] Git repository initialized
- [ ] This guide saved for reference

---

## 🎯 Daily Development Routine

**Morning:**
1. Pull latest changes (if working with team)
2. Run `pnpm build` to ensure everything works
3. Review implementation plan for the day

**During Development:**
1. Work in `pnpm dev` mode for hot reload
2. Write tests alongside features
3. Update documentation as you code

**Before Committing:**
1. Run `pnpm build` to ensure no build errors
2. Run `pnpm test` to ensure tests pass
3. Run `pnpm lint` to check code style
4. Update CHANGELOG if needed

---

## 💡 Tips & Best Practices

1. **Start Simple**: Get one parser working first, then expand
2. **Test Early**: Write tests as you develop features
3. **Document Often**: Add JSDoc comments while code is fresh
4. **Commit Frequently**: Small, focused commits are better
5. **Use Examples**: Test your changes with real usage examples
6. **Handle Errors**: Always wrap network calls in try-catch
7. **Think Cross-Platform**: Test on Node, browser, and RN
8. **Cache Wisely**: Cache expensive operations, not everything
9. **Version Carefully**: Follow semantic versioning
10. **Ask for Help**: Open issues, join communities

---

## 🎓 Learning Resources

### TypeScript
- Official Docs: https://www.typescriptlang.org/docs/
- TypeScript Deep Dive: https://basarat.gitbook.io/typescript/

### Monorepos
- Turborepo: https://turbo.build/repo/docs
- pnpm Workspaces: https://pnpm.io/workspaces

### Testing
- Vitest: https://vitest.dev/
- Testing Library: https://testing-library.com/

### React Native
- Official Docs: https://reactnative.dev/
- Expo: https://docs.expo.dev/

---

## 📞 Support & Community

When you're back online:
- Create discussions on GitHub
- Join Discord server
- Follow on Twitter
- Read blog posts
- Watch tutorial videos

---

**You now have everything you need to build JoyBoy offline! Good luck! 🏴‍☠️**