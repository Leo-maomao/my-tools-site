/**
 * SPA 路由系统
 */
(function() {
  'use strict';

  // 路由配置
  const routes = {
    '': {
      name: '首页',
      template: 'templates/home.html',
      init: null
    },
    'xiaohongshu': {
      name: '小红书',
      template: 'templates/xiaohongshu.html',
      css: 'css/xiaohongshu.css',
      js: 'js/xiaohongshu.js',
      init: null
    },
    'product-assistant': {
      name: '产品助理',
      template: 'templates/product-assistant.html',
      css: 'css/product-assistant.css',
      js: 'js/product-assistant.js',
      init: null
    },
    'daily-report': {
      name: '报告小助手',
      template: 'templates/daily-report.html',
      css: 'css/daily-report.css',
      js: 'js/daily-report.js',
      init: null
    },
    'drama-workshop': {
      name: '短剧工坊',
      template: 'templates/drama-workshop.html',
      css: 'css/drama-workshop.css',
      js: 'js/drama-workshop.js',
      init: null,
      requireAdmin: true  // 仅管理员可见
    },
    'fund-assistant': {
      name: '基金助手',
      template: 'templates/fund-assistant.html',
      css: 'css/fund-assistant.css',
      js: 'js/fund-assistant.js',
      init: null
    },
    'dev-tools': {
      name: '研发工具箱',
      template: 'templates/dev-tools.html',
      css: 'css/dev-tools.css',
      js: 'js/dev-tools.js',
      init: null
    },
    'settings': {
      name: '设置',
      template: 'templates/settings.html',
      css: 'css/settings.css',
      js: 'js/settings.js',
      init: null
    }
  };

  let currentRoute = null; // 初始值设为 null，确保首次加载会触发路由
  let loadedScripts = {};
  let loadedStyles = {};
  let appContent = null;

  // 路由器对象
  const Router = {
    // 初始化路由
    init: function() {
      // 获取 app-content 元素
      appContent = document.getElementById('app-content');
      if (!appContent) {
        console.error('找不到 #app-content 元素！');
        return;
      }
      
      // 监听 hash 变化
      window.addEventListener('hashchange', () => this.loadRoute());
      
      // 初始加载
      this.loadRoute();
    },

    // 获取当前路由
    getCurrentRoute: function() {
      const hash = window.location.hash.slice(1); // 移除 #
      return hash || '';
    },

    // 加载路由
    loadRoute: async function() {
      const route = this.getCurrentRoute();
      
      // 路由未改变，不重复加载（设置页面除外，每次都重新加载）
      if (route === currentRoute && route !== 'settings') return;
      
      // 检查路由是否存在
      if (!routes.hasOwnProperty(route)) {
        console.error('路由不存在:', route);
        window.location.hash = '';
        return;
      }

      const config = routes[route];
      
      // 权限检查：需要管理员权限的路由
      if (config.requireAdmin) {
        const isAdmin = window.ToolsAuth && window.ToolsAuth.isAdmin();
        if (!isAdmin) {
          console.warn('需要管理员权限访问:', route);
          window.location.hash = '';
          return;
        }
      }
      
      // 显示加载状态
      if (appContent) {
        appContent.innerHTML = '<div class="route-loading"><i class="ri-loader-4-line ri-spin"></i><span>加载中...</span></div>';
      }

      try {
        // 1. 加载CSS（如果需要）
        if (config.css) {
          await this.loadCSS(config.css, route);
        }

        // 2. 加载HTML模板
        const html = await this.loadTemplate(config.template);
        if (appContent) {
          appContent.innerHTML = html;
        }

        // 3. 加载JS（如果需要）
        if (config.js) {
          await this.loadScript(config.js, route);
        } else {
          // 即使没有 JS 文件，也触发 toolContentLoaded 事件（用于首页等）
          window.dispatchEvent(new CustomEvent('toolContentLoaded', { detail: route }));
        }

        // 4. 更新侧边栏激活状态
        this.updateSidebarActive(route);

        // 5. 更新当前路由
        currentRoute = route;

        // 6. 触发路由切换事件
        window.dispatchEvent(new CustomEvent('routeChanged', { 
          detail: { route, config } 
        }));
        

      } catch (error) {
        console.error('路由加载失败:', error);
        if (appContent) {
          appContent.innerHTML = `
            <div class="route-error">
              <i class="ri-error-warning-line"></i>
              <p>页面加载失败</p>
              <button onclick="location.reload()" class="btn-reload">刷新重试</button>
            </div>
          `;
        }
      }
    },

    // 加载HTML模板
    loadTemplate: async function(url) {
      // 添加时间戳防止缓存
      const urlWithTimestamp = url + '?t=' + Date.now();
      const response = await fetch(urlWithTimestamp, {
        cache: 'no-cache' // 强制不使用缓存
      });
      if (!response.ok) {
        throw new Error(`Failed to load template: ${url}`);
      }
      return await response.text();
    },

    // 加载CSS
    loadCSS: function(url, routeKey) {
      return new Promise((resolve, reject) => {
        // 如果已加载且不是设置页面，直接返回
        if (loadedStyles[routeKey] && routeKey !== 'settings') {
          resolve();
          return;
        }

        // 如果是设置页面，移除旧样式
        if (routeKey === 'settings' && loadedStyles[routeKey]) {
          loadedStyles[routeKey].remove();
          delete loadedStyles[routeKey];
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url + '?t=' + Date.now(); // 添加时间戳防止缓存
        link.setAttribute('data-route', routeKey);
        
        link.onload = () => {
          loadedStyles[routeKey] = link;
          resolve();
        };
        
        link.onerror = () => {
          reject(new Error(`Failed to load CSS: ${url}`));
        };
        
        document.head.appendChild(link);
      });
    },

    // 加载JS
    loadScript: function(url, routeKey) {
      return new Promise((resolve, reject) => {
        // 如果已加载且不是设置页面，直接返回
        if (loadedScripts[routeKey] && routeKey !== 'settings') {
          // 触发已加载事件
          window.dispatchEvent(new CustomEvent('toolContentLoaded', { detail: routeKey }));
          resolve();
          return;
        }

        // 如果是设置页面，移除旧脚本
        if (routeKey === 'settings' && loadedScripts[routeKey]) {
          loadedScripts[routeKey].remove();
          delete loadedScripts[routeKey];
        }

        const script = document.createElement('script');
        script.src = url + '?t=' + Date.now(); // 添加时间戳防止缓存
        script.setAttribute('data-route', routeKey);
        
        script.onload = () => {
          loadedScripts[routeKey] = script;
          // 触发内容加载完成事件
          window.dispatchEvent(new CustomEvent('toolContentLoaded', { detail: routeKey }));
          resolve();
        };
        
        script.onerror = () => {
          reject(new Error(`Failed to load script: ${url}`));
        };
        
        document.body.appendChild(script);
      });
    },

    // 更新侧边栏激活状态
    updateSidebarActive: function(route) {
      // 移除所有激活状态
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('is-active');
      });

      // 添加当前激活状态
      const selector = route === '' ? '[href="#"]' : `[href="#${route}"]`;
      const activeItem = document.querySelector(selector);
      if (activeItem) {
        activeItem.classList.add('is-active');
      }
    },

    // 导航到指定路由
    navigate: function(route) {
      window.location.hash = route;
    }
  };

  // 暴露到全局
  window.Router = Router;
  
  // 暴露路由配置，供其他模块使用
  window.RouterConfig = {
    routes: routes,
    // 获取需要管理员权限的路由列表
    getAdminRoutes: () => {
      return Object.keys(routes).filter(key => routes[key].requireAdmin);
    },
    // 检查路由是否需要管理员权限
    requiresAdmin: (route) => {
      return routes[route] && routes[route].requireAdmin;
    }
  };

  // 页面加载完成后初始化路由
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Router.init());
  } else {
    Router.init();
  }

})();

