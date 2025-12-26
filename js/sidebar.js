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
      // 需要设置为 'flex' 因为 nav-item 使用 flex 布局
      if (item.classList.contains('nav-item')) {
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
})();
