/**
 * Feishu Auth Helper v6
 * 1. Check headers for user info
 * 2. Try requestAccess/requestAuthCode if h5sdk/tt available
 * 3. Fallback to random ID
 */
const FeishuAuthHelper = {
  _user: null,
  APP_ID: 'cli_aa8858d3f0a6dccd',

  async getUser() {
    if (this._user) return this._user;

    // Step 1: Try AIPA headers endpoint to see what Feishu sends
    try {
      var headersRes = await fetch('https://da1e5fb0.aipa.bytedance.net/api/auth/headers', {
        signal: AbortSignal.timeout(5000)
      });
      if (headersRes.ok) {
        var headersData = await headersRes.json();
        console.log('[AuthHelper] Headers response:', JSON.stringify(headersData));
        // Check if headers contain user info
        if (headersData.user_id || headersData.open_id) {
          this._user = {
            userId: headersData.user_id || headersData.open_id,
            username: headersData.username || headersData.name || ''
          };
          console.log('[AuthHelper] Got user from headers:', this._user.username);
          return this._user;
        }
      }
    } catch (e) {
      console.warn('[AuthHelper] Headers check failed:', e.message);
    }

    // Step 2: Try h5sdk/tt if available (won't be in Feishu desktop, but just in case)
    if (window.h5sdk || window.tt) {
      try {
        if (window.h5sdk && window.h5sdk.ready) {
          await new Promise(r => window.h5sdk.ready(() => r()));
        }
        var tt = window.tt || {};
        var code = null;

        if (tt.requestAccess) {
          code = await new Promise(r => {
            tt.requestAccess({ appID: this.APP_ID, scopeList: [],
              success: res => r(res.code), fail: () => r(null) });
          });
        }
        if (!code && tt.requestAuthCode) {
          code = await new Promise(r => {
            tt.requestAuthCode({ appId: this.APP_ID,
              success: res => r(res.code), fail: () => r(null) });
          });
        }

        if (code) {
          var loginRes = await fetch('https://da1e5fb0.aipa.bytedance.net/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code }),
            signal: AbortSignal.timeout(8000)
          });
          if (loginRes.ok) {
            var loginData = await loginRes.json();
            if (loginData.success && loginData.data) {
              this._user = { userId: loginData.data.user_id, username: loginData.data.username || '' };
              sessionStorage.setItem('feishu_user', JSON.stringify(this._user));
              return this._user;
            }
          }
        }
      } catch (e) {
        console.warn('[AuthHelper] SDK auth failed:', e.message);
      }
    }

    // Step 3: Fallback
    var uid = localStorage.getItem('award_uid');
    if (!uid) {
      uid = 'u_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      localStorage.setItem('award_uid', uid);
    }
    this._user = { userId: uid, username: '' };
    return this._user;
  }
};
