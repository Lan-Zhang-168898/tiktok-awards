/**
 * Feishu Auth Helper
 * Follows official Feishu H5 SSO flow:
 * 1. Load h5sdk (in HTML <script> tag)
 * 2. Call h5sdk.config() with appId
 * 3. Wait for h5sdk.ready()
 * 4. Call tt.requestAuthCode() in ready callback
 */
const FeishuAuthHelper = {
  _initialized: false,
  _user: null,

  async getUser() {
    if (this._user) return this._user;

    // Check if h5sdk is available
    if (!window.h5sdk) {
      console.log('[AuthHelper] No h5sdk, using fallback');
      return this._getFallbackUser();
    }

    try {
      // Step 1: Configure h5sdk
      await new Promise((resolve, reject) => {
        window.h5sdk.config({
          appId: 'cli_aa8858d3f0a6dccd',
          timestamp: Date.now(),
          nonceStr: Math.random().toString(36).substring(2),
          signature: '', // Not needed for web app SSO
          onSuccess: () => { console.log('[AuthHelper] h5sdk.config success'); resolve(); },
          onFail: (err) => { console.warn('[AuthHelper] h5sdk.config fail:', err); resolve(); } // Don't reject, just continue
        });
      });

      // Step 2: Wait for h5sdk.ready
      await new Promise((resolve) => {
        window.h5sdk.ready(() => { console.log('[AuthHelper] h5sdk ready'); resolve(); });
      });

      // Step 3: Request auth code
      if (!window.tt || !window.tt.requestAuthCode) {
        console.warn('[AuthHelper] tt.requestAuthCode not available');
        return this._getFallbackUser();
      }

      const code = await new Promise((resolve) => {
        window.tt.requestAuthCode({
          appId: 'cli_aa8858d3f0a6dccd',
          success: (res) => { console.log('[AuthHelper] Got auth code'); resolve(res.code); },
          fail: (err) => { console.warn('[AuthHelper] requestAuthCode fail:', JSON.stringify(err)); resolve(null); }
        });
      });

      if (!code) {
        return this._getFallbackUser();
      }

      // Step 4: Exchange code for user info via AIPA backend
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
            console.log('[AuthHelper] Got Feishu user:', this._user.username);
            return this._user;
          }
        }
      } catch (e) {
        console.warn('[AuthHelper] AIPA login failed:', e.message);
      }
    } catch (e) {
      console.warn('[AuthHelper] Feishu auth error:', e.message);
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
