// Main content script for For You extension

(function() {
  'use strict';

  let forYouModule = null;
  let lastScrollTop = 0;
  const scrollThreshold = 100;
  let isActive = false;

  // Initialize the extension
  async function init() {
    console.log('For You extension initializing...');

    // Check if already personalized
    const savedActive = await window.ForYouStorage.isActive();
    const savedPreferences = await window.ForYouStorage.getPreferences();

    if (savedActive && savedPreferences) {
      isActive = true;
      // Auto-apply personalization if previously activated
      console.log('Auto-applying saved personalization');
      setTimeout(() => {
        window.ForYouPersonalization.applyPersonalization(savedPreferences);
      }, 1000);
    }

    // Create and inject the module
    createModule();

    // Set up scroll behavior
    setupScrollBehavior();

    // Listen for activation event from background script
    document.addEventListener('forYouActivate', handleActivation);

    console.log('For You extension initialized');
  }

  // Create the "For You" module
  function createModule() {
    // Check if module already exists
    if (document.getElementById('forYouModule')) {
      return;
    }

    const module = document.createElement('div');
    module.className = 'for-you-module';
    module.id = 'forYouModule';

    module.innerHTML = `
      <div class="for-you-module-icon">✨</div>
      <div class="for-you-module-text">
        <h3 class="for-you-module-title">For You</h3>
        <p class="for-you-module-subtitle">3 Questions, Personalized Experience</p>
      </div>
      <label class="for-you-toggle">
        <input type="checkbox" id="forYouToggle" ${isActive ? 'checked' : ''}>
        <span class="for-you-toggle-slider"></span>
      </label>
    `;

    document.body.appendChild(module);
    forYouModule = module;

    // Set up toggle event listener
    const toggle = document.getElementById('forYouToggle');
    toggle.addEventListener('change', handleToggleChange);

    // Show module with animation
    setTimeout(() => {
      module.style.opacity = '1';
    }, 100);
  }

  // Handle toggle change
  async function handleToggleChange(event) {
    const isChecked = event.target.checked;

    if (isChecked) {
      // Check if we have saved preferences
      const savedPreferences = await window.ForYouStorage.getPreferences();

      if (savedPreferences) {
        // Already have preferences, just reapply
        isActive = true;
        await window.ForYouStorage.setActive(true);
        window.ForYouPersonalization.applyPersonalization(savedPreferences);
      } else {
        // Show quiz
        window.ForYouQuiz.show();
      }
    } else {
      // Turn off personalization
      isActive = false;
      if (confirm('This will remove your personalization and reload the page. Continue?')) {
        window.ForYouPersonalization.removePersonalization();
      } else {
        // User cancelled, keep toggle on
        event.target.checked = true;
      }
    }
  }

  // Handle activation from extension icon click
  function handleActivation() {
    const toggle = document.getElementById('forYouToggle');
    if (toggle && !toggle.checked) {
      toggle.click();
    }
  }

  // Set up scroll behavior for module
  function setupScrollBehavior() {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // Handle scroll to show/hide module
  function handleScroll() {
    if (!forYouModule) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
      // Scrolling down - hide module
      forYouModule.classList.add('hidden');
    } else if (scrollTop < lastScrollTop) {
      // Scrolling up - show module
      forYouModule.classList.remove('hidden');
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM is already ready
    init();
  }

  // Handle extension updates
  chrome.runtime.onMessage?.addListener((request, sender, sendResponse) => {
    if (request.action === 'activate') {
      handleActivation();
    } else if (request.action === 'reset') {
      window.ForYouPersonalization.removePersonalization();
    }
    sendResponse({ success: true });
    return true;
  });

})();
