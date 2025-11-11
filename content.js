// Content.js - Main injection and orchestration

(async function() {
  'use strict';

  console.log('For You: Content script loaded');

  // State management
  let forYouModule = null;
  let lastScrollTop = 0;
  const scrollThreshold = 100;
  let isInitialized = false;

  // Crawl state tracking
  let isCrawlInProgress = false;
  let crawlPromise = null;

  // CRITICAL: Wrap everything in try-catch to prevent breaking the page
  try {
    // Wait for DOM to be ready AND defer initialization to prevent blocking
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // Defer init by 500ms to ensure page loads first
        setTimeout(init, 500);
      });
    } else {
      // Page already loaded, but still defer to be safe
      setTimeout(init, 500);
    }
  } catch (error) {
    console.error('For You: Fatal error in content script', error);
  }

  async function init() {
    try {
      if (isInitialized) return;
      isInitialized = true;

      console.log('For You: Initializing...');

      // Initialize debug overlay
      ForYouDebugOverlay.create();
      ForYouDebugOverlay.update('init', 'Status: Initializing');

      // CRITICAL FIX: Don't block page load - defer heavy operations
      // Just check if Squarespace quickly
      const isSquarespace = ForYouPersonalization.checkIsSquarespace();
      console.log('For You: Is Squarespace?', isSquarespace);
      ForYouDebugOverlay.update('site', `Site: ${isSquarespace ? 'Squarespace' : 'Generic'}`);
      ForYouDebugOverlay.update('init', 'Status: Ready');

      // Defer heavy operations to prevent blocking page load
      setTimeout(() => {
        try {
          ForYouDebugOverlay.update('init', 'Status: Profiling site');
          // These operations read document.body.textContent which can be expensive
          ForYouPersonalization.detectSiteType();
          ForYouPersonalization.extractBrandStyles();
          ForYouDebugOverlay.update('init', 'Status: Profile complete');
        } catch (error) {
          console.error('For You: Error during site profiling', error);
          ForYouDebugOverlay.update('error', `Profile error: ${error.message}`);
        }
      }, 500);

      // Start background crawl with longer delay and performance optimizations
      setTimeout(() => {
        try {
          startBackgroundCrawl();
        } catch (error) {
          console.error('For You: Error starting crawl', error);
          ForYouDebugOverlay.update('error', `Crawl error: ${error.message}`);
        }
      }, 2000); // Increased to 2 seconds to ensure page is fully loaded

      // Auto-inject module on Squarespace sites
      if (isSquarespace) {
        console.log('For You: Auto-injecting module on Squarespace site');
        setTimeout(() => {
          try {
            injectForYouModule();
          } catch (error) {
            console.error('For You: Error injecting module', error);
          }
        }, 1500);
      } else {
        // Wait for extension icon click to inject module on non-Squarespace sites
        listenForExtensionActivation();
      }
    } catch (error) {
      console.error('For You: Fatal error in init', error);
      if (window.ForYouDebugOverlay) {
        ForYouDebugOverlay.update('error', `Init failed: ${error.message}`);
      }
    }
  }

  // Start background crawl immediately on page load
  function startBackgroundCrawl() {
    const siteKey = ForYouStorage.getSiteKey();
    const crawlStartTime = Date.now();

    console.log('');
    console.log('[For You] ═══════════════════════════════════════════════════');
    console.log('[For You] Background site analysis started');
    console.log('[For You] ═══════════════════════════════════════════════════');
    console.log(`[For You] Site: ${siteKey}`);
    console.log('[For You] Gathering brand materials for personalization');
    console.log('');

    isCrawlInProgress = true;
    ForYouDebugOverlay.update('crawl', 'Crawl: Starting...');

    // Start crawl and track promise
    crawlPromise = checkAndCrawlSiteInBackground()
      .then(() => {
        isCrawlInProgress = false;
        const elapsed = ((Date.now() - crawlStartTime) / 1000).toFixed(1);
        console.log('');
        console.log('[For You] ═══════════════════════════════════════════════════');
        console.log('[For You] Background analysis complete');
        console.log('[For You] ═══════════════════════════════════════════════════');
        console.log('[For You] Brand materials cached and ready');
        console.log(`[For You] Duration: ${elapsed}s`);
        console.log('[For You] Next transformation will use full site profile');
        console.log('');

        ForYouDebugOverlay.update('crawl', `Crawl: Complete (${elapsed}s)`);
        ForYouDebugOverlay.update('cache', 'Cache: Ready');
      })
      .catch((error) => {
        isCrawlInProgress = false;
        const elapsed = ((Date.now() - crawlStartTime) / 1000).toFixed(1);
        console.log('');
        console.log('[For You] ═══════════════════════════════════════════════════');
        console.log('[For You] Background analysis failed');
        console.log('[For You] ═══════════════════════════════════════════════════');
        console.log(`[For You] Duration: ${elapsed}s`);
        console.log(`[For You] Error: ${error.message || error}`);
        console.log('[For You] Fallback: Will use single-page profiling');
        console.log('');

        ForYouDebugOverlay.update('crawl', `Crawl: Failed (${elapsed}s)`);
        ForYouDebugOverlay.update('error', `Error: ${error.message || 'Unknown'}`);
      });
  }

  // Check if site needs crawling and perform crawl in background (non-blocking)
  async function checkAndCrawlSiteInBackground() {
    try {
      const siteKey = ForYouStorage.getSiteKey();
      const hasInventory = await ForYouStorage.hasValidContentInventory(siteKey);

      if (!hasInventory) {
        console.log('[For You] Cache check: No cached inventory found');
        console.log('[For You] Initiating fresh site analysis');
        console.log('');

        // Perform crawl in background with very conservative settings
        const inventory = await ForYouCrawler.crawlSite({
          maxPages: 3,           // Reduced from 5 to minimize load
          maxConcurrent: 1,      // Reduced from 2 to prevent blocking
          requestDelay: 1000,    // Increased from 500ms for more breathing room
          timeout: 10000
        });

        // Save inventory
        console.log('[For You] Saving inventory to cache...');
        await ForYouStorage.saveContentInventory(siteKey, inventory);
        console.log('[For You] Inventory cached successfully');
      } else {
        console.log('');
        console.log('[For You] Cache check: Found valid cached inventory');
        console.log('[For You] Skipping analysis, using cached brand materials');
        console.log('[For You] Cached inventory will be used for personalization');
        console.log('');
      }

      // Clean up expired inventories to save space
      const cleared = await ForYouStorage.clearExpiredInventories();
      if (cleared > 0) {
        console.log(`[For You] Cleaned up ${cleared} expired inventories`);
      }

    } catch (error) {
      throw error; // Re-throw to be caught by startBackgroundCrawl
    }
  }

  // Expose crawl state and control globally
  window.ForYouCrawl = {
    // Check if crawl is currently in progress
    isInProgress: () => isCrawlInProgress,

    // Wait for crawl to complete (returns immediately if not in progress)
    wait: () => crawlPromise || Promise.resolve(),

    // Get current state
    getState: () => ({
      inProgress: isCrawlInProgress,
      hasPromise: crawlPromise !== null
    })
  };

  // Listen for messages from background script (extension icon click)
  function listenForExtensionActivation() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'activateForYou') {
        console.log('For You: Extension activated');
        injectForYouModule();
        sendResponse({ success: true });
      }
    });
  }

  // Inject the For You module
  async function injectForYouModule() {
    // Check if already injected
    if (document.getElementById('for-you-module')) {
      console.log('For You: Module already injected');
      return;
    }

    // Create module
    forYouModule = document.createElement('div');
    forYouModule.id = 'for-you-module';
    forYouModule.className = 'for-you-module';

    // Create text
    const text = document.createElement('div');
    text.className = 'for-you-text';
    text.textContent = 'For You';

    // Create toggle
    const toggle = document.createElement('div');
    toggle.className = 'for-you-toggle';
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', 'false');

    // Check if user has preferences and toggle is on
    const hasPreferences = await ForYouStorage.hasPreferences();
    const toggleState = await ForYouStorage.getToggleState();

    if (hasPreferences && toggleState) {
      toggle.classList.add('on');
      toggle.setAttribute('aria-checked', 'true');

      // Apply personalization immediately
      const preferences = await ForYouStorage.getPreferences();
      setTimeout(() => {
        ForYouPersonalization.executeTransformation(preferences);
      }, 500);
    }

    // Add click handler
    toggle.addEventListener('click', handleToggleClick);

    // Assemble module
    forYouModule.appendChild(text);
    forYouModule.appendChild(toggle);

    // Inject into page
    document.body.appendChild(forYouModule);

    // Setup scroll behavior
    setupScrollBehavior();

    console.log('For You: Module injected');
  }

  // Handle toggle click
  async function handleToggleClick() {
    const toggle = document.querySelector('.for-you-toggle');
    const isCurrentlyOn = toggle.classList.contains('on');

    // Prevent rapid toggling while processing
    if (toggle.classList.contains('processing')) {
      console.log('For You: Toggle in progress, please wait...');
      return;
    }

    toggle.classList.add('processing');
    toggle.style.opacity = '0.6';
    toggle.style.pointerEvents = 'none';

    try {
      if (isCurrentlyOn) {
        // Turn OFF - remove personalization
        toggle.classList.remove('on');
        toggle.setAttribute('aria-checked', 'false');
        await ForYouStorage.saveToggleState(false);

        // Remove all personalization
        await ForYouPersonalization.removePersonalization();

        console.log('For You: Personalization disabled');
      } else {
        // Turn ON - check if user has preferences
        const hasPreferences = await ForYouStorage.hasPreferences();

        if (hasPreferences) {
          // User has preferences - apply them
          toggle.classList.add('on');
          toggle.setAttribute('aria-checked', 'true');
          await ForYouStorage.saveToggleState(true);

          const preferences = await ForYouStorage.getPreferences();
          await ForYouPersonalization.executeTransformation(preferences);

          console.log('For You: Personalization enabled');
        } else {
          // User needs to take quiz
          toggle.classList.add('on');
          toggle.setAttribute('aria-checked', 'true');

          // Show quiz
          ForYouQuiz.show();

          console.log('For You: Quiz started');
        }
      }
    } catch (error) {
      console.error('For You: Toggle error', error);
    } finally {
      // Re-enable toggle
      toggle.classList.remove('processing');
      toggle.style.opacity = '';
      toggle.style.pointerEvents = '';
    }
  }

  // Setup scroll behavior for module
  function setupScrollBehavior() {
    let scrollTimeout;

    window.addEventListener('scroll', () => {
      // Debounce scroll events
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        handleScroll();
      }, 10);
    }, { passive: true });
  }

  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const module = document.getElementById('for-you-module');

    if (!module) return;

    if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
      // Scrolling down - hide module
      module.classList.add('hidden');
    } else if (scrollTop < lastScrollTop) {
      // Scrolling up - show module
      module.classList.remove('hidden');
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  console.log('For You: Content script ready');
})();
