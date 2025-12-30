/**
 * 侧边栏收起/展开功能 + 权限控制
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'sidebar_collapsed';
  var sidebar = document.getElementById('sidebar');
  var toggle = document.getElementById('sidebarToggle');

  if (!sidebar || !toggle) return;

  // 读取保存的状态
  var isCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';
  if (isCollapsed) {
    sidebar.classList.add('is-collapsed');
    updateToggleIcon();
  }

  // 切换按钮点击事件
  toggle.addEventListener('click', function() {
    sidebar.classList.toggle('is-collapsed');
    isCollapsed = sidebar.classList.contains('is-collapsed');
    localStorage.setItem(STORAGE_KEY, isCollapsed);
    updateToggleIcon();
  });

  function updateToggleIcon() {
    var icon = toggle.querySelector('i');
    if (sidebar.classList.contains('is-collapsed')) {
      icon.className = 'ri-menu-unfold-line';
      toggle.title = '展开侧边栏';
    } else {
      icon.className = 'ri-menu-fold-line';
      toggle.title = '收起侧边栏';
    }
  }
  
  // ========== 管理员导航项显示/隐藏 ==========
  function updateAdminNavItems() {
    var isAdmin = window.ToolsAuth && window.ToolsAuth.isAdmin();
    var adminItems = document.querySelectorAll('[data-require-admin="true"]');
    
    adminItems.forEach(function(item) {
      // nav-item 和 platform-card 都使用 flex 布局
      if (item.classList.contains('nav-item') || item.classList.contains('platform-card')) {
        item.style.display = isAdmin ? 'flex' : 'none';
      } else {
        item.style.display = isAdmin ? '' : 'none';
      }
    });
  }
  
  // 初始检查（异步）
  if (window.ToolsAuth && window.ToolsAuth.checkAdmin) {
    window.ToolsAuth.checkAdmin().then(function() {
      updateAdminNavItems();
    });
  }
  
  // 监听登录状态变化
  window.addEventListener('toolsUserLoggedIn', updateAdminNavItems);
  window.addEventListener('toolsUserLoggedOut', updateAdminNavItems);
  window.addEventListener('toolsAuthChanged', updateAdminNavItems);
  
  // 监听路由切换，更新首页卡片的权限显示
  window.addEventListener('toolContentLoaded', function(e) {
    // 首页加载时检查权限（首页的 route key 是空字符串）
    if (e.detail === '' || e.detail === 'home') {
      updateAdminNavItems();
    }
  });
})();
