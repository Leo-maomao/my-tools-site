/**
 * 侧边栏收起/展开功能
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
})();
