/**
 * Feishu Auth Helper v9
 * Per Feishu docs: load JSSDK, then use requestAccess
 * No visible UI - console logging only
 */
const FeishuAuthHelper = {
  _user: null,
  APP_ID: 'cli_aa8858d3f0a6dccd',

  // Suppress Feishu SDK error banners
  _suppressSDKErrors() {
    // Hide any SDK-injected error banners via CSS
    var style = document.createElement('style');
    style.textContent = '[class*="sdk-error"],[class*="auth-error"],[class*="lark-error"],[id*="sdk-error"],[id*="auth-error"],.error-toast,.sdk-error-bar,[class*="error-bar"],[class*="Error"],[class*="notice-bar"]{display:none!important}';
    document.head.appendChild(style);

    // Also use MutationObserver to remove any SDK error popups
    var self = this;
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            var text = node.textContent || '';
            if (text.includes('认证失败') || text.includes('授权失败') || text.includes('Auth fail') || text.includes('Error')) {
              if (!node.querySelector || (!node.querySelector('img') && !node.querySelector('.award-card'))) {
                // Likely an SDK error banner, hide it
                node.style.display = 'none';
                console.log('[Auth] Suppressed SDK banner:', text.substring(0, 50));
              }
            }
          }
        });
      });
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Intercept h5sdk.error
    if (window.h5sdk && window.h5sdk.error) {
      window.h5sdk.error(function(err) {
        console.warn('[Auth] h5sdk error (suppressed):', JSON.stringify(err));
      });
    }
  },

  async getUser() {
    if (this._user) return this._user;

    var isInFeishu = /Lark|Feishu/i.test(navigator.userAgent);
    console.log('[Auth] Feishu UA:', isInFeishu, 'h5sdk:', !!window.h5sdk, 'tt:', !!window.tt);

    // Suppress SDK error banners early
    this._suppressSDKErrors();

    // Step 1: If h5sdk/tt already available
    if (window.h5sdk || window.tt) {
      return this._tryAuth();
    }

    // Step 2: Load JSSDK dynamically (only in Feishu browser)
    if (isInFeishu) {
      try {
        await this._loadJSSDK();
        await new Promise(r => setTimeout(r, 500));
        console.log('[Auth] After load - h5sdk:', !!window.h5sdk, 'tt:', !!window.tt);
        this._suppressSDKErrors();
        if (window.h5sdk || window.tt) {
          return this._tryAuth();
        }
      } catch (e) {
        console.warn('[Auth] JSSDK load failed:', e);
      }
    }

    return this._getFallbackUser();
  },

  _loadJSSDK() {
    return new Promise((resolve, reject) => {
      var s = document.createElement('script');
      s.src = 'https://lf-scm-cn.feishucdn.com/lark/op/h5-js-sdk-1.5.44.js';
      s.onload = () => { console.log('[Auth] JSSDK loaded'); resolve(); };
      s.onerror = (e) => { console.warn('[Auth] JSSDK load error'); reject(e); };
      document.head.appendChild(s);
    });
  },

  async _tryAuth() {
    try {
      var h5sdk = window.h5sdk;
      var tt = window.tt;
      if (!h5sdk && !tt) return this._getFallbackUser();

      // Wait for h5sdk.ready
      if (h5sdk && h5sdk.ready) {
        await new Promise(r => h5sdk.ready(() => { console.log('[Auth] h5sdk ready'); r(); }));
      }

      // Try requestAccess first
      var code = null;
      if (tt && tt.requestAccess) {
        console.log('[Auth] Trying requestAccess...');
        code = await new Promise(r => {
          tt.requestAccess({
            appID: this.APP_ID,
            scopeList: [],
            success: res => { console.log('[Auth] requestAccess OK'); r(res.code); },
            fail: err => { console.warn('[Auth] requestAccess fail:', JSON.stringify(err)); r(null); }
          });
        });
      }

      // Fallback to requestAuthCode
      if (!code && tt && tt.requestAuthCode) {
        console.log('[Auth] Trying requestAuthCode...');
        code = await new Promise(r => {
          tt.requestAuthCode({
            appId: this.APP_ID,
            success: res => { console.log('[Auth] requestAuthCode OK'); r(res.code); },
            fail: err => { console.warn('[Auth] requestAuthCode fail:', JSON.stringify(err)); r(null); }
          });
        });
      }

      if (code) {
        console.log('[Auth] Got code, calling login...');
        return await this._loginWithCode(code);
      } else {
        console.warn('[Auth] No code obtained');
      }
    } catch (e) {
      console.warn('[Auth] Error:', e.message);
    }
    return this._getFallbackUser();
  },

  async _loginWithCode(code) {
    try {
      const res = await fetch('https://da1e5fb0.aipa.bytedance.net/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code }),
        signal: AbortSignal.timeout(8000)
      });
      console.log('[Auth] Login API status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[Auth] Login response:', JSON.stringify(data));
        if (data.success && data.data) {
          this._user = { userId: data.data.user_id, username: data.data.username || '' };
          console.log('[Auth] Got user:', this._user.username, this._user.userId);
          sessionStorage.setItem('feishu_user', JSON.stringify(this._user));
          return this._user;
        }
      }
    } catch (e) {
      console.warn('[Auth] Login failed:', e.message);
    }
    return this._getFallbackUser();
  },

  _getFallbackUser() {
    var uid = localStorage.getItem('award_uid');
    if (!uid) {
      uid = 'u_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      localStorage.setItem('award_uid', uid);
    }
    console.log('[Auth] Using fallback user:', uid);
    this._user = { userId: uid, username: '' };
    return this._user;
  }
};
