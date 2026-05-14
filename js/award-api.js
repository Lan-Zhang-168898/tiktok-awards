// AWARD-API.JS VERSION: 20250520a
// TikTok Shop Stars Awards - AIPA Backend API Module
// Replaces localStorage for likes and comments with backend API

const AwardAPI = {
  // AIPA backend base URL
  BASE_URL: 'https://da1e5fb0.aipa.bytedance.net',

  // Flag to track if API is available; if false, fallback to localStorage
  _apiAvailable: null,

  // Cache for award data to reduce repeated API calls
  _cache: {},

  // Cache TTL in ms (30 seconds)
  _cacheTTL: 30000,

  /**
   * Check if the AIPA API is reachable
   */
  async checkAvailability() {
    if (this._apiAvailable !== null) return this._apiAvailable;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${this.BASE_URL}/api/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this._apiAvailable = res.ok;
    } catch (e) {
      console.warn('[AwardAPI] API not reachable, falling back to localStorage', e.message);
      this._apiAvailable = false;
    }
    // Show debug banner
    this._showDebugBanner();
    return this._apiAvailable;
  },

  _showDebugBanner() {
    const existing = document.getElementById('api-debug-banner');
    if (existing) return;
    const banner = document.createElement('div');
    banner.id = 'api-debug-banner';
    const isOnline = this._apiAvailable;
    banner.style.cssText = 'position:fixed;bottom:10px;right:10px;padding:8px 14px;border-radius:8px;font-size:12px;z-index:99999;font-family:monospace;max-width:300px;line-height:1.4;cursor:pointer;' +
      (isOnline
        ? 'background:#e6f9ee;color:#1a7f37;border:1px solid #1a7f37;'
        : 'background:#fff0f0;color:#cf222e;border:1px solid #cf222e;');
    banner.innerHTML = isOnline
      ? '✅ API Connected<br><small>AIPA backend is active</small>'
      : '⚠️ API Offline<br><small>Using localStorage (data NOT shared)</small>';
    banner.title = 'Click to dismiss';
    banner.onclick = () => banner.remove();
    document.body.appendChild(banner);
    // Auto-hide after 8s
    setTimeout(() => { if (banner.parentNode) banner.remove(); }, 8000);
  },

  /**
   * Toggle like for an award
   * @returns {Promise<{liked: boolean, like_count: number}>}
   */
  async toggleLike(awardId, userId) {
    try {
      const res = await fetch(`${this.BASE_URL}/api/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ award_id: awardId, user_id: userId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const resp = await res.json();
      // Unwrap { success, data } wrapper and normalize has_liked -> liked
      const data = resp.data || resp;
      const result = {
        liked: data.has_liked !== undefined ? data.has_liked : !!data.liked,
        like_count: data.like_count || 0
      };
      // Invalidate cache for this award
      delete this._cache[awardId];
      return result;
    } catch (e) {
      console.error('[AwardAPI] toggleLike failed:', e.message);
      return null;
    }
  },

  /**
   * Add a comment to an award
   * @returns {Promise<object>} The created comment object
   */
  async addComment(awardId, userId, username, content) {
    try {
      const res = await fetch(`${this.BASE_URL}/api/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          award_id: awardId,
          user_id: userId,
          username: username,
          content: content
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Invalidate cache for this award
      delete this._cache[awardId];
      return data;
    } catch (e) {
      console.error('[AwardAPI] addComment failed:', e.message);
      return null;
    }
  },

  /**
   * Get award data (like count, isLiked, comments)
   * @returns {Promise<{like_count: number, liked: boolean, comments: Array}>}
   */
  async getAwardData(awardId, userId) {
    // Check cache first
    const cacheKey = awardId;
    const cached = this._cache[cacheKey];
    if (cached && (Date.now() - cached._timestamp < this._cacheTTL)) {
      return cached;
    }

    try {
      const res = await fetch(`${this.BASE_URL}/api/awards/${encodeURIComponent(awardId)}?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const resp = await res.json();
      // Unwrap { success, data } wrapper and normalize has_liked -> liked
      const raw = resp.data || resp;
      const data = {
        liked: raw.has_liked !== undefined ? raw.has_liked : !!raw.liked,
        like_count: raw.like_count || 0,
        comments: raw.comments || []
      };
      data._timestamp = Date.now();
      this._cache[cacheKey] = data;
      return data;
    } catch (e) {
      console.error('[AwardAPI] getAwardData failed:', e.message);
      return null;
    }
  },

  /**
   * Batch load award data for multiple cards
   * @param {string[]} awardIds
   * @param {string} userId
   * @returns {Promise<Object>} Map of awardId -> awardData
   */
  async batchGetAwardData(awardIds, userId) {
    const results = {};
    // Filter out cached items
    const uncached = [];
    for (const id of awardIds) {
      const cached = this._cache[id];
      if (cached && (Date.now() - cached._timestamp < this._cacheTTL)) {
        results[id] = cached;
      } else {
        uncached.push(id);
      }
    }

    // Fetch uncached items (parallel with concurrency limit)
    const CONCURRENCY = 5;
    for (let i = 0; i < uncached.length; i += CONCURRENCY) {
      const batch = uncached.slice(i, i + CONCURRENCY);
      const promises = batch.map(async (id) => {
        const data = await this.getAwardData(id, userId);
        if (data) {
          results[id] = data;
        }
      });
      await Promise.all(promises);
    }

    return results;
  },

  /**
   * Invalidate all cached data
   */
  invalidateCache() {
    this._cache = {};
  },

  /**
   * Reset availability check (e.g., after network change)
   */
  resetAvailabilityCheck() {
    this._apiAvailable = null;
  }
};

// ==================== User Identity ====================

/**
 * Get current user info for API calls
 * - In Feishu: use h5sdk/tt to get open_id and name
 * - In external browser: use dev fallback
 * - Also check FeishuAuth.userInfo if available
 */
const AwardUser = {
  _cachedUser: null,

  async getCurrentUser() {
    if (this._cachedUser) return this._cachedUser;

    // 1. Try FeishuAuth.userInfo first (if auth.js is loaded and user is authenticated)
    if (typeof FeishuAuth !== 'undefined' && FeishuAuth.userInfo && FeishuAuth.userInfo.authenticated) {
      // FeishuAuth only stores authCode, not user name/open_id
      // We need to get the actual user info from Feishu SDK
    }

    // 2. Try Feishu h5sdk/tt to get user info
    if (window.h5sdk || window.tt) {
      try {
        const user = await this._getFeishuUser();
        if (user) {
          this._cachedUser = user;
          return user;
        }
      } catch (e) {
        console.warn('[AwardUser] Failed to get Feishu user info:', e.message);
      }
    }

    // 3. Fallback to dev user
    this._cachedUser = { userId: 'dev_user', username: 'Developer' };
    return this._cachedUser;
  },

  async _getFeishuUser() {
    // Try tt.getUserInfo or h5sdk user info APIs
    const tt = window.tt;
    if (!tt) return null;

    // Try tt.requestAuthCode first to ensure we have a session
    // Then try to get user info
    return new Promise((resolve) => {
      // Some Feishu H5 SDK versions support getUserInfo
      if (tt.getUserInfo) {
        tt.getUserInfo({
          success: (res) => {
            const userId = res.openId || res.open_id || res.userId || 'feishu_unknown';
            const username = res.name || res.userName || res.nick || 'Feishu User';
            resolve({ userId, username });
          },
          fail: () => {
            // If getUserInfo fails, try getting info from the auth context
            resolve(null);
          }
        });
      } else if (tt.getNetworkType) {
        // h5sdk is ready but no getUserInfo - use auth code as identifier
        if (typeof FeishuAuth !== 'undefined' && FeishuAuth.userInfo && FeishuAuth.userInfo.authCode) {
          resolve({
            userId: 'feishu_' + FeishuAuth.userInfo.authCode.substring(0, 16),
            username: 'Feishu User'
          });
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  },

  /**
   * Reset cached user (e.g., after login state change)
   */
  resetUser() {
    this._cachedUser = null;
  }
};

// Convenience function
async function getCurrentUser() {
  return AwardUser.getCurrentUser();
}

// Auto-check API availability on page load and show debug banner
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => AwardAPI.checkAvailability(), 1500);
});
