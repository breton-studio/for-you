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
  },

  // Save content inventory for a site
  async saveContentInventory(siteKey, inventory) {
    try {
      const key = `forYouInventory_${siteKey}`;
      const data = {
        inventory: inventory,
        cachedAt: Date.now(),
        expiresAt: Date.now() + (48 * 60 * 60 * 1000) // 48 hours
      };

      await chrome.storage.local.set({ [key]: data });
      console.log(`For You: Content inventory saved for ${siteKey}`, inventory);
      return true;
    } catch (error) {
      console.error('For You: Error saving content inventory', error);
      return false;
    }
  },

  // Get content inventory for a site
  async getContentInventory(siteKey) {
    try {
      const key = `forYouInventory_${siteKey}`;
      const result = await chrome.storage.local.get([key]);
      const data = result[key];

      if (!data) {
        console.log(`For You: No cached inventory for ${siteKey}`);
        return null;
      }

      // Check if cache has expired
      if (Date.now() > data.expiresAt) {
        console.log(`For You: Cached inventory expired for ${siteKey}`);
        await this.clearContentInventory(siteKey);
        return null;
      }

      console.log(`For You: Using cached inventory for ${siteKey}`);
      return data.inventory;

    } catch (error) {
      console.error('For You: Error getting content inventory', error);
      return null;
    }
  },

  // Check if content inventory exists and is valid
  async hasValidContentInventory(siteKey) {
    const inventory = await this.getContentInventory(siteKey);
    return inventory !== null && inventory.pageCount > 0;
  },

  // Clear content inventory for a site
  async clearContentInventory(siteKey) {
    try {
      const key = `forYouInventory_${siteKey}`;
      await chrome.storage.local.remove([key]);
      console.log(`For You: Content inventory cleared for ${siteKey}`);
      return true;
    } catch (error) {
      console.error('For You: Error clearing content inventory', error);
      return false;
    }
  },

  // Get storage usage stats
  async getStorageStats() {
    try {
      const usage = await chrome.storage.local.getBytesInUse();
      const quota = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB default
      return {
        used: usage,
        quota: quota,
        available: quota - usage,
        percentUsed: (usage / quota) * 100
      };
    } catch (error) {
      console.error('For You: Error getting storage stats', error);
      return null;
    }
  },

  // Clear expired inventories to free up space
  async clearExpiredInventories() {
    try {
      const allData = await chrome.storage.local.get(null);
      const now = Date.now();
      const keysToRemove = [];

      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith('forYouInventory_') && value.expiresAt && now > value.expiresAt) {
          keysToRemove.push(key);
        }
      }

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log(`For You: Cleared ${keysToRemove.length} expired inventories`);
      }

      return keysToRemove.length;
    } catch (error) {
      console.error('For You: Error clearing expired inventories', error);
      return 0;
    }
  },

  // Generate site key from URL
  getSiteKey(url = window.location.href) {
    try {
      const urlObj = new URL(url);
      // Use hostname as site key (e.g., "example.com")
      return urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
      console.error('For You: Error generating site key', error);
      return 'unknown';
    }
  }
};

// Make available globally
window.ForYouStorage = ForYouStorage;
