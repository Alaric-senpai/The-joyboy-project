/**
 * joyboy-extractor Content Script
 * Performs deep DOM analysis and class extraction
 */

class DOMAnalyzer {
  constructor() {
    this.classes = {};
    this.tags = {};
    this.elements = [];
    this.classFrequency = {};
    this.tagFrequency = {};
    this.classRelationships = {};
    this.results = {};
  }

  /**
   * Main entry point - analyze entire DOM
   */
  analyze() {
    console.log('[joyboy] Starting DOM analysis...');
    const startTime = performance.now();

    this.extractAllElements();
    this.normalizeClassNames();
    this.groupByClass();
    this.analyzeFrequency();
    this.detectPatterns();
    this.buildHierarchy();

    const endTime = performance.now();
    console.log(`[joyboy] Analysis complete in ${(endTime - startTime).toFixed(2)}ms`);

    return this.generateReport();
  }

  /**
   * Extract all HTML elements from DOM
   */
  extractAllElements() {
    const walker = document.createTreeWalker(
      document.documentElement,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    let node;
    let count = 0;

    while (node = walker.nextNode()) {
      const elementData = this.extractElementData(node);
      this.elements.push(elementData);

      // Track tag frequency
      const tag = node.tagName.toLowerCase();
      this.tagFrequency[tag] = (this.tagFrequency[tag] || 0) + 1;

      count++;
      if (count % 1000 === 0) {
        console.log(`[joyboy] Processed ${count} elements...`);
      }
    }

    console.log(`[joyboy] Total elements extracted: ${count}`);
  }

  /**
   * Extract data from a single element
   */
  extractElementData(element) {
    const classList = Array.from(element.classList);
    const parentTag = element.parentElement ? element.parentElement.tagName.toLowerCase() : null;
    const childTags = Array.from(element.children).map(c => c.tagName.toLowerCase());

    const data = {
      tag: element.tagName.toLowerCase(),
      classes: classList,
      attributes: this.extractAttributes(element),
      parentTag,
      childTags: [...new Set(childTags)],
      children: element.children.length,
      hasText: element.innerText && element.innerText.trim().length > 0,
      id: element.id || null,
      ariaRole: element.getAttribute('role') || null,
      accessibilityAttributes: this.extractAccessibilityAttrs(element)
    };

    return data;
  }

  /**
   * Extract element attributes
   */
  extractAttributes(element) {
    const attrs = {};

    const important = ['class', 'id', 'name', 'href', 'src', 'role', 'aria-label', 'aria-hidden', 'data-testid', 'style'];
    
    important.forEach(attr => {
      const val = element.getAttribute(attr);
      if (val) attrs[attr] = val;
    });

    // Get all data-* attributes
    for (let attr of element.attributes) {
      if (attr.name.startsWith('data-')) {
        attrs[attr.name] = attr.value;
      }
    }

    return attrs;
  }

  /**
   * Extract accessibility-related attributes
   */
  extractAccessibilityAttrs(element) {
    const attrs = {};
    for (let attr of element.attributes) {
      if (attr.name.startsWith('aria-')) {
        attrs[attr.name] = attr.value;
      }
    }
    if (element.hasAttribute('role')) {
      attrs.role = element.getAttribute('role');
    }
    return attrs;
  }

  /**
   * Normalize and deduplicate class names
   */
  normalizeClassNames() {
    this.elements.forEach(el => {
      el.classes.forEach(className => {
        if (className && className.trim()) {
          const normalized = className.trim();
          this.classFrequency[normalized] = (this.classFrequency[normalized] || 0) + 1;

          if (!this.classes[normalized]) {
            this.classes[normalized] = {
              name: normalized,
              elements: [],
              tags: {},
              attributes: {},
              count: 0
            };
          }

          this.classes[normalized].count++;
          this.classes[normalized].elements.push(el);

          // Track tags using this class
          this.classes[normalized].tags[el.tag] = (this.classes[normalized].tags[el.tag] || 0) + 1;

          // Track attributes
          Object.keys(el.attributes).forEach(attr => {
            if (!this.classes[normalized].attributes[attr]) {
              this.classes[normalized].attributes[attr] = [];
            }
            if (!this.classes[normalized].attributes[attr].includes(el.attributes[attr])) {
              this.classes[normalized].attributes[attr].push(el.attributes[attr]);
            }
          });
        }
      });
    });

    console.log(`[joyboy] Unique classes found: ${Object.keys(this.classes).length}`);
  }

  /**
   * Group elements by class
   */
  groupByClass() {
    Object.keys(this.classes).forEach(className => {
      const classData = this.classes[className];
      classData.classification = this.classifyClass(className, classData);
      classData.samples = classData.elements.slice(0, 3);
    });
  }

  /**
   * Classify class purpose (layout, component, utility, etc.)
   */
  classifyClass(name, data) {
    const lower = name.toLowerCase();

    // Utility patterns
    if (/^(m|p|w|h|flex|grid|block|inline|absolute|relative|fixed|static)(-|_|[a-z0-9])*$/.test(lower)) {
      return 'utility';
    }

    // Layout patterns
    if (/^(container|wrapper|layout|row|col|section|header|footer|main|sidebar|nav|panel)/.test(lower)) {
      return 'layout';
    }

    // Component patterns
    if (/^(btn|button|card|modal|dropdown|menu|navbar|form|input|badge|tag|chip)/.test(lower)) {
      return 'component';
    }

    // State/Hook patterns
    if (/(active|inactive|open|closed|hidden|visible|disabled|enabled|loading|error|success|warning)/.test(lower)) {
      return 'state';
    }

    // Color/Style patterns
    if (/(color|bg|background|text|dark|light|primary|secondary)/.test(lower)) {
      return 'style';
    }

    return 'custom';
  }

  /**
   * Analyze frequency of classes and tags
   */
  analyzeFrequency() {
    this.results.classFrequencyRanked = Object.entries(this.classFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([name, count]) => ({ name, count }));

    this.results.tagFrequencyRanked = Object.entries(this.tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    console.log('[joyboy] Frequency analysis complete');
  }

  /**
   * Detect repeated class combinations
   */
  detectPatterns() {
    const combinations = {};

    this.elements.forEach(el => {
      if (el.classes.length > 1) {
        const sorted = el.classes.sort().join('|');
        combinations[sorted] = (combinations[sorted] || 0) + 1;
      }
    });

    this.results.commonClassCombinations = Object.entries(combinations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([combo, count]) => ({
        classes: combo.split('|'),
        frequency: count
      }));

    console.log('[joyboy] Pattern detection complete');
  }

  /**
   * Build hierarchy information
   */
  buildHierarchy() {
    const hierarchy = {};

    Object.keys(this.classes).forEach(className => {
      const classData = this.classes[className];
      const parents = {};
      const children = {};

      classData.elements.forEach(el => {
        if (el.parentTag) {
          parents[el.parentTag] = (parents[el.parentTag] || 0) + 1;
        }
        el.childTags.forEach(child => {
          children[child] = (children[child] || 0) + 1;
        });
      });

      hierarchy[className] = {
        parentTags: Object.entries(parents)
          .sort((a, b) => b[1] - a[1])
          .reduce((acc, [tag, count]) => { acc[tag] = count; return acc; }, {}),
        childTags: Object.entries(children)
          .sort((a, b) => b[1] - a[1])
          .reduce((acc, [tag, count]) => { acc[tag] = count; return acc; }, {})
      };
    });

    this.results.hierarchy = hierarchy;
    console.log('[joyboy] Hierarchy build complete');
  }

  /**
   * Generate final report
   */
  generateReport() {
    return {
      metadata: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        title: document.title,
        totalElements: this.elements.length,
        uniqueClasses: Object.keys(this.classes).length,
        uniqueTags: Object.keys(this.tagFrequency).length
      },
      classes: this.classes,
      elements: this.elements,
      frequency: this.results.classFrequencyRanked,
      tagFrequency: this.results.tagFrequencyRanked,
      patterns: this.results.commonClassCombinations,
      hierarchy: this.results.hierarchy
    };
  }
}

/**
 * Listen for messages from popup/background
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeDom') {
    const analyzer = new DOMAnalyzer();
    const report = analyzer.analyze();
    sendResponse({ success: true, data: report });
  }

  if (request.action === 'analyzeWithAI') {
    const analyzer = new DOMAnalyzer();
    const report = analyzer.analyze();
    sendResponse({ success: true, data: report, aiNeeded: true });
  }
});

console.log('[joyboy] Content script loaded and ready');