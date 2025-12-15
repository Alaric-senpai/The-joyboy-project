import sitemapParser, { parseXml, smartParseXml, extractAllText, flattenXml } from "./xml";

// Demo 1: Basic sitemap parsing (backward compatible)
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mangadex.org/about</loc>
    <lastmod>2024-01-01</lastmod>
  </url>
  <url>
    <loc>https://mangadex.org/titles</loc>
  </url>
</urlset>`;

console.log('=== Legacy Parser ===');
const legacyResult = sitemapParser.parse(sitemapXml);
console.log(JSON.stringify(legacyResult, null, 2));

console.log('\n=== Advanced parseXml ===');
const advancedResult = parseXml(sitemapXml);
console.log(JSON.stringify(advancedResult, null, 2));

console.log('\n=== Smart Parse (Auto-detect) ===');
const smartResult = smartParseXml(sitemapXml);
console.log('Detected type:', smartResult.type);
console.log('Structured data:', JSON.stringify(smartResult.data, null, 2));

// Demo 2: Unstructured/weird XML
const weirdXml = `
<manga-catalog>
  <entry id="123">
    <title lang="en">One Piece</title>
    <metadata>
      <author>Oda</author>
      <status>ongoing</status>
      <chapters>
        <chapter num="1">
          <title>Romance Dawn</title>
          <pages>45</pages>
        </chapter>
        <chapter num="2">
          <title>Enter Buggy</title>
          <pages>42</pages>
        </chapter>
      </chapters>
    </metadata>
    <tags>
      <tag>adventure</tag>
      <tag>shounen</tag>
    </tags>
  </entry>
  <random-data some-attr="value">
    <deeply nested="true">
      <very>
        <much>Unstructured content</much>
      </very>
    </deeply>
  </random-data>
</manga-catalog>
`;

console.log('\n=== Parsing Weird/Unstructured XML ===');
const weirdResult = parseXml(weirdXml);
console.log(JSON.stringify(weirdResult, null, 2));

console.log('\n=== Flattened View ===');
const flattened = flattenXml(weirdXml);
console.log(JSON.stringify(flattened, null, 2));

console.log('\n=== Extracted Text Only ===');
const textOnly = extractAllText(weirdXml);
console.log(JSON.stringify(textOnly, null, 2));

// Demo 3: RSS Feed
const rssFeed = `
<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Manga Updates</title>
    <link>https://example.com</link>
    <description>Latest manga releases</description>
    <item>
      <title>New Chapter: One Piece 1100</title>
      <link>https://example.com/chapter/1100</link>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
`;

console.log('\n=== RSS Feed Smart Parse ===');
const rssResult = smartParseXml(rssFeed);
console.log('Type:', rssResult.type);
console.log('Data:', JSON.stringify(rssResult.data, null, 2));

// Demo 4: HTML-like structure
const htmlContent = `
<html>
  <head>
    <title>Manga Page</title>
    <meta charset="UTF-8"/>
  </head>
  <body>
    <div class="container">
      <h1>One Piece</h1>
      <p>Description here</p>
      <img src="cover.jpg" alt="Cover"/>
      <br/>
      <ul>
        <li>Chapter 1</li>
        <li>Chapter 2</li>
      </ul>
    </div>
  </body>
</html>
`;

console.log('\n=== HTML Content Parse ===');
const htmlResult = parseXml(htmlContent);
console.log(JSON.stringify(htmlResult, null, 2));

// Demo 5: Mixed content and attributes
const mixedXml = `
<response status="success" timestamp="2024-01-01T00:00:00Z">
  <data type="manga">
    <manga id="1" featured="true">
      <title><![CDATA[Manga & Special <Characters>]]></title>
      <description>Regular description with nested <em>emphasis</em> tags</description>
      <ratings>
        <rating source="site1">9.5</rating>
        <rating source="site2">9.8</rating>
      </ratings>
    </manga>
  </data>
  <pagination>
    <page current="1" total="10"/>
  </pagination>
</response>
`;

console.log('\n=== Mixed Content with CDATA and Attributes ===');
const mixedResult = parseXml(mixedXml);
console.log(JSON.stringify(mixedResult, null, 2));

console.log('\n=== Flattened Mixed Content ===');
const flatMixed = flattenXml(mixedXml);
Object.entries(flatMixed).forEach(([key, value]) => {
  console.log(`${key}: ${JSON.stringify(value)}`);
});
