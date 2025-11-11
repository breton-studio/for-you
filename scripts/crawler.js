/**
 * ForYouCrawler
 * Intelligently crawls a site to build a comprehensive content inventory
 * for enhanced business profiling and personalization.
 */

const ForYouCrawler = {
  // Configuration
  config: {
    maxPages: 5,
    maxConcurrent: 2,
    requestDelay: 500, // ms between requests
    timeout: 10000, // ms per request
    cacheExpiry: 48 * 60 * 60 * 1000 // 48 hours
  },

  /**
   * Yield to event loop to keep browser responsive
   * Uses requestIdleCallback when available, falls back to setTimeout
   */
  async yieldToEventLoop() {
    return new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => resolve(), { timeout: 50 });
      } else {
        setTimeout(resolve, 0);
      }
    });
  },

  // Page type patterns for classification
  pageTypePatterns: {
    about: [/about/i, /our-story/i, /who-we-are/i, /mission/i, /vision/i],
    services: [/services/i, /what-we-do/i, /offerings/i, /solutions/i],
    products: [/products/i, /shop/i, /store/i, /catalog/i, /collection/i],
    team: [/team/i, /people/i, /staff/i, /our-team/i, /meet-the-team/i],
    contact: [/contact/i, /get-in-touch/i, /reach-us/i],
    portfolio: [/portfolio/i, /work/i, /projects/i, /case-studies/i],
    pricing: [/pricing/i, /plans/i, /packages/i],
    faq: [/faq/i, /questions/i, /help/i]
  },

  /**
   * Main entry point: Crawl site and return content inventory
   */
  async crawlSite(options = {}) {
    try {
      const startTime = Date.now();
      console.log('[ForYouCrawler] ═══════════════════════════════════════════');
      console.log('[ForYouCrawler] Starting site crawl');
      console.log('[ForYouCrawler] ═══════════════════════════════════════════');

      const config = { ...this.config, ...options };
      const rootUrl = this.getRootUrl();
      console.log(`[ForYouCrawler] Site: ${rootUrl}`);

      // 1. Extract navigation links from current page
      console.log('');
      console.log('[ForYouCrawler] Phase 1: Discovering pages');
      if (window.ForYouDebugOverlay) {
        window.ForYouDebugOverlay.update('phase', 'Phase: 1/5 - Discovering pages');
      }
      const navLinks = this.extractNavigationLinks();
      console.log(`[ForYouCrawler] Found ${navLinks.length} navigation links`);
      if (navLinks.length > 0) {
        navLinks.slice(0, 3).forEach(link => {
          console.log(`[ForYouCrawler]   - ${link.type}: ${link.url}`);
        });
        if (navLinks.length > 3) {
          console.log(`[ForYouCrawler]   ... and ${navLinks.length - 3} more`);
        }
      }

      // 2. Try to fetch sitemap
      console.log('');
      console.log('[ForYouCrawler] Phase 2: Checking for sitemap');
      if (window.ForYouDebugOverlay) {
        window.ForYouDebugOverlay.update('phase', 'Phase: 2/5 - Checking sitemap');
      }
      const sitemapUrls = await this.fetchSitemap(rootUrl);
      if (sitemapUrls.length > 0) {
        console.log(`[ForYouCrawler] Found ${sitemapUrls.length} URLs in sitemap`);
      } else {
        console.log('[ForYouCrawler] No sitemap found, using navigation links only');
      }

      // 3. Combine and prioritize URLs
      console.log('');
      console.log('[ForYouCrawler] Phase 3: Prioritizing pages');
      if (window.ForYouDebugOverlay) {
        window.ForYouDebugOverlay.update('phase', 'Phase: 3/5 - Prioritizing pages');
      }
      const allUrls = this.deduplicateUrls([...navLinks, ...sitemapUrls]);
      const prioritizedUrls = this.prioritizeUrls(allUrls, rootUrl);
      const urlsToFetch = prioritizedUrls.slice(0, config.maxPages);

      console.log(`[ForYouCrawler] Selected ${urlsToFetch.length} priority pages:`);
      urlsToFetch.forEach((urlData, i) => {
        console.log(`[ForYouCrawler]   ${i + 1}. [${urlData.type}] ${urlData.url}`);
      });

      // 4. Fetch and parse pages
      console.log('');
      console.log(`[ForYouCrawler] Phase 4: Fetching pages (${config.maxConcurrent} concurrent)`);
      if (window.ForYouDebugOverlay) {
        window.ForYouDebugOverlay.update('phase', `Phase: 4/5 - Fetching pages (0/${urlsToFetch.length})`);
      }
      const pages = await this.fetchPages(urlsToFetch, config);

      // 5. Build content inventory
      console.log('');
      console.log('[ForYouCrawler] Phase 5: Building content inventory');
      if (window.ForYouDebugOverlay) {
        window.ForYouDebugOverlay.update('phase', 'Phase: 5/5 - Building inventory');
      }
      const inventory = this.buildInventory(pages, rootUrl);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log('');
      console.log('[ForYouCrawler] ═══════════════════════════════════════════');
      console.log('[ForYouCrawler] Crawl complete');
      console.log('[ForYouCrawler] ═══════════════════════════════════════════');
      console.log(`[ForYouCrawler] Pages crawled: ${inventory.pageCount}`);
      console.log(`[ForYouCrawler] Total words: ${inventory.totalWordCount.toLocaleString()}`);
      console.log(`[ForYouCrawler] Page types: ${Object.keys(inventory.byType).join(', ')}`);
      console.log(`[ForYouCrawler] Time taken: ${elapsed}s`);
      console.log('[ForYouCrawler] ═══════════════════════════════════════════');
      console.log('');

      return inventory;

    } catch (error) {
      console.error('[ForYouCrawler] Crawl failed:', error);
      // Return minimal inventory with current page only
      return this.buildFallbackInventory();
    }
  },

  /**
   * Extract navigation links from current page DOM
   * Uses single batched query for better performance
   */
  extractNavigationLinks() {
    const links = [];
    const seenUrls = new Set();

    // Combine all navigation selectors into one query
    const combinedSelector = 'nav a, header a, .header a, .navigation a, .nav a, [role="navigation"] a, .menu a, .main-nav a';

    try {
      const elements = document.querySelectorAll(combinedSelector);
      elements.forEach(link => {
        const href = link.getAttribute('href');
        if (href && this.isValidInternalLink(href) && !seenUrls.has(href)) {
          seenUrls.add(href);
          links.push({
            url: this.normalizeUrl(href),
            text: link.textContent.trim(),
            type: this.detectPageType(href, link.textContent)
          });
        }
      });
    } catch (e) {
      console.warn('[ForYouCrawler] Error extracting navigation links:', e);
    }

    return links;
  },

  /**
   * Fetch and parse sitemap.xml
   */
  async fetchSitemap(rootUrl) {
    try {
      const sitemapUrl = `${rootUrl}/sitemap.xml`;
      console.log(`[ForYouCrawler] Fetching sitemap: ${sitemapUrl}`);

      const response = await fetch(sitemapUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/xml, text/xml' },
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        console.log('[ForYouCrawler] Sitemap not found or inaccessible');
        return [];
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Extract URLs from sitemap
      const urlElements = xmlDoc.querySelectorAll('url loc');
      const urls = [];

      urlElements.forEach(locElement => {
        const url = locElement.textContent.trim();
        if (this.isValidInternalLink(url)) {
          urls.push({
            url: url,
            text: '',
            type: this.detectPageType(url, '')
          });
        }
      });

      return urls;

    } catch (error) {
      console.log('[ForYouCrawler] Could not fetch sitemap:', error.message);
      return [];
    }
  },

  /**
   * Fetch multiple pages with concurrency control and rate limiting
   */
  async fetchPages(urls, config) {
    const pages = [];
    const queue = [...urls];
    const inProgress = new Map(); // Map promise -> { urlData, completed: boolean }
    let completed = 0;
    let succeeded = 0;
    let failed = 0;

    // Emit progress events
    const emitProgress = (currentUrl = '') => {
      window.dispatchEvent(new CustomEvent('foryou:crawl:progress', {
        detail: { completed, total: urls.length, currentUrl }
      }));

      // Log progress
      const progress = Math.round((completed / urls.length) * 100);
      console.log(`[ForYouCrawler] Progress: ${completed}/${urls.length} pages (${progress}%)`);
    };

    while (queue.length > 0 || inProgress.size > 0) {
      // Start new requests up to maxConcurrent
      while (inProgress.size < config.maxConcurrent && queue.length > 0) {
        const urlData = queue.shift();
        const urlShort = urlData.url.replace(window.location.origin, '');

        // Yield before starting each fetch to prevent blocking
        await this.yieldToEventLoop();

        const promiseInfo = { urlData, completed: false };

        const promise = this.fetchPage(urlData, config)
          .then(async (page) => {
            if (page) {
              pages.push(page);
              succeeded++;
              console.log(`[ForYouCrawler]   Fetched [${page.type}]: ${urlShort} (${page.wordCount} words)`);
            }
            completed++;
            promiseInfo.completed = true;
            emitProgress();

            // Yield to event loop after each page to keep browser responsive
            await this.yieldToEventLoop();

            return page;
          })
          .catch(async (error) => {
            failed++;
            console.warn(`[ForYouCrawler]   Failed [${urlData.type}]: ${urlShort} - ${error.message}`);
            completed++;
            promiseInfo.completed = true;
            emitProgress();

            // Yield even on error
            await this.yieldToEventLoop();

            return null;
          });

        inProgress.set(promise, promiseInfo);

        // Rate limiting delay
        if (queue.length > 0) {
          await this.sleep(config.requestDelay);
        }
      }

      // Wait for at least one to complete and remove completed ones
      if (inProgress.size > 0) {
        // Wait for any to complete
        await Promise.race(Array.from(inProgress.keys()));

        // Remove all completed promises
        for (const [promise, info] of Array.from(inProgress.entries())) {
          if (info.completed) {
            inProgress.delete(promise);
          }
        }
      }

      // Yield at the end of each main loop iteration
      await this.yieldToEventLoop();
    }

    // Log summary
    console.log(`[ForYouCrawler] Fetch summary: ${succeeded} succeeded, ${failed} failed`);

    return pages;
  },

  /**
   * Fetch and parse a single page
   */
  async fetchPage(urlData, config) {
    try {
      const response = await fetch(urlData.url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(config.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Yield before expensive DOM parsing operation
      await this.yieldToEventLoop();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Yield after DOM parsing to prevent blocking
      await this.yieldToEventLoop();

      // Extract content from page (now async with yielding)
      const content = await this.extractPageContent(doc);

      return {
        url: urlData.url,
        type: urlData.type || this.detectPageType(urlData.url, content.title),
        title: content.title,
        headings: content.headings,
        paragraphs: content.paragraphs,
        lists: content.lists,
        buttons: content.buttons,
        wordCount: content.wordCount
      };

    } catch (error) {
      throw new Error(`${error.message}`);
    }
  },

  /**
   * Extract structured content from a page document
   * Async with yielding to keep browser responsive
   */
  async extractPageContent(doc) {
    const content = {
      title: '',
      headings: [],
      paragraphs: [],
      lists: [],
      buttons: [],
      wordCount: 0
    };

    // Extract title
    const titleEl = doc.querySelector('title');
    if (titleEl) {
      content.title = titleEl.textContent.trim();
    }

    // Yield to event loop
    await this.yieldToEventLoop();

    // Extract all headings in one query instead of 4 separate
    const headings = doc.querySelectorAll('h1, h2, h3, h4');
    headings.forEach(h => {
      const text = h.textContent.trim();
      if (text.length > 0) {
        content.headings.push({
          level: h.tagName.toLowerCase(),
          text: text
        });
      }
    });

    // Yield to event loop
    await this.yieldToEventLoop();

    // Extract paragraphs
    const paragraphs = doc.querySelectorAll('p');
    paragraphs.forEach(p => {
      const text = p.textContent.trim();
      if (text.length >= 10) { // Minimum 10 chars
        content.paragraphs.push(text);
        content.wordCount += text.split(/\s+/).length;
      }
    });

    // Yield to event loop
    await this.yieldToEventLoop();

    // Extract lists
    const lists = doc.querySelectorAll('ul, ol');
    lists.forEach(list => {
      const items = [];
      const listItems = list.querySelectorAll('li');
      listItems.forEach(li => {
        const text = li.textContent.trim();
        if (text.length > 0) {
          items.push(text);
        }
      });
      if (items.length > 0) {
        content.lists.push(items);
      }
    });

    // Yield to event loop
    await this.yieldToEventLoop();

    // Extract buttons/CTAs
    const buttons = doc.querySelectorAll('a.button, a.btn, button, .cta, [class*="button"]');
    buttons.forEach(btn => {
      const text = btn.textContent.trim();
      if (text.length > 0 && text.length < 100) {
        content.buttons.push(text);
      }
    });

    return content;
  },

  /**
   * Build final content inventory from crawled pages
   */
  buildInventory(pages, rootUrl) {
    const inventory = {
      rootUrl: rootUrl,
      crawledAt: Date.now(),
      pageCount: pages.length,
      pages: pages,
      byType: {},
      totalWordCount: 0
    };

    // Group pages by type
    pages.forEach(page => {
      if (!inventory.byType[page.type]) {
        inventory.byType[page.type] = [];
      }
      inventory.byType[page.type].push(page);
      inventory.totalWordCount += page.wordCount || 0;
    });

    // Extract aggregated content
    inventory.allHeadings = pages.flatMap(p => p.headings);
    inventory.allParagraphs = pages.flatMap(p => p.paragraphs);
    inventory.allButtons = [...new Set(pages.flatMap(p => p.buttons))]; // Dedupe

    return inventory;
  },

  /**
   * Build minimal fallback inventory from current page only
   */
  buildFallbackInventory() {
    console.log('[ForYouCrawler] Building fallback inventory from current page');

    const content = this.extractPageContent(document);

    return {
      rootUrl: this.getRootUrl(),
      crawledAt: Date.now(),
      pageCount: 1,
      pages: [{
        url: window.location.href,
        type: 'homepage',
        ...content
      }],
      byType: {
        homepage: [{ url: window.location.href, type: 'homepage', ...content }]
      },
      totalWordCount: content.wordCount,
      allHeadings: content.headings,
      allParagraphs: content.paragraphs,
      allButtons: content.buttons,
      fallback: true
    };
  },

  /**
   * Prioritize URLs based on page type importance
   */
  prioritizeUrls(urls, rootUrl) {
    const typePriority = {
      homepage: 1,
      about: 2,
      services: 3,
      products: 3,
      team: 4,
      portfolio: 5,
      pricing: 6,
      contact: 7,
      faq: 8,
      unknown: 9
    };

    // Add homepage if not in list
    const hasHomepage = urls.some(u => this.normalizeUrl(u.url) === rootUrl);
    if (!hasHomepage) {
      urls.unshift({ url: rootUrl, text: 'Home', type: 'homepage' });
    }

    // Sort by priority
    return urls.sort((a, b) => {
      const priorityA = typePriority[a.type] || 9;
      const priorityB = typePriority[b.type] || 9;
      return priorityA - priorityB;
    });
  },

  /**
   * Detect page type from URL and link text
   */
  detectPageType(url, text) {
    const combined = `${url} ${text}`.toLowerCase();

    for (const [type, patterns] of Object.entries(this.pageTypePatterns)) {
      if (patterns.some(pattern => pattern.test(combined))) {
        return type;
      }
    }

    // Check if it's the homepage
    const normalized = this.normalizeUrl(url);
    const root = this.getRootUrl();
    if (normalized === root || normalized === root + '/') {
      return 'homepage';
    }

    return 'unknown';
  },

  /**
   * Validate if a link is internal and should be crawled
   */
  isValidInternalLink(href) {
    if (!href) return false;

    // Skip anchors, mailto, tel, javascript
    if (href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('javascript:')) {
      return false;
    }

    // Skip assets
    const assetExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.pdf',
                            '.zip', '.mp4', '.mp3', '.css', '.js'];
    if (assetExtensions.some(ext => href.toLowerCase().endsWith(ext))) {
      return false;
    }

    // Check if same domain
    try {
      const currentDomain = window.location.hostname;

      // Relative URL - always valid
      if (href.startsWith('/') && !href.startsWith('//')) {
        return true;
      }

      // Absolute URL - check domain
      const url = new URL(href, window.location.href);
      return url.hostname === currentDomain;

    } catch (e) {
      return false;
    }
  },

  /**
   * Normalize URL to absolute form
   */
  normalizeUrl(href) {
    try {
      const url = new URL(href, window.location.href);
      // Remove trailing slash and hash
      return url.origin + url.pathname.replace(/\/$/, '');
    } catch (e) {
      return href;
    }
  },

  /**
   * Get root URL of current site
   */
  getRootUrl() {
    return `${window.location.protocol}//${window.location.hostname}`;
  },

  /**
   * Deduplicate URLs
   */
  deduplicateUrls(urls) {
    const seen = new Set();
    return urls.filter(urlData => {
      const normalized = this.normalizeUrl(urlData.url);
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  },

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ForYouCrawler;
}
