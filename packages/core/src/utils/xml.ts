import { XMLParser, X2jOptions } from "fast-xml-parser";

/**
 * Default sitemap parser for backward compatibility
 */
const sitemapParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: () => true
});

export default sitemapParser;

/**
 * Advanced XML/HTML parser configuration for handling various structures
 * Note: unpairedTags is intentionally empty to allow both HTML and XML parsing
 * If you need HTML-specific unpaired tags, pass them in options
 */
const advancedParserOptions: Partial<X2jOptions> = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
  parseTagValue: false,  // Keep values as strings
  parseAttributeValue: false, // Keep attributes as strings
  cdataPropName: "__cdata",
  commentPropName: "__comment",
  preserveOrder: false,
  allowBooleanAttributes: true,
  ignoreDeclaration: false,
  ignorePiTags: false,
  processEntities: true,
  htmlEntities: true,
  stopNodes: ["*.pre", "*.script"],
  unpairedTags: [], // Keep empty for XML compatibility
  alwaysCreateTextNode: false
};

/**
 * Advanced XML parser instance
 */
const advancedParser = new XMLParser(advancedParserOptions);

/**
 * HTML-specific parser for documents with self-closing tags
 */
const htmlParserOptions: Partial<X2jOptions> = {
  ...advancedParserOptions,
  unpairedTags: ["br", "hr", "img", "input", "link", "meta", "area", "base", "col", "command", "embed", "keygen", "param", "source", "track", "wbr"]
};

const htmlParser = new XMLParser(htmlParserOptions);

/**
 * Detect if content is likely HTML (vs XML)
 */
function isLikelyHTML(xmlData: string): boolean {
  const trimmed = xmlData.trim().toLowerCase();
  return trimmed.includes('<!doctype html') || 
         trimmed.startsWith('<html') || 
         /<html[\s>]/i.test(trimmed);
}

/**
 * Parse XML/HTML data into a comprehensive JSON structure
 * Handles various XML structures including unstructured and weird formats
 * 
 * @param xmlData - The XML/HTML string to parse
 * @param options - Optional parser configuration overrides
 * @returns Parsed JSON object with full structural information
 * 
 * @example
 * ```typescript
 * const xml = '<root><item id="1">Text</item></root>';
 * const result = parseXml(xml);
 * // Returns: { root: { item: { '@_id': '1', '#text': 'Text' } } }
 * ```
 */
export function parseXml(xmlData: string, options?: Partial<X2jOptions>): Record<string, any> {
  try {
    // Auto-detect HTML and use appropriate parser
    const useHtmlParser = !options && isLikelyHTML(xmlData);
    const parserOptions = options ? { ...advancedParserOptions, ...options } : 
                         useHtmlParser ? htmlParserOptions : advancedParserOptions;
    const parser = options ? new XMLParser(parserOptions) : 
                   useHtmlParser ? htmlParser : advancedParser;
    
    // Parse the XML
    const parsed = parser.parse(xmlData);
    
    // Normalize the result to ensure consistent structure
    return normalizeXmlResult(parsed);
  } catch (error) {
    throw new Error(`Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Normalize parsed XML results to handle edge cases and inconsistencies
 * 
 * @param data - The parsed XML data
 * @returns Normalized JSON structure
 */
function normalizeXmlResult(data: any): Record<string, any> {
  if (data === null || data === undefined) {
    return {};
  }

  if (typeof data !== 'object') {
    return { value: data };
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return { items: data.map(item => normalizeXmlResult(item)) };
  }

  // Recursively normalize nested objects
  const normalized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      normalized[key] = null;
    } else if (Array.isArray(value)) {
      // Keep arrays as is but normalize their contents
      normalized[key] = value.map(item => 
        typeof item === 'object' && item !== null ? normalizeXmlResult(item) : item
      );
    } else if (typeof value === 'object') {
      normalized[key] = normalizeXmlResult(value);
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Parse XML and extract all text content (ignoring structure)
 * Useful for unstructured or highly variable XML
 * 
 * @param xmlData - The XML/HTML string
 * @returns Object containing all text nodes and their paths
 */
export function extractAllText(xmlData: string): { texts: Array<{ path: string; value: string }> } {
  try {
    const parsed = parseXml(xmlData);
    const texts: Array<{ path: string; value: string }> = [];
    
    function traverse(obj: any, path: string = 'root') {
      if (typeof obj === 'string') {
        if (obj.trim()) {
          texts.push({ path, value: obj.trim() });
        }
        return;
      }
      
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = `${path}.${key}`;
        
        if (key === '#text' && typeof value === 'string' && value.trim()) {
          texts.push({ path: path.replace('.#text', ''), value: value.trim() });
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            traverse(item, `${currentPath}[${index}]`);
          });
        } else {
          traverse(value, currentPath);
        }
      }
    }
    
    traverse(parsed);
    return { texts };
  } catch (error) {
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse XML and flatten into a key-value structure
 * Converts nested XML into dot-notation paths
 * 
 * @param xmlData - The XML/HTML string
 * @returns Flattened object with dot-notation keys
 * 
 * @example
 * ```typescript
 * const xml = '<root><item><name>Test</name></item></root>';
 * const result = flattenXml(xml);
 * // Returns: { 'root.item.name': 'Test' }
 * ```
 */
export function flattenXml(xmlData: string): Record<string, any> {
  try {
    const parsed = parseXml(xmlData);
    const flattened: Record<string, any> = {};
    
    function flatten(obj: any, prefix: string = '') {
      if (typeof obj !== 'object' || obj === null) {
        if (prefix) {
          flattened[prefix] = obj;
        }
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          flatten(item, `${prefix}[${index}]`);
        });
        return;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Check if object has only text or simple values
          const keys = Object.keys(value);
          if (keys.length === 1 && keys[0] === '#text') {
            flattened[newPrefix] = (value as any)['#text'];
          } else {
            flatten(value, newPrefix);
          }
        } else {
          flatten(value, newPrefix);
        }
      }
    }
    
    flatten(parsed);
    return flattened;
  } catch (error) {
    throw new Error(`Failed to flatten XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse XML with automatic structure detection and handling
 * Attempts to identify the XML type and apply appropriate parsing strategy
 * 
 * @param xmlData - The XML/HTML string
 * @returns Object with detected type and parsed data
 */
export function smartParseXml(xmlData: string): {
  type: 'sitemap' | 'rss' | 'atom' | 'html' | 'generic';
  data: Record<string, any>;
  raw: Record<string, any>;
} {
  const parsed = parseXml(xmlData);
  
  // Detect XML type
  let type: 'sitemap' | 'rss' | 'atom' | 'html' | 'generic' = 'generic';
  let data: Record<string, any> = parsed;
  
  if (parsed.urlset || parsed.sitemapindex) {
    type = 'sitemap';
    data = {
      urls: parsed.urlset?.url || parsed.sitemapindex?.sitemap || [],
      type: parsed.urlset ? 'urlset' : 'sitemapindex'
    };
  } else if (parsed.rss) {
    type = 'rss';
    data = {
      channel: parsed.rss.channel || {},
      version: parsed.rss['@_version']
    };
  } else if (parsed.feed) {
    type = 'atom';
    data = {
      entries: parsed.feed.entry || [],
      title: parsed.feed.title,
      updated: parsed.feed.updated
    };
  } else if (parsed.html || parsed.HTML) {
    type = 'html';
    data = parsed.html || parsed.HTML || {};
  }
  
  return { type, data, raw: parsed };
}