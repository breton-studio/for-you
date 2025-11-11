// Content.js - Main injection and orchestration

(async function() {
  'use strict';

  console.log('For You: Content script loaded');

  // State management
  let forYouModule = null;
  let lastScrollTop = 0;
  const scrollThreshold = 100;
  let isInitialized = false;

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    if (isInitialized) return;
    isInitialized = true;

    console.log('For You: Initializing...');

    // Check if Squarespace site (optional - works on all sites but optimized for Squarespace)
    const isSquarespace = ForYouPersonalization.checkIsSquarespace();
    console.log('For You: Is Squarespace?', isSquarespace);

    // Detect site type and extract brand styles
    ForYouPersonalization.detectSiteType();
    ForYouPersonalization.extractBrandStyles();

    // Auto-inject module on Squarespace sites
    if (isSquarespace) {
      console.log('For You: Auto-injecting module on Squarespace site');
      setTimeout(() => injectForYouModule(), 1000);
    } else {
      // Wait for extension icon click to inject module on non-Squarespace sites
      listenForExtensionActivation();
    }
  }

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
