/**
 * Feishu H5 Authentication Module
 * Handles Feishu client detection and SSO login for static websites
 */

const FeishuAuth = {
  // App ID from Feishu Developer Console
  APP_ID: 'cli_a968a864a0f89bdd',
  
  // State to track authentication status
  isAuthenticated: false,
  userInfo: null,
  
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
      this.showExternalAccessMessage();
    }
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
          // Fallback: treat as external access with Feishu app info
          this.showExternalAccessMessage('Feishu version may be too old');
        }
      });
    } else {
      console.log('[FeishuAuth] tt.requestAuthCode not available');
      this.showExternalAccessMessage();
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
          this.showError('Authentication failed');
        }
      });
    } else {
      this.showError('Feishu authentication not available');
    }
  },
  
  /**
   * Handle auth code - for static sites, code itself is identity proof
   * In a full implementation, this would be sent to a backend
   */
  handleAuthCode(code) {
    // For static website, the presence of a valid code from Feishu
    // proves the user is authenticated in Feishu
    console.log('[FeishuAuth] Auth code received, user is authenticated');
    
    // Store authentication state
    this.isAuthenticated = true;
    this.userInfo = {
      authenticated: true,
      authCode: code,
      timestamp: Date.now()
    };
    
    // Save to session storage (expires in 2 hours)
    sessionStorage.setItem('feishu_auth', JSON.stringify({
      userInfo: this.userInfo,
      expires: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
    }));
    
    // Clean up URL
    this.cleanUrl();
    
    // Show content
    this.showContent();
  },
  
  /**
   * Handle OAuth callback (for web OAuth flow)
   */
  async handleAuthCallback(code) {
    // This would be called if using web OAuth redirect
    console.log('[FeishuAuth] Processing OAuth callback');
    
    // For static sites, just use the code as identity proof
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
    
    // Also update page body class
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
    
    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('feishu-auth-success', {
      detail: this.userInfo
    }));
  },
  
  /**
   * HTML for external access message
   */
  getExternalAccessHTML(customMessage = null) {
    return `
      <div class="auth-container">
        <div class="auth-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#8E8E93"/>
            <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="#8E8E93"/>
            <circle cx="12" cy="12" r="3" fill="#FF2D55"/>
          </svg>
        </div>
        <h1 class="auth-title">Internal Access Only</h1>
        <p class="auth-description">
          ${customMessage || 'This website is only accessible through Feishu (Lark).'}
        </p>
        <div class="auth-instructions">
          <h3>How to Access</h3>
          <ol>
            <li>
              <strong>Open Feishu App</strong>
              <p>Make sure you have Feishu (Lark) installed on your device</p>
            </li>
            <li>
              <strong>Go to Workbench</strong>
              <p>Tap the "Workbench" icon at the bottom of the screen</p>
            </li>
            <li>
              <strong>Search for the App</strong>
              <p>Search for "Global E-comm Recognition Hub" or "Awards"</p>
            </li>
            <li>
              <strong>Open the Website</strong>
              <p>Tap the app to access the Recognition Hub</p>
            </li>
          </ol>
        </div>
        <div class="auth-footer">
          <p>If you need access, please contact your administrator.</p>
          <a href="https://www.feishu.cn/download" target="_blank" class="auth-btn">
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
