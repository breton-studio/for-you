// Storage.js - Chrome Storage API wrapper for preferences

const ForYouStorage = {
  // Save user preferences
  async savePreferences(preferences) {
    try {
      await chrome.storage.local.set({
        forYouPreferences: preferences,
        forYouTimestamp: Date.now()
      });
      console.log('For You: Preferences saved', preferences);
      return true;
    } catch (error) {
      console.error('For You: Error saving preferences', error);
      return false;
    }
  },

  // Get user preferences
  async getPreferences() {
    try {
      const result = await chrome.storage.local.get(['forYouPreferences']);
      return result.forYouPreferences || null;
    } catch (error) {
      console.error('For You: Error getting preferences', error);
      return null;
    }
  },

  // Check if user has completed quiz
  async hasPreferences() {
    const preferences = await this.getPreferences();
    return preferences !== null && Object.keys(preferences).length > 0;
  },

  // Save toggle state
  async saveToggleState(isActive) {
    try {
      await chrome.storage.local.set({
        forYouToggleState: isActive
      });
      return true;
    } catch (error) {
      console.error('For You: Error saving toggle state', error);
      return false;
    }
  },

  // Get toggle state
  async getToggleState() {
    try {
      const result = await chrome.storage.local.get(['forYouToggleState']);
      return result.forYouToggleState || false;
    } catch (error) {
      console.error('For You: Error getting toggle state', error);
      return false;
    }
  },

  // Clear all For You data
  async clearAll() {
    try {
      await chrome.storage.local.remove(['forYouPreferences', 'forYouTimestamp', 'forYouToggleState']);
      console.log('For You: All data cleared');
      return true;
    } catch (error) {
      console.error('For You: Error clearing data', error);
      return false;
    }
  },

  // Save site-specific state (which sections were hidden, etc.)
  async saveSiteState(siteKey, state) {
    try {
      const key = `forYouSite_${siteKey}`;
      await chrome.storage.local.set({ [key]: state });
      return true;
    } catch (error) {
      console.error('For You: Error saving site state', error);
      return false;
    }
  },

  // Get site-specific state
  async getSiteState(siteKey) {
    try {
      const key = `forYouSite_${siteKey}`;
      const result = await chrome.storage.local.get([key]);
      return result[key] || null;
    } catch (error) {
      console.error('For You: Error getting site state', error);
      return null;
    }
  }
};

// Make available globally
window.ForYouStorage = ForYouStorage;
