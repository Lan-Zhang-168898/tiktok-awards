/**
 * Feishu Auth - Minimal stub
 * Real auth is handled by award-api.js using h5sdk
 * This file just shows content and does NOT call any Feishu APIs
 */
const FeishuAuth = {
  APP_ID: 'cli_aa8858d3f0a6dccd',
  isAuthenticated: false,
  userInfo: null,

  async init() {
    // Just show content, nothing else
    var overlay = document.getElementById('auth-overlay');
    var content = document.getElementById('main-content');
    if (overlay) overlay.style.display = 'none';
    if (content) content.style.display = 'block';
  },

  isInFeishu() {
    return !!(window.h5sdk || window.tt);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  FeishuAuth.init();
});
