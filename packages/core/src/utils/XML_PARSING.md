# XML Parsing Utilities

Advanced XML/HTML parsing utilities for the JoyBoy core package. These utilities handle various XML structures, from well-formed standard XML to unstructured and "weird" formats commonly found in web scraping scenarios.

## Features

- 🎯 **Advanced XML Parsing**: Handle structured and unstructured XML/HTML
- 🔍 **Smart Detection**: Automatically detect and parse sitemaps, RSS, Atom feeds, and HTML
- 📊 **Multiple Output Formats**: JSON, flattened key-value, or text-only extraction
- 🛡️ **Robust**: Handles edge cases, CDATA, namespaces, and malformed structures
- ⚡ **Fast**: Built on fast-xml-parser for performance
- 🔄 **Backward Compatible**: Legacy sitemap parser still available

## Usage

### Basic XML Parsing

```typescript
import { parseXml } from '@joyboy-parser/core';

const xml = `
<root>
  <item id="1">Content</item>
</root>
`;

const result = parseXml(xml);
// Returns: { root: { item: { '@_id': '1', '#text': 'Content' } } }
```

### Smart Parsing (Auto-detect XML Type)

```typescript
import { smartParseXml } from '@joyboy-parser/core';

const sitemapXml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
  </url>
</urlset>
`;

const result = smartParseXml(sitemapXml);
// Returns:
// {
//   type: 'sitemap',
//   data: { urls: [...], type: 'urlset' },
//   raw: { urlset: {...} }
// }
```

Supported auto-detection types:
- `sitemap` - Standard sitemaps and sitemap indexes
- `rss` - RSS feeds (all versions)
- `atom` - Atom feeds
- `html` - HTML documents
- `generic` - Any other XML

### Extract All Text Content

```typescript
import { extractAllText } from '@joyboy-parser/core';

const xml = `
<manga>
  <title>One Piece</title>
  <author>Oda</author>
  <chapter>
    <title>Romance Dawn</title>
  </chapter>
</manga>
`;

const result = extractAllText(xml);
// Returns:
// {
//   texts: [
//     { path: 'root.manga.title', value: 'One Piece' },
//     { path: 'root.manga.author', value: 'Oda' },
//     { path: 'root.manga.chapter.title', value: 'Romance Dawn' }
//   ]
// }
```

### Flatten XML to Key-Value Pairs

```typescript
import { flattenXml } from '@joyboy-parser/core';

const xml = `
<catalog>
  <book id="1">
    <title>Book One</title>
    <author>Author One</author>
  </book>
</catalog>
`;

const result = flattenXml(xml);
// Returns:
// {
//   'catalog.book.@_id': '1',
//   'catalog.book.title': 'Book One',
//   'catalog.book.author': 'Author One'
// }
```

## Handling Unstructured XML

The parser is designed to handle "weird" or unstructured XML that doesn't follow standard conventions:

```typescript
import { parseXml } from '@joyboy-parser/core';

const weirdXml = `
<random-structure>
  <deeply-nested attr1="value1">
    <CamelCase>Content</CamelCase>
    <snake_case>More content</snake_case>
    <kebab-case>Even more</kebab-case>
  </deeply-nested>
  <mixed>
    Text before <tag>inline tag</tag> text after
  </mixed>
  <empty-tags>
    <self-closing/>
    <empty></empty>
  </empty-tags>
</random-structure>
`;

const result = parseXml(weirdXml);
// Successfully parses and returns structured JSON
```

## Advanced Options

You can customize the parser behavior by passing options:

```typescript
import { parseXml } from '@joyboy-parser/core';

const xml = '<root><item>Test</item></root>';

const result = parseXml(xml, {
  ignoreAttributes: true,      // Ignore XML attributes
  trimValues: false,            // Keep whitespace
  parseTagValue: false,         // Don't parse numbers/booleans
  cdataPropName: '__cdata',     // Custom CDATA property name
  commentPropName: '__comment'  // Custom comment property name
});
```

## Common Patterns

### Parsing Manga Sitemaps

```typescript
import { smartParseXml } from '@joyboy-parser/core';

const sitemap = await fetch('https://example.com/sitemap.xml')
  .then(r => r.text());

const { type, data } = smartParseXml(sitemap);

if (type === 'sitemap') {
  const urls = data.urls.map(url => url.loc);
  console.log('Found URLs:', urls);
}
```

### Parsing RSS Feeds

```typescript
import { smartParseXml } from '@joyboy-parser/core';

const feed = await fetch('https://example.com/feed.xml')
  .then(r => r.text());

const { type, data } = smartParseXml(feed);

if (type === 'rss') {
  const items = data.channel.item || [];
  items.forEach(item => {
    console.log(item.title, item.link);
  });
}
```

### Parsing HTML Pages

```typescript
import { parseXml } from '@joyboy-parser/core';

const html = await fetch('https://example.com/manga/page')
  .then(r => r.text());

const result = parseXml(html);

// Access specific elements
const title = result.html?.head?.title;
const paragraphs = result.html?.body?.p;
```

### Handling Arrays

The parser automatically handles repeated elements as arrays:

```typescript
import { parseXml } from '@joyboy-parser/core';

const xml = `
<manga>
  <chapter>Chapter 1</chapter>
  <chapter>Chapter 2</chapter>
  <chapter>Chapter 3</chapter>
</manga>
`;

const result = parseXml(xml);
// result.manga.chapter is an array: ['Chapter 1', 'Chapter 2', 'Chapter 3']

result.manga.chapter.forEach((chapter, index) => {
  console.log(`Chapter ${index + 1}:`, chapter);
});
```

## Error Handling

All parsing functions throw descriptive errors on failure:

```typescript
import { parseXml } from '@joyboy-parser/core';

try {
  const result = parseXml('<invalid><unclosed>');
} catch (error) {
  console.error('Parse error:', error.message);
  // "Failed to parse XML: ..."
}
```

## Performance Tips

1. **Use `smartParseXml` for unknown formats**: It detects the type and structures data appropriately
2. **Use `extractAllText` for text-only needs**: Faster than parsing full structure
3. **Use `flattenXml` for simple key-value access**: Good for configuration files
4. **Cache parsed results**: Parsing is fast but caching frequently-used data is faster
5. **Stream large files**: For very large XML files, consider streaming parsers

## Attribute Naming

Attributes are prefixed with `@_` to distinguish them from element content:

```typescript
const xml = '<item id="1" type="book">Content</item>';
const result = parseXml(xml);

console.log(result.item['@_id']);    // '1'
console.log(result.item['@_type']);  // 'book'
console.log(result.item['#text']);   // 'Content'
```

## Text Node Naming

When an element has both attributes and text content, the text is stored in `#text`:

```typescript
const xml = '<item id="1">Text content</item>';
const result = parseXml(xml);

console.log(result.item['@_id']);   // '1'
console.log(result.item['#text']);  // 'Text content'
```

## Special Content

### CDATA Sections

```typescript
const xml = '<item><![CDATA[<special> content]]></item>';
const result = parseXml(xml);
// CDATA content is preserved and accessible
```

### Comments

```typescript
const xml = '<root><!-- This is a comment --><item>Value</item></root>';
const result = parseXml(xml);
// Comments are available via __comment property (if not ignored)
```

### Namespaces

```typescript
const xml = `
<root xmlns:custom="http://example.com">
  <custom:item>Namespaced content</custom:item>
</root>
`;
const result = parseXml(xml);
// Namespaces are preserved in element names
```

## Legacy Parser

The original sitemap parser is still available for backward compatibility:

```typescript
import sitemapParser from '@joyboy-parser/core/utils/xml';

const xml = '<urlset><url><loc>https://example.com</loc></url></urlset>';
const result = sitemapParser.parse(xml);
```

## Examples in Source Code

Check out these files for more examples:
- `packages/core/src/utils/demo.ts` - Comprehensive usage examples
- `packages/core/src/__tests__/xml.test.ts` - Test suite with edge cases
- `packages/core/src/base-source.ts` - Real-world usage in BaseSource

## API Reference

### `parseXml(xmlData: string, options?: Partial<X2jOptions>): Record<string, any>`

Parse XML/HTML into a comprehensive JSON structure.

**Parameters:**
- `xmlData` - The XML/HTML string to parse
- `options` - Optional parser configuration (see fast-xml-parser docs)

**Returns:** Parsed JSON object

**Throws:** Error if XML is invalid

---

### `smartParseXml(xmlData: string): { type, data, raw }`

Parse XML with automatic format detection.

**Parameters:**
- `xmlData` - The XML/HTML string to parse

**Returns:**
- `type` - Detected format: 'sitemap', 'rss', 'atom', 'html', or 'generic'
- `data` - Structured data specific to the detected type
- `raw` - Raw parsed XML structure

---

### `extractAllText(xmlData: string): { texts: Array<{ path, value }> }`

Extract all text content from XML with element paths.

**Parameters:**
- `xmlData` - The XML/HTML string to parse

**Returns:** Object containing array of text nodes with paths

---

### `flattenXml(xmlData: string): Record<string, any>`

Flatten XML into dot-notation key-value pairs.

**Parameters:**
- `xmlData` - The XML/HTML string to parse

**Returns:** Flattened object with dot-notation keys

## Migration from Legacy Parser

If you're using the old `sitemapParser`:

```typescript
// Old way
import sitemapParser from './utils/xml';
const result = sitemapParser.parse(xml);

// New way (same output)
import { parseXml } from '@joyboy-parser/core';
const result = parseXml(xml);

// Or use smart parsing for better structure
import { smartParseXml } from '@joyboy-parser/core';
const { type, data } = smartParseXml(xml);
```

## Contributing

When adding XML parsing features:
1. Add tests to `__tests__/xml.test.ts`
2. Update this README with examples
3. Update `demo.ts` with usage examples
4. Ensure backward compatibility with legacy parser

## Related

- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) - Underlying XML parser
- [BaseSource](../base-source.ts) - Uses XML parsing for sitemaps
- [Types](../../types/) - Entity types for parsed data
