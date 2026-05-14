/**
 * Feishu Auth Helper v5 - Safe OAuth redirect
 * Prevents infinite redirect loops
 */
const FeishuAuthHelper = {
  _user: null,
  APP_ID: 'cli_aa8858d3f0a6dccd',

  async getUser() {
    if (this._user) return this._user;

    // Step 1: Check URL for code (from OAuth callback)
    var urlParams = new URLSearchParams(window.location.search);
    var code = urlParams.get('code');

    if (code) {
      console.log('[AuthHelper] Got code from URL');
      // Clean URL immediately
      var cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);

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
            sessionStorage.setItem('feishu_user', JSON.stringify(this._user));
            return this._user;
          }
        }
      } catch (e) {
        console.warn('[AuthHelper] AIPA login failed:', e.message);
      }
      // Code exchange failed - mark this attempt to prevent retry loop
      sessionStorage.setItem('auth_attempted', 'true');
      console.warn('[AuthHelper] Code exchange failed, using fallback');
      return this._getFallbackUser();
    }

    // Step 2: Check cached user
    var cached = sessionStorage.getItem('feishu_user');
    if (cached) {
      try {
        this._user = JSON.parse(cached);
        if (this._user && this._user.userId) return this._user;
      } catch (e) {}
    }

    // Step 3: Check if we already tried OAuth this session (prevent loop)
    if (sessionStorage.getItem('auth_attempted') === 'true') {
      console.log('[AuthHelper] Already tried OAuth this session, using fallback');
      return this._getFallbackUser();
    }

    // Step 4: If in Feishu, redirect to OAuth ONCE
    var isInFeishu = /Lark|Feishu/i.test(navigator.userAgent);
    if (isInFeishu) {
      sessionStorage.setItem('auth_attempted', 'true');
      var redirectUri = encodeURIComponent(window.location.href.split('?')[0].split('#')[0]);
      var oauthUrl = 'https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=' + this.APP_ID + '&redirect_uri=' + redirectUri;
      console.log('[AuthHelper] Redirecting to OAuth');
      window.location.href = oauthUrl;
      return new Promise(() => {});
    }

    // Step 5: Not in Feishu, fallback
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
