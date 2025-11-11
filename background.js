// Background.js - Service worker for extension logic

console.log('For You: Background service worker loaded');

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('For You: Extension icon clicked', tab.id);

  // Send message to content script to activate For You
  chrome.tabs.sendMessage(tab.id, {
    action: 'activateForYou'
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('For You: Error sending message', chrome.runtime.lastError);
    } else {
      console.log('For You: Message sent successfully', response);
    }
  });
});

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('For You: Extension installed/updated', details.reason);

  if (details.reason === 'install') {
    console.log('For You: First time installation');
    // Could open a welcome page or set default settings here
  } else if (details.reason === 'update') {
    console.log('For You: Extension updated');
  }
});

// Keep service worker alive
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('For You: Background received message', message);
  sendResponse({ received: true });
  return true; // Keep channel open for async response
});
