/**
 * Feishu Auth Helper v8 - with debug panel
 * Per Feishu docs: load JSSDK, then use requestAccess
 */
const FeishuAuthHelper = {
  _user: null,
  APP_ID: 'cli_aa8858d3f0a6dccd',
  _debug: [],

  _log(msg) {
    console.log('[AuthHelper] ' + msg);
    this._debug.push(msg);
    this._updateDebugPanel();
  },

  _updateDebugPanel() {
    var panel = document.getElementById('auth-debug-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'auth-debug-panel';
      panel.style.cssText = 'position:fixed;bottom:10px;left:10px;background:rgba(0,0,0,0.9);color:#0f0;font:11px/1.5 monospace;padding:10px;border-radius:8px;z-index:99999;max-width:320px;max-height:220px;overflow-y:auto;border:1px solid #0f0;cursor:pointer';
      panel.title = 'Click to dismiss';
      panel.onclick = () => panel.remove();
      document.body.appendChild(panel);
    }
    panel.innerHTML = '<b>🔍 Auth Debug</b><br>' + this._debug.map(s => '• ' + s).join('<br>');
  },

  async getUser() {
    if (this._user) return this._user;

    this._log('Feishu UA:' + /Lark|Feishu/i.test(navigator.userAgent));
    this._log('h5sdk:' + !!window.h5sdk + ' tt:' + !!window.tt);

    // Step 1: If h5sdk/tt already available
    if (window.h5sdk || window.tt) {
      this._log('SDK already exists');
      return this._tryAuth();
    }

    // Step 2: Load JSSDK dynamically (only in Feishu browser)
    var isInFeishu = /Lark|Feishu/i.test(navigator.userAgent);
    if (isInFeishu) {
      try {
        this._log('Loading JSSDK v1.5.44...');
        await this._loadJSSDK();
        await new Promise(r => setTimeout(r, 500));
        this._log('After load - h5sdk:' + !!window.h5sdk + ' tt:' + !!window.tt);
        if (window.h5sdk || window.tt) {
          return this._tryAuth();
        }
      } catch (e) {
        this._log('JSSDK load FAILED: ' + e.message);
      }
    } else {
      this._log('Not Feishu UA, skip');
    }

    return this._getFallbackUser();
  },

  _loadJSSDK() {
    return new Promise((resolve, reject) => {
      var s = document.createElement('script');
      s.src = 'https://lf-scm-cn.feishucdn.com/lark/op/h5-js-sdk-1.5.44.js';
      s.onload = () => { this._log('JSSDK script loaded'); resolve(); };
      s.onerror = (e) => { this._log('JSSDK script ERROR'); reject(e); };
      document.head.appendChild(s);
    });
  },

  async _tryAuth() {
    try {
      var h5sdk = window.h5sdk;
      var tt = window.tt;
      if (!h5sdk && !tt) {
        this._log('No SDK for auth');
        return this._getFallbackUser();
      }

      // Wait for h5sdk.ready
      if (h5sdk && h5sdk.ready) {
        this._log('Waiting h5sdk.ready...');
        await new Promise(r => h5sdk.ready(() => { this._log('h5sdk ready!'); r(); }));
      }

      // Try requestAccess first
      var code = null;
      if (tt && tt.requestAccess) {
        this._log('Trying requestAccess...');
        code = await new Promise(r => {
          tt.requestAccess({
            appID: this.APP_ID,
            scopeList: [],
            success: res => { this._log('requestAccess OK!'); r(res.code); },
            fail: err => { this._log('requestAccess FAIL: ' + JSON.stringify(err)); r(null); }
          });
        });
      } else {
        this._log('tt.requestAccess N/A');
      }

      // Fallback to requestAuthCode
      if (!code && tt && tt.requestAuthCode) {
        this._log('Trying requestAuthCode...');
        code = await new Promise(r => {
          tt.requestAuthCode({
            appId: this.APP_ID,
            success: res => { this._log('requestAuthCode OK!'); r(res.code); },
            fail: err => { this._log('requestAuthCode FAIL: ' + JSON.stringify(err)); r(null); }
          });
        });
      } else if (!code) {
        this._log('tt.requestAuthCode N/A');
      }

      if (code) {
        this._log('Got code, calling /api/auth/login...');
        return await this._loginWithCode(code);
      } else {
        this._log('No code obtained');
      }
    } catch (e) {
      this._log('Auth error: ' + e.message);
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
      this._log('Login API status: ' + res.status);
      if (res.ok) {
        const data = await res.json();
        this._log('Login response: ' + JSON.stringify(data));
        if (data.success && data.data) {
          this._user = { userId: data.data.user_id, username: data.data.username || '' };
          this._log('Got user: ' + this._user.username + ' (' + this._user.userId + ')');
          sessionStorage.setItem('feishu_user', JSON.stringify(this._user));
          return this._user;
        }
      }
    } catch (e) {
      this._log('Login FAILED: ' + e.message);
    }
    return this._getFallbackUser();
  },

  _getFallbackUser() {
    var uid = localStorage.getItem('award_uid');
    if (!uid) {
      uid = 'u_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      localStorage.setItem('award_uid', uid);
    }
    this._log('Fallback user: ' + uid);
    this._user = { userId: uid, username: '' };
    return this._user;
  }
};
