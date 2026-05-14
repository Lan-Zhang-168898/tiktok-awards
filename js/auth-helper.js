/**
 * Feishu Auth Helper - Clean version
 * Silently tries Feishu auth, falls back to random ID
 */
const FeishuAuthHelper = {
  _user: null,

  async getUser() {
    if (this._user) return this._user;

    if (window.h5sdk || window.tt) {
      try {
        var tt = window.tt || {};

        if (window.h5sdk && window.h5sdk.ready) {
          await new Promise((resolve) => {
            window.h5sdk.ready(() => resolve());
          });
        }

        var code = null;

        if (tt.requestAccess) {
          code = await new Promise((resolve) => {
            tt.requestAccess({
              appID: 'cli_aa8858d3f0a6dccd',
              scopeList: [],
              success: (res) => resolve(res.code),
              fail: () => resolve(null)
            });
          });
        }

        if (!code && tt.requestAuthCode) {
          code = await new Promise((resolve) => {
            tt.requestAuthCode({
              appId: 'cli_aa8858d3f0a6dccd',
              success: (res) => resolve(res.code),
              fail: () => resolve(null)
            });
          });
        }

        if (code) {
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
    }

    // Fallback: persistent random ID
    var uid = localStorage.getItem('award_uid');
    if (!uid) {
      uid = 'u_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      localStorage.setItem('award_uid', uid);
    }
    this._user = { userId: uid, username: '' };
    return this._user;
  }
};
