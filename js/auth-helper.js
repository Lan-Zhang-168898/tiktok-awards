/**
 * Feishu Auth Helper v3
 * Dynamically loads h5sdk script, then tries requestAccess/requestAuthCode
 */
const FeishuAuthHelper = {
  _user: null,

  async getUser() {
    if (this._user) return this._user;

    // Step 1: If h5sdk/tt already available, use it directly
    if (window.h5sdk || window.tt) {
      return this._tryAuth();
    }

    // Step 2: Check if we're in Feishu browser (by user agent)
    var ua = navigator.userAgent;
    var isInFeishu = /Lark|Feishu/i.test(ua);

    if (!isInFeishu) {
      console.log('[AuthHelper] Not in Feishu browser');
      return this._getFallbackUser();
    }

    // Step 3: In Feishu browser but no SDK - try to load it dynamically
    console.log('[AuthHelper] In Feishu browser, loading h5sdk...');
    try {
      await this._loadH5SDK();
      // Wait a bit for SDK to initialize
      await new Promise(r => setTimeout(r, 500));
      if (window.h5sdk || window.tt) {
        return this._tryAuth();
      }
    } catch (e) {
      console.warn('[AuthHelper] Failed to load h5sdk:', e);
    }

    return this._getFallbackUser();
  },

  async _loadH5SDK() {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="h5-js-sdk"]')) {
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.src = 'https://lf1-cdn-tos.bytegoofy.com/goofy/lark/op/h5-js-sdk-1.5.16.js';
      script.onload = () => {
        console.log('[AuthHelper] h5sdk script loaded');
        resolve();
      };
      script.onerror = (e) => {
        console.warn('[AuthHelper] h5sdk script load failed');
        reject(e);
      };
      document.head.appendChild(script);
    });
  },

  async _tryAuth() {
    try {
      var tt = window.tt || {};
      var h5sdk = window.h5sdk;

      // Call h5sdk.config if available
      if (h5sdk && h5sdk.config) {
        console.log('[AuthHelper] Calling h5sdk.config...');
        await new Promise((resolve) => {
          h5sdk.config({
            appId: 'cli_aa8858d3f0a6dccd',
            timestamp: Date.now(),
            nonceStr: Math.random().toString(36).substring(2),
            signature: '',
            onSuccess: () => { console.log('[AuthHelper] h5sdk.config success'); resolve(); },
            onFail: (err) => { console.warn('[AuthHelper] h5sdk.config fail:', err); resolve(); }
          });
        });
      }

      // Wait for h5sdk.ready
      if (h5sdk && h5sdk.ready) {
        await new Promise((resolve) => {
          h5sdk.ready(() => { console.log('[AuthHelper] h5sdk ready'); resolve(); });
        });
      }

      // Try requestAccess first, then requestAuthCode
      var code = null;

      if (tt.requestAccess) {
        console.log('[AuthHelper] Trying requestAccess...');
        code = await new Promise((resolve) => {
          tt.requestAccess({
            appID: 'cli_aa8858d3f0a6dccd',
            scopeList: [],
            success: (res) => { console.log('[AuthHelper] requestAccess OK'); resolve(res.code); },
            fail: (err) => { console.warn('[AuthHelper] requestAccess fail:', JSON.stringify(err)); resolve(null); }
          });
        });
      }

      if (!code && tt.requestAuthCode) {
        console.log('[AuthHelper] Trying requestAuthCode...');
        code = await new Promise((resolve) => {
          tt.requestAuthCode({
            appId: 'cli_aa8858d3f0a6dccd',
            success: (res) => { console.log('[AuthHelper] requestAuthCode OK'); resolve(res.code); },
            fail: (err) => { console.warn('[AuthHelper] requestAuthCode fail:', JSON.stringify(err)); resolve(null); }
          });
        });
      }

      if (code) {
        console.log('[AuthHelper] Got code, sending to AIPA...');
        try {
          const loginRes = await fetch('https://da1e5fb0.aipa.bytedance.net/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code }),
            signal: AbortSignal.timeout(8000)
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            if (loginData.success && loginData.data) {
              this._user = { userId: loginData.data.user_id, username: loginData.data.username || '' };
              console.log('[AuthHelper] Got user:', this._user.username);
              return this._user;
            }
          }
        } catch (e) {
          console.warn('[AuthHelper] AIPA login failed:', e.message);
        }
      }
    } catch (e) {
      console.warn('[AuthHelper] Auth error:', e.message);
    }

    return this._getFallbackUser();
  },

  _getFallbackUser() {
    var uid = localStorage.getItem('award_uid');
    if (!uid) {
      uid = 'u_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      localStorage.setItem('award_uid', uid);
    }
    this._user = { userId: uid, username: '' };
    return this._user;
  }
};
