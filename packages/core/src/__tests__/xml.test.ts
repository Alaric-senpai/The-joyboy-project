import { describe, it, expect, beforeEach } from 'vitest';

import { parseXml, smartParseXml, extractAllText, flattenXml } from '../utils/xml';

describe('Advanced XML Parser', () => {
  describe('parseXml', () => {
    it('should parse simple XML', () => {
      const xml = '<root><item>Test</item></root>';
      const result = parseXml(xml);
      
      expect(result).toHaveProperty('root');
      expect(result.root).toHaveProperty('item');
      expect(result.root.item).toBe('Test');
    });

    it('should parse XML with attributes', () => {
      const xml = '<root><item id="1" type="test">Content</item></root>';
      const result = parseXml(xml);
      
      expect(result.root.item).toHaveProperty('@_id', '1');
      expect(result.root.item).toHaveProperty('@_type', 'test');
      expect(result.root.item).toHaveProperty('#text', 'Content');
    });

    it('should parse XML with nested elements', () => {
      const xml = `
        <root>
          <parent>
            <child>
              <grandchild>Deep value</grandchild>
            </child>
          </parent>
        </root>
      `;
      const result = parseXml(xml);
      
      expect(result.root.parent.child.grandchild).toBe('Deep value');
    });

    it('should parse XML with multiple siblings', () => {
      const xml = `
        <root>
          <item>First</item>
          <item>Second</item>
          <item>Third</item>
        </root>
      `;
      const result = parseXml(xml);
      
      expect(Array.isArray(result.root.item)).toBe(true);
      expect(result.root.item).toHaveLength(3);
      expect(result.root.item[0]).toBe('First');
      expect(result.root.item[1]).toBe('Second');
      expect(result.root.item[2]).toBe('Third');
    });

    it('should parse XML with mixed content', () => {
      const xml = '<root>Text before<child>Child content</child>Text after</root>';
      const result = parseXml(xml);
      
      expect(result.root).toBeDefined();
      expect(result.root.child).toBe('Child content');
    });

    it('should parse XML with CDATA', () => {
      const xml = '<root><![CDATA[Some <special> content]]></root>';
      const result = parseXml(xml);
      
      expect(result.root).toBeDefined();
    });

    it('should parse unstructured/weird XML', () => {
      const xml = `
        <weird>
          <random attr1="val1">
            <deeply nested="true">
              <very>
                <much>
                  <wow such="deep">Content here</wow>
                </much>
              </very>
            </deeply>
          </random>
          <another-weird_tag>Value</another-weird_tag>
        </weird>
      `;
      const result = parseXml(xml);
      
      expect(result.weird).toBeDefined();
      expect(result.weird.random).toBeDefined();
      expect(result.weird['another-weird_tag']).toBe('Value');
    });

    it('should handle empty elements', () => {
      const xml = '<root><empty/><another></another></root>';
      const result = parseXml(xml);
      
      expect(result.root).toBeDefined();
      expect(result.root.empty).toBeDefined();
      expect(result.root.another).toBeDefined();
    });

    it('should handle namespaces', () => {
      const xml = `
        <root xmlns:custom="http://example.com">
          <custom:item>Namespaced content</custom:item>
        </root>
      `;
      const result = parseXml(xml);
      
      expect(result.root).toBeDefined();
    });

    it('should handle lenient parsing of unclosed tags', () => {
      const invalidXml = '<root><unclosed>';
      
      // fast-xml-parser is lenient and doesn't throw for many invalid cases
      const result = parseXml(invalidXml);
      expect(result).toBeDefined();
    });

    it('should parse HTML-like XML', () => {
      const html = `
        <html>
          <head>
            <title>Test Page</title>
            <meta charset="UTF-8"/>
          </head>
          <body>
            <div class="container">
              <p>Paragraph content</p>
              <img src="image.jpg" alt="Image"/>
              <br/>
            </div>
          </body>
        </html>
      `;
      const result = parseXml(html);
      
      expect(result.html).toBeDefined();
      expect(result.html.head.title).toBe('Test Page');
      expect(result.html.body.div).toBeDefined();
    });
  });

  describe('extractAllText', () => {
    it('should extract all text from XML', () => {
      const xml = `
        <root>
          <item>First text</item>
          <nested>
            <deep>Second text</deep>
          </nested>
          <another>Third text</another>
        </root>
      `;
      const result = extractAllText(xml);
      
      expect(result.texts).toBeDefined();
      expect(Array.isArray(result.texts)).toBe(true);
      expect(result.texts.length).toBeGreaterThan(0);
      
      const values = result.texts.map(t => t.value);
      expect(values).toContain('First text');
      expect(values).toContain('Second text');
      expect(values).toContain('Third text');
    });

    it('should extract text with paths', () => {
      const xml = '<root><item>Content</item></root>';
      const result = extractAllText(xml);
      
      expect(result.texts[0]).toHaveProperty('path');
      expect(result.texts[0]).toHaveProperty('value', 'Content');
    });

    it('should handle empty XML', () => {
      const xml = '<root></root>';
      const result = extractAllText(xml);
      
      expect(result.texts).toHaveLength(0);
    });
  });

  describe('flattenXml', () => {
    it('should flatten simple XML', () => {
      const xml = '<root><item>Value</item></root>';
      const result = flattenXml(xml);
      
      expect(result).toHaveProperty('root.item', 'Value');
    });

    it('should flatten nested XML', () => {
      const xml = `
        <root>
          <level1>
            <level2>
              <level3>Deep value</level3>
            </level2>
          </level1>
        </root>
      `;
      const result = flattenXml(xml);
      
      expect(result).toHaveProperty('root.level1.level2.level3', 'Deep value');
    });

    it('should flatten arrays with indices', () => {
      const xml = `
        <root>
          <item>First</item>
          <item>Second</item>
        </root>
      `;
      const result = flattenXml(xml);
      
      expect(result['root.item[0]']).toBe('First');
      expect(result['root.item[1]']).toBe('Second');
    });

    it('should flatten attributes', () => {
      const xml = '<root><item id="1">Value</item></root>';
      const result = flattenXml(xml);
      
      expect(result).toHaveProperty('root.item.@_id', '1');
      expect(result).toHaveProperty('root.item.#text', 'Value');
    });

    it('should flatten complex structure', () => {
      const xml = `
        <catalog>
          <book id="1">
            <title>Book One</title>
            <author>Author One</author>
          </book>
          <book id="2">
            <title>Book Two</title>
            <author>Author Two</author>
          </book>
        </catalog>
      `;
      const result = flattenXml(xml);
      
      expect(result['catalog.book[0].@_id']).toBe('1');
      expect(result['catalog.book[0].title']).toBe('Book One');
      expect(result['catalog.book[1].@_id']).toBe('2');
      expect(result['catalog.book[1].title']).toBe('Book Two');
    });
  });

  describe('smartParseXml', () => {
    it('should detect sitemap XML', () => {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/page1</loc>
            <lastmod>2024-01-01</lastmod>
          </url>
          <url>
            <loc>https://example.com/page2</loc>
          </url>
        </urlset>
      `;
      const result = smartParseXml(xml);
      
      expect(result.type).toBe('sitemap');
      expect(result.data.type).toBe('urlset');
      expect(result.data.urls).toBeDefined();
      expect(result.raw).toBeDefined();
    });

    it('should detect RSS feed', () => {
      const xml = `
        <?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>RSS Feed</title>
            <link>https://example.com</link>
            <description>Feed description</description>
            <item>
              <title>Item 1</title>
            </item>
          </channel>
        </rss>
      `;
      const result = smartParseXml(xml);
      
      expect(result.type).toBe('rss');
      expect(result.data.channel).toBeDefined();
      expect(result.data.version).toBeDefined();
    });

    it('should detect Atom feed', () => {
      const xml = `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Feed</title>
          <updated>2024-01-01T00:00:00Z</updated>
          <entry>
            <title>Entry 1</title>
          </entry>
        </feed>
      `;
      const result = smartParseXml(xml);
      
      expect(result.type).toBe('atom');
      expect(result.data.title).toBeDefined();
      expect(result.data.updated).toBeDefined();
    });

    it('should detect HTML', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Page</title></head>
          <body><p>Content</p></body>
        </html>
      `;
      const result = smartParseXml(html);
      
      expect(result.type).toBe('html');
      expect(result.data).toBeDefined();
    });

    it('should handle generic XML', () => {
      const xml = '<custom><data>Value</data></custom>';
      const result = smartParseXml(xml);
      
      expect(result.type).toBe('generic');
      expect(result.data).toBeDefined();
      expect(result.raw.custom).toBeDefined();
    });

    it('should detect sitemap index', () => {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <sitemap>
            <loc>https://example.com/sitemap1.xml</loc>
          </sitemap>
        </sitemapindex>
      `;
      const result = smartParseXml(xml);
      
      expect(result.type).toBe('sitemap');
      expect(result.data.type).toBe('sitemapindex');
    });
  });

  describe('Real-world scenarios', () => {
    it('should parse manga sitemap-like structure', () => {
      const xml = `
        <manga-list>
          <manga id="1">
            <title>Manga One</title>
            <chapters>
              <chapter num="1">Chapter 1</chapter>
              <chapter num="2">Chapter 2</chapter>
            </chapters>
          </manga>
          <manga id="2">
            <title>Manga Two</title>
          </manga>
        </manga-list>
      `;
      const result = parseXml(xml);
      
      expect(result['manga-list']).toBeDefined();
      expect(Array.isArray(result['manga-list'].manga)).toBe(true);
    });

    it('should handle malformed but parseable XML', () => {
      const xml = `
        <root>
          <item attr="value" another='quoted'>
            Mixed content <nested>here</nested> and more
          </item>
        </root>
      `;
      const result = parseXml(xml);
      
      expect(result.root).toBeDefined();
      expect(result.root.item).toBeDefined();
    });

    it('should parse complex nested structure with arrays', () => {
      const xml = `
        <catalog>
          <category name="Fiction">
            <book><title>Book 1</title></book>
            <book><title>Book 2</title></book>
          </category>
          <category name="Non-Fiction">
            <book><title>Book 3</title></book>
          </category>
        </catalog>
      `;
      const result = parseXml(xml);
      const flattened = flattenXml(xml);
      
      expect(result.catalog.category).toBeDefined();
      expect(Object.keys(flattened).length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle XML with only text', () => {
      const xml = '<root>Just text</root>';
      const result = parseXml(xml);
      
      expect(result.root).toBe('Just text');
    });

    it('should handle XML with special characters', () => {
      const xml = '<root>Text with &amp; &lt; &gt; &quot; &apos;</root>';
      const result = parseXml(xml);
      
      expect(result.root).toBeDefined();
    });

    it('should handle deeply nested structure', () => {
      const xml = '<a><b><c><d><e><f><g><h><i><j>Deep</j></i></h></g></f></e></d></c></b></a>';
      const result = parseXml(xml);
      
      expect(result.a.b.c.d.e.f.g.h.i.j).toBe('Deep');
    });

    it('should handle XML with numeric values', () => {
      const xml = '<root><number>123</number><decimal>45.67</decimal></root>';
      const result = parseXml(xml);
      
      expect(result.root.number).toBeDefined();
      expect(result.root.decimal).toBeDefined();
    });

    it('should handle XML with boolean-like values', () => {
      const xml = '<root><flag>true</flag><disabled>false</disabled></root>';
      const result = parseXml(xml);
      
      expect(result.root.flag).toBeDefined();
      expect(result.root.disabled).toBeDefined();
    });
  });
});
