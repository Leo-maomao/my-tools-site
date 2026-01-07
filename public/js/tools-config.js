/**
 * 工具配置中心
 * 新增工具只需在此处添加配置，首页、侧边栏、路由自动同步
 */
(function() {
  'use strict';

  // 工具配置列表
  const TOOLS = [
    {
      id: 'xiaohongshu',
      name: '小红书',
      desc: '生成封面图和正文图，支持自动分页',
      icon: 'xhs',  // 特殊图标
      color: '#ff2442',
      template: 'templates/xiaohongshu.html',
      css: 'css/xiaohongshu.css',
      js: 'js/xiaohongshu.js',
      showInHome: true,
      showInSidebar: true
    },
    {
      id: 'product-assistant',
      name: '产品助理',
      desc: 'AI 辅助生成原型图和 PRD',
      icon: 'ri-robot-line',
      color: '#8b5cf6',
      template: 'templates/product-assistant.html',
      css: 'css/product-assistant.css',
      js: 'js/product-assistant.js',
      showInHome: true,
      showInSidebar: true
    },
    {
      id: 'daily-report',
      name: '报告小助手',
      desc: 'AI 帮你写报告，支持日报/周报/季报/年报',
      icon: 'ri-file-text-line',
      color: '#f59e0b',
      template: 'templates/daily-report.html',
      css: 'css/daily-report.css',
      js: 'js/daily-report.js',
      showInHome: true,
      showInSidebar: true
    },
    {
      id: 'fund-assistant',
      name: '基金助手',
      desc: '实时查看基金净值和涨跌，管理自选基金',
      icon: 'ri-funds-line',
      color: '#10b981',
      template: 'templates/fund-assistant.html',
      css: 'css/fund-assistant.css',
      js: 'js/fund-assistant.js',
      showInHome: true,
      showInSidebar: true
    },
    {
      id: 'dev-tools',
      name: '研发工具箱',
      desc: 'JSON/编码解码/时间戳/正则等 30+ 开发工具',
      icon: 'ri-code-box-line',
      color: '#0891b2',
      template: 'templates/dev-tools.html',
      css: 'css/dev-tools.css',
      js: 'js/dev-tools.js',
      showInHome: true,
      showInSidebar: true
    },
    {
      id: 'component-lib',
      name: '组件库',
      desc: 'UI 组件预览，一键复制代码直接使用',
      icon: 'ri-layout-grid-line',
      color: '#8b5cf6',
      template: 'templates/component-lib.html',
      css: 'css/component-lib.css',
      js: 'js/component-lib.js',
      showInHome: true,
      showInSidebar: true
    },
    {
      id: 'todo',
      name: 'To Do List',
      desc: '待办事项管理，支持分类和状态流转',
      icon: 'ri-checkbox-circle-line',
      color: '#6366f1',
      template: 'templates/todo.html',
      css: 'css/todo.css',
      js: 'js/todo.js',
      showInHome: true,
      showInSidebar: true
    },
    {
      id: 'storage',
      name: '文件存储',
      desc: '简易网盘，支持文件上传下载和分类管理',
      icon: 'ri-folder-cloud-line',
      color: '#0ea5e9',
      template: 'templates/storage.html',
      css: 'css/storage.css',
      js: 'js/storage.js',
      showInHome: true,
      showInSidebar: true,
      requireAdmin: true
    },
    {
      id: 'drama-workshop',
      name: '短剧工坊',
      desc: 'AI 拆解剧本分镜，一键生成短剧视频',
      icon: 'ri-movie-2-line',
      color: '#ec4899',
      template: 'templates/drama-workshop.html',
      css: 'css/drama-workshop.css',
      js: 'js/drama-workshop.js',
      showInHome: true,
      showInSidebar: true,
      requireAdmin: true
    }
  ];

  // 系统页面（不在首页显示）
  const SYSTEM_PAGES = [
    {
      id: '',
      name: '首页',
      icon: 'ri-home-4-line',
      template: 'templates/home.html',
      showInSidebar: true
    },
    {
      id: 'settings',
      name: '设置',
      icon: 'ri-settings-3-line',
      template: 'templates/settings.html',
      css: 'css/settings.css',
      js: 'js/settings.js',
      showInSidebar: false  // 设置在底部单独显示
    }
  ];

  // 外部链接
  const EXTERNAL_LINKS = [
    {
      name: 'AI导航站',
      desc: '精选实用网站导航，AI 工具流量榜单',
      icon: 'ri-compass-3-line',
      color: '#6366f1',
      url: '#'  // TODO: 替换为你的导航站地址
    },
    {
      name: '个人博客',
      desc: '产品思考与体验记录，写给自己的备忘录',
      icon: 'ri-book-2-line',
      color: '#f59e0b',
      url: '#'  // TODO: 替换为你的博客站地址
    }
  ];

  /**
   * 生成路由配置（供 router.js 使用）
   */
  function generateRoutes() {
    const routes = {};
    
    // 系统页面
    SYSTEM_PAGES.forEach(page => {
      routes[page.id] = {
        name: page.name,
        template: page.template,
        css: page.css,
        js: page.js,
        init: null
      };
    });
    
    // 工具页面
    TOOLS.forEach(tool => {
      routes[tool.id] = {
        name: tool.name,
        template: tool.template,
        css: tool.css,
        js: tool.js,
        init: null,
        requireAdmin: tool.requireAdmin || false
      };
    });
    
    return routes;
  }

  /**
   * 渲染侧边栏导航
   */
  function renderSidebar() {
    const container = document.getElementById('sidebar-nav');
    if (!container) return;

    let html = '';
    
    // 首页
    html += `
      <a href="#" class="nav-item" data-title="首页" title="首页">
        <i class="ri-home-4-line"></i>
        <span>首页</span>
      </a>
    `;
    
    // 工具列表
    TOOLS.filter(t => t.showInSidebar).forEach(tool => {
      const adminAttr = tool.requireAdmin ? 'data-require-admin="true" style="display:none"' : '';
      const iconHtml = tool.icon === 'xhs' 
        ? '<svg class="xhs-logo-icon" width="20" height="12" viewBox="0 0 200 120"><rect fill="#ff2442" rx="60" width="200" height="120"/><text x="100" y="82" text-anchor="middle" fill="#fff" font-size="52" font-weight="bold" font-family="sans-serif">小红书</text></svg>'
        : `<i class="${tool.icon}"></i>`;
      
      html += `
        <a href="#${tool.id}" class="nav-item" data-title="${tool.name}" title="${tool.name}" ${adminAttr}>
          ${iconHtml}
          <span>${tool.name}</span>
        </a>
      `;
    });
    
    container.innerHTML = html;
  }

  /**
   * 渲染首页工具卡片
   */
  function renderHomeCards() {
    const container = document.getElementById('home-tools-grid');
    if (!container) return;

    let html = '';
    
    TOOLS.filter(t => t.showInHome).forEach(tool => {
      const adminAttr = tool.requireAdmin ? 'data-require-admin="true" style="display:none"' : '';
      const iconHtml = tool.icon === 'xhs'
        ? '<svg class="xhs-logo-icon xhs-logo-icon-lg" width="32" height="20" viewBox="0 0 200 120"><rect fill="#ff2442" rx="60" width="200" height="120"/><text x="100" y="82" text-anchor="middle" fill="#fff" font-size="52" font-weight="bold" font-family="sans-serif">小红书</text></svg>'
        : `<i class="${tool.icon}" style="color: ${tool.color}"></i>`;
      
      html += `
        <a href="#${tool.id}" class="platform-card" ${adminAttr}>
          <div class="platform-icon">
            ${iconHtml}
          </div>
          <div class="platform-info">
            <h3>${tool.name}</h3>
            <p>${tool.desc}</p>
          </div>
        </a>
      `;
    });
    
    container.innerHTML = html;
  }

  /**
   * 渲染外部链接
   */
  function renderExternalLinks() {
    const container = document.getElementById('home-external-grid');
    if (!container) return;

    let html = '';
    
    EXTERNAL_LINKS.forEach(link => {
      html += `
        <a href="${link.url}" target="_blank" rel="noopener" class="platform-card">
          <div class="platform-icon">
            <i class="${link.icon}" style="color: ${link.color}"></i>
          </div>
          <div class="platform-info">
            <h3>${link.name}</h3>
            <p>${link.desc}</p>
          </div>
        </a>
      `;
    });
    
    container.innerHTML = html;
  }

  /**
   * 更新管理员可见的元素
   */
  function updateAdminVisibility() {
    const isAdmin = window.ToolsAuth && window.ToolsAuth.isAdmin();
    document.querySelectorAll('[data-require-admin="true"]').forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });
  }

  /**
   * 初始化首页
   */
  function initHome() {
    renderHomeCards();
    renderExternalLinks();
    updateAdminVisibility();
    
    // 异步检查管理员权限
    if (window.ToolsAuth && window.ToolsAuth.checkAdmin) {
      window.ToolsAuth.checkAdmin().then(updateAdminVisibility);
    }
    
    // 工具卡片点击埋点
    document.querySelectorAll('.platform-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var toolName = this.querySelector('h3') ? this.querySelector('h3').textContent : 'unknown';
        if (typeof trackEvent === 'function') {
          trackEvent('tool_click', { tool_name: toolName });
        }
      });
    });
  }

  // 监听首页加载事件
  window.addEventListener('toolContentLoaded', function(e) {
    if (e.detail === '' || e.detail === 'home') {
      initHome();
    }
  });

  // 监听登录状态变化
  window.addEventListener('toolsAuthChanged', updateAdminVisibility);

  // 暴露到全局
  window.ToolsConfig = {
    TOOLS,
    SYSTEM_PAGES,
    EXTERNAL_LINKS,
    generateRoutes,
    renderSidebar,
    renderHomeCards,
    renderExternalLinks,
    updateAdminVisibility,
    initHome
  };

})();

