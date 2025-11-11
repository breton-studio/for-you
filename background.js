// Background service worker for For You extension

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  // Only activate on ateliereva.com
  if (tab.url && tab.url.includes('ateliereva.com')) {
    // Inject the For You module
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: activateForYou
      });
    } catch (error) {
      console.error('Failed to activate For You:', error);
    }
  } else {
    // Show notification that extension only works on supported sites
    console.log('For You extension only works on ateliereva.com');
  }
});

// Function to be injected into the page
function activateForYou() {
  // Trigger the module to show (content script will handle this)
  const event = new CustomEvent('forYouActivate');
  document.dispatchEvent(event);
}

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('For You extension installed successfully');
  } else if (details.reason === 'update') {
    console.log('For You extension updated');
  }
});
