/**
 * Feishu H5 Authentication Module
 * Handles Feishu client detection and SSO login for static websites
 */

const FeishuAuth = {
  // App ID from Feishu Developer Console
  APP_ID: 'cli_a968a864a0f89bdd',
  
  // Website URL
  WEBSITE_URL: 'https://lan-zhang-168898.github.io/tiktok-awards/',
  
  // State to track authentication status
  isAuthenticated: false,
  userInfo: null,
  
  // Flag to track if we should show fallback UI
  showFallbackUI: false,
  
  /**
   * Check if running inside Feishu client
   */
  isInFeishu() {
    return !!(window.h5sdk || window.tt);
  },
  
  /**
   * Get current page URL (for redirect after auth)
   */
  getCurrentUrl() {
    return window.location.href.split('?')[0]; // Remove any query params
  },
  
  /**
   * Attempt to open URL in Feishu app via URL Scheme
   * Returns true if attempt was made, false if URL scheme not supported
   */
  tryOpenInFeishu() {
    // Direct open the app in Feishu workspace
    // This will open the app directly without needing to search
    const scheme = `lark://client/workspace/app?appId=${this.APP_ID}`;
    
    console.log('[FeishuAuth] Attempting to open app in Feishu workspace:', scheme);
    
    // Direct navigation
    window.location.href = scheme;
    
    return true;
  },
  
  /**
   * Open in Feishu with user interaction (for button click)
   */
  openInFeishu() {
    const currentUrl = window.location.href;
    const targetUrl = encodeURIComponent(currentUrl);
    
    // Primary: Open current page in Feishu web view
    const scheme = `lark://client/web/url?url=${targetUrl}`;
    
    // Try opening
    window.location.href = scheme;
    
    // If we're still here after 1.5s, Feishu is not installed
    setTimeout(() => {
      this.showExternalAccessMessage();
    }, 1500);
  },
  
  /**
   * Initialize authentication flow
   */
  async init() {
    console.log('[FeishuAuth] Initializing...');
    console.log('[FeishuAuth] Is in Feishu:', this.isInFeishu());
    
    // Check if already authenticated (session storage)
    const storedAuth = sessionStorage.getItem('feishu_auth');
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      if (authData.expires > Date.now()) {
        console.log('[FeishuAuth] Using cached authentication');
        this.isAuthenticated = true;
        this.userInfo = authData.userInfo;
        this.showContent();
        return;
      } else {
        sessionStorage.removeItem('feishu_auth');
      }
    }
    
    // Check URL for auth code (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      console.log('[FeishuAuth] Received code from URL');
      await this.handleAuthCallback(code);
      return;
    }
    
    if (this.isInFeishu()) {
      await this.initFeishuSSO();
    } else {
      // External browser - try to open in Feishu automatically
      this.handleExternalBrowser();
    }
  },
  
  /**
   * Handle external browser - try to redirect to Feishu
   */
  handleExternalBrowser() {
    console.log('[FeishuAuth] External browser detected, attempting to open Feishu...');
    
    // First, try to open in Feishu automatically
    this.tryOpenInFeishu();
    
    // Show loading state first
    this.showRedirectingMessage();
    
    // After 2 seconds, check if we were able to redirect
    // If window is still visible (user didn't switch to Feishu), show the fallback UI
    setTimeout(() => {
      // Check if document is still visible (user didn't switch to Feishu app)
      if (!document.hidden && document.visibilityState === 'visible') {
        this.showExternalAccessMessage();
      }
    }, 2000);
    
    // Also listen for visibility change as backup
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.isAuthenticated) {
        // User came back from Feishu or Feishu is not installed
        this.showExternalAccessMessage();
      }
    });
  },
  
  /**
   * Initialize Feishu SSO flow
   */
  initFeishuSSO() {
    return new Promise((resolve, reject) => {
      if (!window.h5sdk) {
        console.log('[FeishuAuth] h5sdk not available, trying tt directly');
        this.tryTTAuth();
        resolve();
        return;
      }
      
      window.h5sdk.error((err) => {
        console.error('[FeishuAuth] SDK error:', err);
        this.showError('Feishu SDK initialization failed');
        reject(err);
      });
      
      window.h5sdk.ready(() => {
        console.log('[FeishuAuth] h5sdk ready, requesting auth code');
        this.requestAuthCode();
        resolve();
      });
    });
  },
  
  /**
   * Try direct tt.authCode request
   */
  tryTTAuth() {
    if (window.tt && window.tt.requestAuthCode) {
      window.tt.requestAuthCode({
        appId: this.APP_ID,
        success: (res) => {
          console.log('[FeishuAuth] Got auth code via tt:', res);
          this.handleAuthCode(res.code);
        },
        fail: (err) => {
          console.error('[FeishuAuth] tt.requestAuthCode failed:', err);
          this.handleExternalBrowser();
        }
      });
    } else {
      console.log('[FeishuAuth] tt.requestAuthCode not available');
      this.handleExternalBrowser();
    }
  },
  
  /**
   * Request auth code via h5sdk
   */
  requestAuthCode() {
    if (!window.tt || !window.tt.requestAuthCode) {
      console.log('[FeishuAuth] requestAuthCode not available');
      this.tryRequestAccess();
      return;
    }
    
    window.tt.requestAuthCode({
      appId: this.APP_ID,
      success: (res) => {
        console.log('[FeishuAuth] Got auth code:', res.code);
        this.handleAuthCode(res.code);
      },
      fail: (err) => {
        console.error('[FeishuAuth] requestAuthCode failed:', err);
        this.showError('Failed to get authentication code');
      }
    });
  },
  
  /**
   * Try requestAccess API as fallback
   */
  tryRequestAccess() {
    if (window.tt && window.tt.requestAccess) {
      window.tt.requestAccess({
        appID: this.APP_ID,
        scopeList: [],
        success: (res) => {
          console.log('[FeishuAuth] Got code via requestAccess:', res);
          this.handleAuthCode(res.code);
        },
        fail: (err) => {
          console.error('[FeishuAuth] requestAccess failed:', err);
          this.handleExternalBrowser();
        }
      });
    } else {
      this.handleExternalBrowser();
    }
  },
  
  /**
   * Handle auth code - for static sites, code itself is identity proof
   */
  handleAuthCode(code) {
    console.log('[FeishuAuth] Auth code received, user is authenticated');
    
    this.isAuthenticated = true;
    this.userInfo = {
      authenticated: true,
      authCode: code,
      timestamp: Date.now()
    };
    
    // Save to session storage (expires in 2 hours)
    sessionStorage.setItem('feishu_auth', JSON.stringify({
      userInfo: this.userInfo,
      expires: Date.now() + (2 * 60 * 60 * 1000)
    }));
    
    this.cleanUrl();
    this.showContent();
  },
  
  /**
   * Handle OAuth callback
   */
  async handleAuthCallback(code) {
    console.log('[FeishuAuth] Processing OAuth callback');
    await this.handleAuthCode(code);
  },
  
  /**
   * Clean URL by removing auth parameters
   */
  cleanUrl() {
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
  },
  
  /**
   * Show redirecting message (before trying Feishu)
   */
  showRedirectingMessage() {
    const overlay = document.getElementById('auth-overlay');
    const content = document.getElementById('main-content');
    
    if (content) {
      content.style.display = 'none';
    }
    
    if (overlay) {
      overlay.innerHTML = this.getRedirectingHTML();
      overlay.style.display = 'flex';
    }
  },
  
  /**
   * Show external access message
   */
  showExternalAccessMessage(customMessage = null) {
    console.log('[FeishuAuth] Showing external access message');
    
    const overlay = document.getElementById('auth-overlay');
    const content = document.getElementById('main-content');
    
    if (content) {
      content.style.display = 'none';
    }
    
    if (overlay) {
      overlay.innerHTML = this.getExternalAccessHTML(customMessage);
      overlay.style.display = 'flex';
    }
    
    document.body.classList.add('external-access');
  },
  
  /**
   * Show error message
   */
  showError(message) {
    console.log('[FeishuAuth] Showing error:', message);
    
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
      overlay.innerHTML = this.getErrorHTML(message);
      overlay.style.display = 'flex';
    }
  },
  
  /**
   * Show main content after successful auth
   */
  showContent() {
    console.log('[FeishuAuth] Showing content');
    
    const overlay = document.getElementById('auth-overlay');
    const content = document.getElementById('main-content');
    
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    if (content) {
      content.style.display = 'block';
    }
    
    window.dispatchEvent(new CustomEvent('feishu-auth-success', {
      detail: this.userInfo
    }));
  },
  
  /**
   * HTML for redirecting state
   */
  getRedirectingHTML() {
    return `
      <div class="auth-container">
        <div class="auth-icon redirecting">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#FF2D55" stroke-width="2" opacity="0.3"/>
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#FF2D55"/>
            <circle cx="12" cy="12" r="3" fill="#FF2D55"/>
          </svg>
        </div>
        <h1 class="auth-title">Opening in Feishu...</h1>
        <p class="auth-description">
          Please wait, we're opening this page in the Feishu app.
        </p>
        <div class="auth-loading">
          <div class="spinner"></div>
          <p style="color: var(--text-secondary); font-size: 13px;">If nothing happens, tap the button below</p>
        </div>
        <div class="auth-footer" style="margin-top: var(--spacing-xl);">
          <button onclick="FeishuAuth.openInFeishu()" class="auth-btn">
            Open in Feishu
          </button>
        </div>
      </div>
    `;
  },
  
  /**
   * HTML for external access message
   */
  getExternalAccessHTML(customMessage = null) {
    return `
      <div class="auth-container">
        <div class="auth-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#FF2D55" stroke-width="2"/>
            <path d="M12 7V13M12 16V17" stroke="#FF2D55" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="auth-title">Open in Feishu</h1>
        <p class="auth-description">
          ${customMessage || 'This internal website requires access through the Feishu app.'}
        </p>
        <div class="auth-actions">
          <button onclick="FeishuAuth.openInFeishu()" class="auth-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.05 19.44 4 16.08 4 12C4 11.38 4.08 10.79 4.21 10.21L9 15V16C9 17.1 9.9 18 11 18V19.93ZM17.9 17.39C17.64 16.58 16.9 16 16 16H15V13C15 12.45 14.55 12 14 12H8V10H10C10.55 10 11 9.55 11 9V7H13C14.1 7 15 6.1 15 5V4.59C17.93 5.78 20 8.65 20 12C20 14.08 19.19 15.97 17.9 17.39Z"/>
            </svg>
            Open in Feishu App
          </button>
        </div>
        <div class="auth-instructions">
          <h3>How to Access</h3>
          <ol>
            <li>
              <strong>Tap "Open in Feishu" above</strong>
              <p>This will launch the Feishu app</p>
            </li>
            <li>
              <strong>Sign in to Feishu</strong>
              <p>Use your company account to log in</p>
            </li>
            <li>
              <strong>Access Granted</strong>
              <p>You'll be able to view this website content</p>
            </li>
          </ol>
        </div>
        <div class="auth-footer">
          <p>Don't have Feishu installed?</p>
          <a href="https://www.feishu.cn/download" target="_blank" class="auth-btn secondary">
            Download Feishu
          </a>
        </div>
      </div>
    `;
  },
  
  /**
   * HTML for error message
   */
  getErrorHTML(message) {
    return `
      <div class="auth-container">
        <div class="auth-icon error">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#FF3B30" stroke-width="2"/>
            <path d="M15 9L9 15M9 9L15 15" stroke="#FF3B30" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="auth-title">Authentication Failed</h1>
        <p class="auth-description">${message || 'Unable to verify your identity.'}</p>
        <div class="auth-footer">
          <button onclick="location.reload()" class="auth-btn secondary">
            Try Again
          </button>
        </div>
      </div>
    `;
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  FeishuAuth.init();
});

// Export for use in other scripts
window.FeishuAuth = FeishuAuth;
