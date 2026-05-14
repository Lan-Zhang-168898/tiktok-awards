/**
 * Feishu Auth Helper v6 - with visible debug
 */
const FeishuAuthHelper = {
  _user: null,
  APP_ID: 'cli_aa8858d3f0a6dccd',

  _log(s) {
    console.log('[AuthHelper]', s);
    var d = document.getElementById('auth-dbg');
    if (!d) {
      d = document.createElement('div');
      d.id = 'auth-dbg';
      d.style.cssText = 'position:fixed;bottom:10px;left:10px;background:#111;color:#0f0;padding:8px 12px;font:11px/1.4 monospace;z-index:99999;border-radius:6px;max-width:400px;max-height:200px;overflow-y:auto;cursor:pointer;opacity:0.9';
      d.onclick = function(){ d.remove(); };
      document.body.appendChild(d);
    }
    d.innerHTML += s + '<br>';
    d.scrollTop = d.scrollHeight;
  },

  async getUser() {
    if (this._user) return this._user;

    // Step 1: Check AIPA headers
    this._log('Checking headers...');
    try {
      var headersRes = await fetch('https://da1e5fb0.aipa.bytedance.net/api/auth/headers', {
        signal: AbortSignal.timeout(5000)
      });
      var headersText = await headersRes.text();
      this._log('Headers: ' + headersText.substring(0, 300));
    } catch (e) {
      this._log('Headers fail: ' + e.message);
    }

    // Step 2: Check h5sdk/tt
    this._log('h5sdk:' + !!window.h5sdk + ' tt:' + !!window.tt);

    if (window.h5sdk || window.tt) {
      this._log('SDK available, trying auth...');
      try {
        if (window.h5sdk && window.h5sdk.ready) {
          await new Promise(r => window.h5sdk.ready(() => { this._log('h5sdk ready'); r(); }));
        }
        var tt = window.tt || {};
        var code = null;

        if (tt.requestAccess) {
          this._log('Trying requestAccess...');
          code = await new Promise(r => {
            tt.requestAccess({ appID: this.APP_ID, scopeList: [],
              success: res => { this._log('requestAccess OK!'); r(res.code); },
              fail: err => { this._log('requestAccess fail: ' + JSON.stringify(err)); r(null); }
            });
          });
        }
        if (!code && tt.requestAuthCode) {
          this._log('Trying requestAuthCode...');
          code = await new Promise(r => {
            tt.requestAuthCode({ appId: this.APP_ID,
              success: res => { this._log('requestAuthCode OK!'); r(res.code); },
              fail: err => { this._log('requestAuthCode fail: ' + JSON.stringify(err)); r(null); }
            });
          });
        }

        if (code) {
          this._log('Got code, logging in...');
          var loginRes = await fetch('https://da1e5fb0.aipa.bytedance.net/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code }),
            signal: AbortSignal.timeout(8000)
          });
          var loginText = await loginRes.text();
          this._log('Login: ' + loginText.substring(0, 200));
          var loginData = JSON.parse(loginText);
          if (loginData.success && loginData.data) {
            this._user = { userId: loginData.data.user_id, username: loginData.data.username || '' };
            this._log('User: ' + this._user.username);
            return this._user;
          }
        }
      } catch (e) {
        this._log('SDK error: ' + e.message);
      }
    }

    // Fallback
    this._log('Using fallback ID');
    var uid = localStorage.getItem('award_uid');
    if (!uid) {
      uid = 'u_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      localStorage.setItem('award_uid', uid);
    }
    this._user = { userId: uid, username: '' };
    return this._user;
  }
};
