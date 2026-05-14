/**
 * Feishu Auth - Minimal version
 * Auth is handled by award-api.js, this file just shows content
 */
const FeishuAuth = {
  APP_ID: 'cli_aa8858d3f0a6dccd',
  isAuthenticated: false,
  userInfo: null,

  async init() {
    console.log('[FeishuAuth] init - show content directly');
    var overlay = document.getElementById('auth-overlay');
    var content = document.getElementById('main-content');
    if (overlay) overlay.style.display = 'none';
    if (content) content.style.display = 'block';
  },

  isInFeishu() {
    return !!(window.h5sdk || window.tt);
  },

  getCurrentUrl() {
    return window.location.href.split('?')[0];
  }
};

// Auto init
document.addEventListener('DOMContentLoaded', function() {
  FeishuAuth.init();
});
