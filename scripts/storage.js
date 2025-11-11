// Storage management for For You preferences

const ForYouStorage = {
  // Save user preferences
  async savePreferences(preferences) {
    try {
      await chrome.storage.local.set({ forYouPreferences: preferences });
      console.log('Preferences saved:', preferences);
      return true;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      return false;
    }
  },

  // Get saved preferences
  async getPreferences() {
    try {
      const result = await chrome.storage.local.get('forYouPreferences');
      return result.forYouPreferences || null;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return null;
    }
  },

  // Clear preferences
  async clearPreferences() {
    try {
      await chrome.storage.local.remove('forYouPreferences');
      console.log('Preferences cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear preferences:', error);
      return false;
    }
  },

  // Check if personalization is active
  async isActive() {
    try {
      const result = await chrome.storage.local.get('forYouActive');
      return result.forYouActive || false;
    } catch (error) {
      console.error('Failed to check active status:', error);
      return false;
    }
  },

  // Set active status
  async setActive(isActive) {
    try {
      await chrome.storage.local.set({ forYouActive: isActive });
      return true;
    } catch (error) {
      console.error('Failed to set active status:', error);
      return false;
    }
  }
};

// Make available globally
window.ForYouStorage = ForYouStorage;
