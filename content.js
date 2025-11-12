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

    // Apply brand-tinted frosted glass styling
    applyBrandTintToModule();

    // Apply brand color to toggle
    applyBrandColorToToggle();

    // Setup scroll behavior
    setupScrollBehavior();

    console.log('For You: Module injected');
  }

  // Apply brand accent color tint to module
  function applyBrandTintToModule() {
    try {
      // Extract brand accent color from site's color palette
      const brandColor = extractBrandAccentColor();
      console.log('For You: Extracted brand color:', brandColor);

      if (brandColor) {
        const module = document.getElementById('for-you-module');
        const moduleText = module?.querySelector('.for-you-text');
        if (module && moduleText) {
          // Parse RGB from brand color
          const rgb = parseColorToRGB(brandColor);
          if (rgb) {
            // Darken brand color by 50% for better contrast
            const darkR = Math.round(rgb.r * 0.5);
            const darkG = Math.round(rgb.g * 0.5);
            const darkB = Math.round(rgb.b * 0.5);

            // Apply black overlay + brand tint for guaranteed contrast
            module.style.background = `
              linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
              rgba(${darkR}, ${darkG}, ${darkB}, 0.7)
            `;
            module.style.backdropFilter = 'blur(20px) saturate(180%)';
            module.style.webkitBackdropFilter = 'blur(20px) saturate(180%)';
            module.style.border = `1px solid rgba(${darkR}, ${darkG}, ${darkB}, 0.6)`;

            // White text with shadow for maximum readability
            moduleText.style.color = '#ffffff';
            moduleText.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';

            console.log('For You: Brand tint applied with high contrast');
          }
        }
      }
    } catch (error) {
      console.log('For You: Could not apply brand tint', error);
    }
  }

  // Apply brand color to toggle (on state)
  function applyBrandColorToToggle() {
    try {
      const brandColor = extractBrandAccentColor();

      if (brandColor) {
        const rgb = parseColorToRGB(brandColor);
        if (rgb) {
          // Ensure sufficient contrast with white toggle knob
          // Calculate luminance to determine if color is light or dark
          const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);

          // If color is too light (poor contrast with white), darken it
          let toggleR = rgb.r;
          let toggleG = rgb.g;
          let toggleB = rgb.b;

          if (luminance > 0.6) {
            // Color is too light, darken by 40%
            toggleR = Math.round(rgb.r * 0.6);
            toggleG = Math.round(rgb.g * 0.6);
            toggleB = Math.round(rgb.b * 0.6);
          }

          // Apply to toggle via CSS custom property
          const toggle = document.querySelector('.for-you-toggle');
          if (toggle) {
            toggle.style.setProperty('--brand-toggle-color', `rgb(${toggleR}, ${toggleG}, ${toggleB})`);
          }

          console.log('For You: Brand color applied to toggle');
        }
      }
    } catch (error) {
      console.log('For You: Could not apply brand color to toggle', error);
    }
  }

  // Extract brand accent color from site's color palette
  function extractBrandAccentColor() {
    const colorCandidates = [];

    // 1. Scan primary brand elements (buttons, CTAs, headers, logos)
    const brandElements = [
      // Primary CTAs and buttons (highest priority)
      ...document.querySelectorAll('.sqs-block-button-element, .btn, button, a[class*="button"], [class*="cta"]'),
      // Header/nav area (often has brand colors)
      ...document.querySelectorAll('header, nav, .header, .navigation, [class*="nav"]'),
      // Logo area
      ...document.querySelectorAll('[class*="logo"], .branding, .site-title'),
      // Links (brand accent often visible here)
      ...document.querySelectorAll('a[href]')
    ];

    // Collect colors from all brand elements
    brandElements.slice(0, 50).forEach(element => {
      const computed = getComputedStyle(element);

      // Check background color
      const bgColor = computed.backgroundColor;
      if (bgColor && bgColor !== 'transparent' && !bgColor.includes('rgba(0, 0, 0, 0)')) {
        const rgb = parseColorToRGB(bgColor);
        if (rgb && !isGrayscale(rgb) && !isTooLight(rgb) && !isTooDark(rgb)) {
          colorCandidates.push({ color: bgColor, rgb, score: 0 });
        }
      }

      // Check text/foreground color
      const textColor = computed.color;
      if (textColor) {
        const rgb = parseColorToRGB(textColor);
        if (rgb && !isGrayscale(rgb) && !isTooLight(rgb)) {
          colorCandidates.push({ color: textColor, rgb, score: 0 });
        }
      }

      // Check border color (sometimes brand accent)
      const borderColor = computed.borderColor;
      if (borderColor && borderColor !== 'transparent') {
        const rgb = parseColorToRGB(borderColor);
        if (rgb && !isGrayscale(rgb) && !isTooLight(rgb)) {
          colorCandidates.push({ color: borderColor, rgb, score: 0 });
        }
      }
    });

    if (colorCandidates.length === 0) {
      console.log('For You: No brand colors found, using default');
      return 'rgb(52, 199, 89)'; // iOS green fallback
    }

    // Score colors by frequency (most common brand color)
    const colorMap = new Map();
    colorCandidates.forEach(candidate => {
      const key = `${candidate.rgb.r},${candidate.rgb.g},${candidate.rgb.b}`;
      if (colorMap.has(key)) {
        colorMap.get(key).count++;
      } else {
        colorMap.set(key, { ...candidate, count: 1 });
      }
    });

    // Find most frequent saturated color
    let bestColor = null;
    let bestScore = 0;

    colorMap.forEach(colorData => {
      const saturation = calculateSaturation(colorData.rgb);
      const score = colorData.count * saturation; // Frequency × saturation

      if (score > bestScore) {
        bestScore = score;
        bestColor = colorData.color;
      }
    });

    console.log('For You: Found brand color with score:', bestScore);
    return bestColor || 'rgb(52, 199, 89)';
  }

  // Parse color string to RGB object
  function parseColorToRGB(colorString) {
    if (!colorString) return null;

    // Match rgb/rgba format
    const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }

    // Match hex format
    const hexMatch = colorString.match(/#([0-9a-f]{6})/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      };
    }

    return null;
  }

  // Check if color is grayscale (to avoid using boring colors)
  function isGrayscale(rgb) {
    const threshold = 15;
    return Math.abs(rgb.r - rgb.g) < threshold &&
           Math.abs(rgb.g - rgb.b) < threshold &&
           Math.abs(rgb.r - rgb.b) < threshold;
  }

  // Check if color is too light (near white)
  function isTooLight(rgb) {
    const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);
    return luminance > 0.95;
  }

  // Check if color is too dark (near black)
  function isTooDark(rgb) {
    const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);
    return luminance < 0.05;
  }

  // Calculate relative luminance (WCAG formula)
  function calculateLuminance(r, g, b) {
    // Convert to 0-1 range
    const [rs, gs, bs] = [r, g, b].map(c => {
      const val = c / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Calculate color saturation (0-1)
  function calculateSaturation(rgb) {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (max === 0) return 0;
    return delta / max;
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
        toggle.classList.remove('on', 'loading');
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
          toggle.classList.add('loading');
          toggle.setAttribute('aria-checked', 'true');
          await ForYouStorage.saveToggleState(true);

          const preferences = await ForYouStorage.getPreferences();
          await ForYouPersonalization.executeTransformation(preferences);

          // Complete the animation
          toggle.classList.remove('loading');
          toggle.classList.add('on');

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
