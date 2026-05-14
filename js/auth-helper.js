/**
 * Feishu Auth Helper with Debug
 */
const FeishuAuthHelper = {
  _user: null,
  _dbg: null,

  _log(s) {
    console.log('[AuthHelper]', s);
    if (this._dbg) { this._dbg.innerHTML += s + '<br>'; this._dbg.scrollTop = this._dbg.scrollHeight; }
  },

  async getUser() {
    if (this._user) return this._user;

    // Debug banner
    this._dbg = document.createElement('div');
    this._dbg.style.cssText = 'position:fixed;bottom:10px;left:10px;background:#222;color:#0f0;padding:8px 12px;font:11px/1.4 monospace;z-index:99999;border-radius:4px;max-width:350px;cursor:pointer';
    this._dbg.onclick = () => this._dbg.remove();
    document.body.appendChild(this._dbg);

    this._log('h5sdk:' + !!window.h5sdk + ' tt:' + !!window.tt);
    this._log('requestAccess:' + !!(window.tt && window.tt.requestAccess));
    this._log('requestAuthCode:' + !!(window.tt && window.tt.requestAuthCode));

    if (!window.h5sdk && !window.tt) {
      this._log('No SDK -> fallback');
      return this._getFallbackUser();
    }

    try {
      // Step 1: h5sdk.config if available
      if (window.h5sdk && window.h5sdk.config) {
        this._log('Calling h5sdk.config...');
        await new Promise((resolve) => {
          window.h5sdk.config({
            appId: 'cli_aa8858d3f0a6dccd',
            timestamp: Date.now(),
            nonceStr: Math.random().toString(36).substring(2),
            signature: '',
            onSuccess: () => { this._log('h5sdk.config OK'); resolve(); },
            onFail: (err) => { this._log('h5sdk.config FAIL:' + JSON.stringify(err)); resolve(); }
          });
        });
      }

      // Step 2: Wait for h5sdk.ready
      if (window.h5sdk && window.h5sdk.ready) {
        this._log('Waiting h5sdk.ready...');
        await new Promise((resolve) => {
          window.h5sdk.ready(() => { this._log('h5sdk ready!'); resolve(); });
        });
      }

      // Step 3: Try requestAccess first, then requestAuthCode
      var code = null;
      var tt = window.tt || {};

      if (tt.requestAccess) {
        this._log('Trying requestAccess...');
        code = await new Promise((resolve) => {
          tt.requestAccess({
            appID: 'cli_aa8858d3f0a6dccd',
            scopeList: [],
            success: (res) => { this._log('requestAccess OK!'); resolve(res.code); },
            fail: (err) => { this._log('requestAccess FAIL:' + JSON.stringify(err)); resolve(null); }
          });
        });
      }

      if (!code && tt.requestAuthCode) {
        this._log('Trying requestAuthCode...');
        code = await new Promise((resolve) => {
          tt.requestAuthCode({
            appId: 'cli_aa8858d3f0a6dccd',
            success: (res) => { this._log('requestAuthCode OK!'); resolve(res.code); },
            fail: (err) => { this._log('requestAuthCode FAIL:' + JSON.stringify(err)); resolve(null); }
          });
        });
      }

      if (!code) {
        this._log('No code -> fallback');
        return this._getFallbackUser();
      }

      // Step 4: Exchange code for user info
      this._log('Sending code to AIPA...');
      try {
        const loginRes = await fetch('https://da1e5fb0.aipa.bytedance.net/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code }),
          signal: AbortSignal.timeout(8000)
        });
        this._log('AIPA status:' + loginRes.status);
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          this._log('AIPA response:' + JSON.stringify(loginData));
          if (loginData.success && loginData.data) {
            this._user = { userId: loginData.data.user_id, username: loginData.data.username || '' };
            this._log('Got user: ' + this._user.username);
            return this._user;
          }
        }
      } catch (e) {
        this._log('AIPA error:' + e.message);
      }
    } catch (e) {
      this._log('Auth error:' + e.message);
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
    this._log('Fallback uid:' + uid);
    return this._user;
  }
};
