/**
 * 组件库模块 v3 - Ant Design 风格
 * 功能：示例卡片展示，代码可展开/收起
 */
(function() {
  'use strict';

  // 组件库基础路径
  const COMPONENTS_BASE = 'components-lib';

  // 组件配置
  const componentsConfig = {
    layout: {
      grid: { name: 'Grid 网格', desc: 'CSS Grid 布局系统', path: 'layout/grid' },
      card: { name: 'Card 卡片', desc: '信息容器卡片组件', path: 'layout/card' },
      divider: { name: 'Divider 分割线', desc: '内容分隔线组件', path: 'layout/divider' },
      footer: { name: 'Footer 页脚', desc: '页面底部导航', path: 'layout/footer' }
    },
    base: {
      button: { name: 'Button 按钮', desc: '多样式按钮组件', path: 'base/button' },
      input: { name: 'Input 输入框', desc: '文本输入组件', path: 'base/input' },
      textarea: { name: 'Textarea 文本域', desc: '多行文本输入', path: 'base/textarea', hasJs: true },
      select: { name: 'Select 下拉选择', desc: '单选下拉组件', path: 'base/select', hasJs: true },
      'multi-select': { name: 'Multi-Select 多选', desc: '多选下拉组件', path: 'base/multi-select', hasJs: true },
      cascader: { name: 'Cascader 级联选择', desc: '级联选择器', path: 'base/cascader', hasJs: true },
      checkbox: { name: 'Checkbox 复选框', desc: '复选框组件', path: 'base/checkbox' },
      radio: { name: 'Radio 单选框', desc: '单选框组件', path: 'base/radio' },
      switch: { name: 'Switch 开关', desc: '开关切换组件', path: 'base/switch' },
      fab: { name: 'FAB 悬浮按钮', desc: '悬浮操作按钮', path: 'base/fab' }
    },
    navigation: {
      navbar: { name: 'Navbar 顶部导航', desc: '页面顶部导航栏', path: 'navigation/navbar' },
      menu: { name: 'Menu 侧边菜单', desc: '侧边导航菜单', path: 'navigation/menu', hasJs: true },
      breadcrumb: { name: 'Breadcrumb 面包屑', desc: '页面层级导航', path: 'navigation/breadcrumb' },
      dropdown: { name: 'Dropdown 下拉菜单', desc: '下拉操作菜单', path: 'navigation/dropdown', hasJs: true },
      tabs: { name: 'Tabs 选项卡', desc: '标签页切换组件', path: 'navigation/tabs', hasJs: true },
      steps: { name: 'Steps 步骤条', desc: '步骤流程展示', path: 'navigation/steps' },
      pagination: { name: 'Pagination 分页', desc: '数据分页组件', path: 'navigation/pagination', hasJs: true },
      'back-to-top': { name: 'BackToTop 回到顶部', desc: '快速返回顶部', path: 'navigation/back-to-top', hasJs: true }
    },
    'data-entry': {
      form: { name: 'Form 表单', desc: '表单布局组件', path: 'data-entry/form' },
      search: { name: 'Search 搜索', desc: '搜索框组件', path: 'data-entry/search' },
      upload: { name: 'Upload 上传', desc: '文件上传组件', path: 'data-entry/upload', hasJs: true },
      slider: { name: 'Slider 滑块', desc: '滑动选择器', path: 'data-entry/slider', hasJs: true },
      rate: { name: 'Rate 评分', desc: '评分组件', path: 'data-entry/rate', hasJs: true }
    },
    'data-display': {
      table: { name: 'Table 表格', desc: '数据表格组件', path: 'data-display/table' },
      list: { name: 'List 列表', desc: '列表展示组件', path: 'data-display/list' },
      tag: { name: 'Tag 标签', desc: '标签组件', path: 'data-display/tag' },
      badge: { name: 'Badge 徽标', desc: '徽标数字组件', path: 'data-display/badge' },
      avatar: { name: 'Avatar 头像', desc: '头像展示组件', path: 'data-display/avatar' },
      image: { name: 'Image 图片', desc: '图片展示组件', path: 'data-display/image' },
      carousel: { name: 'Carousel 轮播图', desc: '图片轮播组件', path: 'data-display/carousel', hasJs: true },
      timeline: { name: 'Timeline 时间线', desc: '时间轴组件', path: 'data-display/timeline' },
      empty: { name: 'Empty 空状态', desc: '空数据提示', path: 'data-display/empty' },
      collapse: { name: 'Collapse 折叠面板', desc: '可折叠内容区', path: 'data-display/collapse', hasJs: true }
    },
    feedback: {
      modal: { name: 'Modal 弹窗', desc: '模态对话框', path: 'feedback/modal', hasJs: true },
      drawer: { name: 'Drawer 抽屉', desc: '侧边抽屉面板', path: 'feedback/drawer', hasJs: true },
      toast: { name: 'Toast 轻提示', desc: '轻量级提示', path: 'feedback/toast', hasJs: true },
      loading: { name: 'Loading 加载', desc: '加载状态指示', path: 'feedback/loading' },
      tooltip: { name: 'Tooltip 文字提示', desc: '悬浮文字提示', path: 'feedback/tooltip' },
      alert: { name: 'Alert 警告提示', desc: '警告信息展示', path: 'feedback/alert' },
      progress: { name: 'Progress 进度条', desc: '进度指示组件', path: 'feedback/progress' },
      skeleton: { name: 'Skeleton 骨架屏', desc: '加载占位组件', path: 'feedback/skeleton' }
    }
  };

  // 当前状态
  let currentComponent = null;
  let currentCategory = null;
  let currentCss = '';
  let viewedComponents = new Set();

  // DOM 元素
  let componentBody = null;

  /**
   * 初始化
   */
  function init() {
    componentBody = document.getElementById('componentBody');
    if (!componentBody) return;

    bindNavEvents();
    bindSearchEvents();

    // 从 URL 读取当前组件，格式：#component-lib/category/component
    var initialComponent = getComponentFromUrl();
    if (initialComponent) {
      loadComponent(initialComponent.component, initialComponent.category);
      // 更新侧边栏激活状态
      updateNavActive(initialComponent.component);
    } else {
      // 默认加载第一个组件
      loadComponent('grid', 'layout');
    }
  }

  /**
   * 从 URL 获取当前组件
   */
  function getComponentFromUrl() {
    var hash = window.location.hash;
    // 格式: #component-lib/category/component
    var match = hash.match(/^#component-lib\/([^\/]+)\/([^\/]+)$/);
    if (match) {
      var category = match[1];
      var component = match[2];
      // 验证组件是否存在
      if (componentsConfig[category] && componentsConfig[category][component]) {
        return { category: category, component: component };
      }
    }
    return null;
  }

  /**
   * 更新 URL 中的组件路径
   */
  function updateUrlWithComponent(category, component) {
    var newHash = '#component-lib/' + category + '/' + component;
    // 使用 replaceState 避免产生过多历史记录
    history.replaceState(null, '', newHash);
  }

  /**
   * 更新侧边栏激活状态
   */
  function updateNavActive(component) {
    var activeItem = null;
    document.querySelectorAll('.component-item').forEach(function(item) {
      item.classList.remove('is-active');
      if (item.getAttribute('data-component') === component) {
        item.classList.add('is-active');
        activeItem = item;
        // 确保分类展开
        var category = item.closest('.component-category');
        if (category) {
          category.classList.remove('is-collapsed');
        }
      }
    });
    
    // 滚动到激活项
    if (activeItem) {
      setTimeout(function() {
        activeItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    }
  }

  /**
   * 绑定导航事件
   */
  function bindNavEvents() {
    // 分类折叠
    document.querySelectorAll('.category-header').forEach(function(header) {
      header.addEventListener('click', function() {
        this.closest('.component-category').classList.toggle('is-collapsed');
      });
    });

    // 组件切换
    document.querySelectorAll('.component-item').forEach(function(item) {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        var component = this.getAttribute('data-component');
        var category = this.closest('.component-category').getAttribute('data-category');
        
        document.querySelectorAll('.component-item').forEach(function(i) {
          i.classList.remove('is-active');
        });
        this.classList.add('is-active');
        
        loadComponent(component, category);
      });
    });
  }

  /**
   * 绑定搜索事件
   */
  function bindSearchEvents() {
    var searchInput = document.getElementById('componentSearch');
    var searchClear = document.getElementById('componentSearchClear');
    var searchContainer = searchInput ? searchInput.closest('.component-lib-search') : null;
    
    if (!searchInput) return;

    // 更新清空按钮显示状态
    function updateClearButton() {
      if (searchContainer) {
        if (searchInput.value.trim()) {
          searchContainer.classList.add('has-value');
        } else {
          searchContainer.classList.remove('has-value');
        }
      }
    }

    // 执行搜索过滤
    function filterComponents(keyword) {
      // 过滤组件项
      document.querySelectorAll('.component-item').forEach(function(item) {
        var name = item.textContent.toLowerCase();
        var component = item.getAttribute('data-component');
        var show = !keyword || name.includes(keyword) || component.includes(keyword);
        item.style.display = show ? '' : 'none';
      });

      // 过滤分类：隐藏没有匹配结果的分类
      document.querySelectorAll('.component-category').forEach(function(category) {
        var hasVisible = Array.from(category.querySelectorAll('.component-item')).some(function(item) {
          return item.style.display !== 'none';
        });
        
        if (keyword) {
          // 有搜索词时：隐藏无匹配的分类，展开有匹配的分类
          category.style.display = hasVisible ? '' : 'none';
          if (hasVisible) {
            category.classList.remove('is-collapsed');
          }
        } else {
          // 无搜索词时：显示所有分类
          category.style.display = '';
        }
      });
    }

    // 输入事件
    searchInput.addEventListener('input', function() {
      var keyword = this.value.toLowerCase().trim();
      updateClearButton();
      filterComponents(keyword);
    });

    // 清空按钮点击事件
    if (searchClear) {
      searchClear.addEventListener('click', function() {
        searchInput.value = '';
        updateClearButton();
        filterComponents('');
        searchInput.focus();
      });
    }
  }

  /**
   * 加载组件
   */
  async function loadComponent(component, category) {
    currentComponent = component;
    currentCategory = category;

    var config = componentsConfig[category] && componentsConfig[category][component];
    if (!config) {
      componentBody.innerHTML = '<div class="component-empty"><i class="ri-error-warning-line"></i><p>组件不存在</p></div>';
      return;
    }

    // 更新 URL（保持路由状态）
    updateUrlWithComponent(category, component);
    
    // 更新侧边栏激活状态
    updateNavActive(component);

    // 更新标题
    document.getElementById('componentTitle').textContent = config.name;
    document.getElementById('componentDesc').textContent = config.desc;

    // 显示加载状态
    componentBody.innerHTML = '<div class="component-loading"><i class="ri-loader-4-line"></i><p>加载中...</p></div>';

    try {
      var basePath = COMPONENTS_BASE + '/' + config.path;
      var [htmlContent, cssContent] = await Promise.all([
        fetchFile(basePath + '/index.html'),
        fetchFile(basePath + '/style.css')
      ]);

      currentCss = cssContent;

      // 解析并渲染组件单元
      var units = parseComponentUnits(htmlContent);
      renderDemoCards(units, config);

      // 埋点
      if (!viewedComponents.has(component)) {
        viewedComponents.add(component);
        trackComponentEvent('component_view', category, component);
      }

    } catch (error) {
      componentBody.innerHTML = '<div class="component-empty"><i class="ri-error-warning-line"></i><p>加载失败: ' + error.message + '</p></div>';
    }
  }

  /**
   * 解析组件单元（按 HTML 注释拆分）
   */
  function parseComponentUnits(htmlContent) {
    var units = [];
    
    // 按 <!-- 注释 --> 拆分
    var regex = /<!--\s*(.+?)\s*-->\s*([\s\S]*?)(?=<!--|\s*$)/g;
    var match;
    
    while ((match = regex.exec(htmlContent)) !== null) {
      var title = match[1].trim();
      var code = match[2].trim();
      
      if (code) {
        units.push({
          title: title,
          code: code
        });
      }
    }

    // 如果没有注释，整个内容作为一个单元
    if (units.length === 0 && htmlContent.trim()) {
      units.push({
        title: '默认',
        code: htmlContent.trim()
      });
    }

    return units;
  }

  // 需要占满整行的宽组件（根据实际展示需要）
  var WIDE_COMPONENTS = [
    // 导航类 - 需要横向空间
    'navbar', 'menu', 'breadcrumb', 'steps', 'pagination',
    // 数据展示类 - 内容较宽
    'table', 'list', 'timeline', 'carousel', 'collapse',
    // 表单类 - 结构复杂
    'form',
    // 布局类 - 展示布局效果
    'grid', 'footer', 'divider',
    // 反馈类 - 弹窗/抽屉预览需要空间
    'modal', 'drawer', 'alert', 'progress'
  ];

  /**
   * 渲染示例卡片 - Ant Design 风格
   */
  function renderDemoCards(units, config) {
    // 注入组件样式
    injectComponentStyles(config);

    // 判断是否为宽组件
    var componentName = config.path ? config.path.split('/').pop() : '';
    var isWideComponent = WIDE_COMPONENTS.some(function(name) {
      return componentName === name;
    });
    var cardClass = isWideComponent ? 'demo-card demo-card-wide' : 'demo-card';
    var escapedCss = escapeHtml(currentCss);

    var html = '<div class="demo-grid">';
    
    units.forEach(function(unit, index) {
      var processedCode = processPreviewCode(unit.code, config);
      var escapedCode = escapeHtml(unit.code);
      var demoId = 'demo-' + index;
      
      html += '\
        <div class="' + cardClass + '">\
          <div class="demo-preview">\
            ' + processedCode + '\
          </div>\
          <div class="demo-actions">\
            <span class="demo-title">' + unit.title + '</span>\
            <div class="demo-btns">\
              <button class="demo-btn demo-toggle-btn" title="显示代码" onclick="ComponentLib.toggleCode(\'' + demoId + '\', this)">\
                <i class="ri-code-s-slash-line"></i>\
              </button>\
            </div>\
          </div>\
          <div class="demo-code-section" id="' + demoId + '">\
            <div class="demo-code-header">\
              <div class="demo-code-tabs-nav">\
                <button class="demo-code-tab is-active" data-tab="html" onclick="ComponentLib.switchCodeTab(\'' + demoId + '\', \'html\', this)">HTML</button>\
                <button class="demo-code-tab" data-tab="css" onclick="ComponentLib.switchCodeTab(\'' + demoId + '\', \'css\', this)">CSS</button>\
              </div>\
              <button class="demo-copy-btn" title="复制代码" data-code="' + encodeURIComponent(unit.code) + '" data-html-code="' + encodeURIComponent(unit.code) + '" data-css-code="' + encodeURIComponent(currentCss) + '" onclick="ComponentLib.copyCode(this)">\
                <i class="ri-file-copy-line"></i>\
              </button>\
            </div>\
            <div class="demo-code-body">\
              <div class="demo-code-panel demo-code-html is-active">\
                <pre><code>' + escapedCode + '</code></pre>\
              </div>\
              <div class="demo-code-panel demo-code-css">\
                <pre><code>' + escapedCss + '</code></pre>\
              </div>\
            </div>\
          </div>\
        </div>';
    });

    html += '</div>';

    componentBody.innerHTML = html;
    
    // 清理 Select 下拉框
    cleanupSelectDropdowns();
    
    // 启用组件预览交互
    enableMultiSelectPreview();
    enableTabsPreview();
    enableSwitchPreview();
    enableSelectPreview();
    enableCheckboxPreview();
    enableRadioPreview();
    enableDropdownPreview();
    enableCollapsePreview();
    enableCarouselPreview();
    // 新增交互
    enableInputPreview();
    enableMenuPreview();
    enablePaginationPreview();
    enableSliderPreview();
    enableRatePreview();
    enableModalPreview();
    enableToastPreview();
    enableAlertPreview();
    enableTooltipPreview();
    enableStepsPreview();
    enableTagPreview();
  }

  /**
   * 处理预览代码（特殊组件如 Modal、Select 需要调整样式）
   */
  function processPreviewCode(code, config) {
    var processed = code;
    
    // Modal: 改为相对定位可见
    if (config.path && config.path.includes('modal')) {
      processed = processed
        .replace(/class="modal-overlay"/g, 'class="modal-overlay" style="position:relative;background:rgba(0,0,0,0.1);padding:20px;border-radius:8px;"')
        .replace(/class="modal"/g, 'class="modal" style="position:relative;transform:none;margin:0 auto;"');
    }
    
    // Drawer: 改为相对定位可见
    if (config.path && config.path.includes('drawer')) {
      processed = processed
        .replace(/class="drawer-overlay"/g, 'class="drawer-overlay" style="position:relative;height:200px;background:rgba(0,0,0,0.1);border-radius:8px;"')
        .replace(/class="drawer([^"]*)"/g, 'class="drawer$1" style="position:absolute;transform:none;"');
    }

    // Select: 移除可能导致浏览器添加额外 UI 的 ARIA 属性
    if (config.path && (config.path.includes('select') || config.path.includes('cascader'))) {
      processed = processed
        .replace(/aria-haspopup="[^"]*"/g, '')
        .replace(/aria-expanded="[^"]*"/g, '')
        .replace(/aria-multiselectable="[^"]*"/g, '');
    }

    return processed;
  }

  /**
   * 清理组件的下拉框（隐藏非展开状态的下拉框，避免视觉干扰）
   * 注意：不移除 DOM 元素，而是通过 CSS 隐藏，以保留交互功能
   */
  function cleanupSelectDropdowns() {
    // 不再移除 select-dropdown，因为需要保留用于交互
    // CSS 已经通过 opacity: 0; visibility: hidden; 隐藏了非展开状态的下拉框
    
    // 移除非展开状态的 cascader-dropdown（级联选择静态预览）
    document.querySelectorAll('.demo-preview .cascader:not(.cascader-open) .cascader-dropdown').forEach(function(el) {
      el.remove();
    });
    // 移除非展开状态的 dropdown-menu（下拉菜单静态预览）
    document.querySelectorAll('.demo-preview .dropdown:not(.is-open):not(.dropdown-open) .dropdown-menu').forEach(function(el) {
      el.remove();
    });
  }

  /**
   * 启用 Multi-Select 预览交互功能
   */
  function enableMultiSelectPreview() {
    // 为每个 multi-select 添加交互
    document.querySelectorAll('.demo-preview .multi-select').forEach(function(multiSelect) {
      var actions = multiSelect.querySelector('.multi-select-actions');
      if (!actions) return;

      var selectAllBtn = actions.querySelector('.multi-select-action:first-child');
      var clearAllBtn = actions.querySelector('.multi-select-action:last-child');
      var options = multiSelect.querySelectorAll('.multi-select-option');
      var tagsContainer = multiSelect.querySelector('.multi-select-tags');

      // 更新标签显示
      function updateTags() {
        if (!tagsContainer) return;
        
        var selectedOptions = multiSelect.querySelectorAll('.multi-select-option-selected');
        var html = '';
        
        if (selectedOptions.length === 0) {
          html = '<span class="multi-select-placeholder">请选择标签</span>';
        } else {
          selectedOptions.forEach(function(opt) {
            var text = opt.querySelector('.multi-select-option-text').textContent;
            html += '<span class="multi-select-tag">' +
              '<span class="multi-select-tag-text">' + text + '</span>' +
              '<button class="multi-select-tag-remove" type="button">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<path d="M18 6L6 18M6 6l12 12"/>' +
                '</svg>' +
              '</button>' +
            '</span>';
          });
        }
        
        tagsContainer.innerHTML = html;
        
        // 为新创建的删除按钮绑定事件
        tagsContainer.querySelectorAll('.multi-select-tag-remove').forEach(function(btn, idx) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var selectedOpts = multiSelect.querySelectorAll('.multi-select-option-selected');
            if (selectedOpts[idx]) {
              selectedOpts[idx].classList.remove('multi-select-option-selected');
              updateTags();
            }
          });
        });
      }

      // 全选/反选功能
      if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function(e) {
          e.preventDefault();
          // 检查是否已全选
          var allSelected = Array.from(options).every(function(opt) {
            return opt.classList.contains('multi-select-option-selected');
          });
          
          if (allSelected) {
            // 已全选，则全部取消
            options.forEach(function(opt) {
              opt.classList.remove('multi-select-option-selected');
            });
          } else {
            // 未全选，则全部选中
            options.forEach(function(opt) {
              opt.classList.add('multi-select-option-selected');
            });
          }
          updateTags();
        });
      }

      // 清空功能
      if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function(e) {
          e.preventDefault();
          options.forEach(function(opt) {
            opt.classList.remove('multi-select-option-selected');
          });
          updateTags();
        });
      }

      // 点击选项切换选中状态
      options.forEach(function(opt) {
        opt.addEventListener('click', function(e) {
          e.preventDefault();
          opt.classList.toggle('multi-select-option-selected');
          updateTags();
        });
      });
    });
  }

  /**
   * 启用 Tabs 预览交互功能
   */
  function enableTabsPreview() {
    document.querySelectorAll('.demo-preview .tabs').forEach(function(tabsEl) {
      var tabItems = tabsEl.querySelectorAll('.tabs-item:not(.tabs-item-disabled)');
      var tabPanels = tabsEl.querySelectorAll('.tabs-panel');
      
      tabItems.forEach(function(item, index) {
        item.addEventListener('click', function(e) {
          e.preventDefault();
          
          // 移除所有选中状态
          tabItems.forEach(function(t) {
            t.classList.remove('tabs-item-active');
            t.setAttribute('aria-selected', 'false');
          });
          
          // 设置当前选中
          item.classList.add('tabs-item-active');
          item.setAttribute('aria-selected', 'true');
          
          // 切换面板（如果有）
          tabPanels.forEach(function(panel, pIndex) {
            if (pIndex === index) {
              panel.classList.add('tabs-panel-active');
            } else {
              panel.classList.remove('tabs-panel-active');
            }
          });
        });
      });
    });
  }

  /**
   * 启用 Switch 开关预览交互
   */
  function enableSwitchPreview() {
    document.querySelectorAll('.demo-preview .switch-track').forEach(function(track) {
      if (track.style.opacity === '0.5' || track.closest('[style*="opacity: 0.5"]')) return; // 跳过禁用状态
      
      track.style.cursor = 'pointer';
      track.addEventListener('click', function() {
        var dot = track.querySelector('.switch-dot');
        var isOn = track.style.backgroundColor === 'rgb(59, 130, 246)';
        
        if (isOn) {
          track.style.backgroundColor = '#d1d5db';
          if (dot) dot.style.left = '2px';
        } else {
          track.style.backgroundColor = '#3b82f6';
          // 根据尺寸计算位置
          var width = parseInt(track.style.width);
          var dotWidth = parseInt(dot ? dot.style.width : 20);
          if (dot) dot.style.left = (width - dotWidth - 2) + 'px';
        }
      });
    });
    
    // 也支持原生 checkbox switch
    document.querySelectorAll('.demo-preview .switch-input').forEach(function(input) {
      var label = input.closest('.switch');
      if (!label || input.disabled) return;
      
      input.addEventListener('change', function() {
        // CSS 会自动处理样式变化
      });
    });
  }

  /**
   * 启用 Select 下拉选择预览交互
   */
  function enableSelectPreview() {
    document.querySelectorAll('.demo-preview .select').forEach(function(select) {
      var trigger = select.querySelector('.select-trigger');
      var dropdown = select.querySelector('.select-dropdown');
      var arrow = select.querySelector('.select-arrow');
      
      if (!trigger || select.classList.contains('select-disabled')) return;
      
      trigger.style.cursor = 'pointer';
      
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = select.classList.toggle('select-open');
        
        // 关闭其他下拉
        document.querySelectorAll('.demo-preview .select.select-open').forEach(function(s) {
          if (s !== select) {
            s.classList.remove('select-open');
            var otherArrow = s.querySelector('.select-arrow');
            var otherDropdown = s.querySelector('.select-dropdown');
            if (otherArrow) otherArrow.style.transform = '';
            if (otherDropdown) {
              otherDropdown.style.cssText = '';
            }
          }
        });
        
        // 旋转箭头
        if (arrow) {
          arrow.style.transform = isOpen ? 'rotate(180deg)' : '';
          arrow.style.transition = 'transform 0.2s ease';
        }
        
        // 显示/隐藏下拉框
        if (dropdown) {
          if (isOpen) {
            dropdown.style.cssText = 'display: block !important; position: relative !important; opacity: 1 !important; visibility: visible !important; transform: none !important; margin-top: 4px !important; width: 100% !important; height: auto !important; padding: 4px !important; border: 1px solid #e5e7eb !important; border-radius: 6px !important; background: white !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; z-index: 100 !important;';
          } else {
            dropdown.style.cssText = '';
          }
        }
      });
      
      // 选项点击
      select.querySelectorAll('.select-option').forEach(function(option) {
        if (option.classList.contains('select-option-disabled')) {
          option.style.cursor = 'not-allowed';
          option.style.color = '#9ca3af';
          return;
        }
        
        option.style.cursor = 'pointer';
        option.style.padding = '8px 12px';
        option.style.borderRadius = '4px';
        option.style.fontSize = '14px';
        
        option.addEventListener('mouseenter', function() {
          if (!option.classList.contains('select-option-selected')) {
            option.style.background = '#f3f4f6';
          }
        });
        
        option.addEventListener('mouseleave', function() {
          if (!option.classList.contains('select-option-selected')) {
            option.style.background = '';
          }
        });
        
        option.addEventListener('click', function(e) {
          e.stopPropagation();
          
          var value = trigger.querySelector('.select-value');
          if (value) {
            value.textContent = option.textContent;
            value.classList.remove('select-placeholder');
            value.style.color = '#111827';
          }
          
          // 更新选中状态
          select.querySelectorAll('.select-option').forEach(function(o) {
            o.classList.remove('select-option-selected');
            o.style.background = '';
            o.style.color = '#374151';
          });
          option.classList.add('select-option-selected');
          option.style.background = '#eff6ff';
          option.style.color = '#3b82f6';
          
          // 关闭下拉
          select.classList.remove('select-open');
          if (arrow) arrow.style.transform = '';
          if (dropdown) {
            dropdown.style.cssText = '';
          }
        });
        
        // 初始化选中项样式
        if (option.classList.contains('select-option-selected')) {
          option.style.background = '#eff6ff';
          option.style.color = '#3b82f6';
        }
      });
    });
    
    // 点击外部关闭
    document.addEventListener('click', function() {
      document.querySelectorAll('.demo-preview .select.select-open').forEach(function(s) {
        s.classList.remove('select-open');
        var arrow = s.querySelector('.select-arrow');
        var dropdown = s.querySelector('.select-dropdown');
        if (arrow) arrow.style.transform = '';
        if (dropdown) dropdown.style.cssText = '';
      });
    });
  }

  /**
   * 启用 Checkbox 复选框预览交互
   */
  function enableCheckboxPreview() {
    document.querySelectorAll('.demo-preview label.checkbox').forEach(function(checkbox) {
      var input = checkbox.querySelector('input[type="checkbox"]');
      if (!input) return;
      if (input.disabled || checkbox.classList.contains('checkbox-disabled')) return;
      
      checkbox.style.cursor = 'pointer';
      
      // 更新视觉状态
      function updateVisual() {
        var box = checkbox.querySelector('.checkbox-box');
        if (box) {
          if (input.checked) {
            box.style.background = '#3b82f6';
            box.style.borderColor = '#3b82f6';
            var icon = box.querySelector('svg');
            if (icon) icon.style.opacity = '1';
          } else {
            box.style.background = '';
            box.style.borderColor = '';
            var icon = box.querySelector('svg');
            if (icon) icon.style.opacity = '0';
          }
        }
      }
      
      // 阻止默认行为并手动切换
      checkbox.addEventListener('click', function(e) {
        // 如果点击的是 input 本身,让它正常工作
        if (e.target === input) {
          setTimeout(updateVisual, 0);
          return;
        }
        // 否则手动切换
        e.preventDefault();
        input.checked = !input.checked;
        updateVisual();
      });
      
      // 初始化视觉状态
      updateVisual();
    });
  }

  /**
   * 启用 Radio 单选框预览交互
   */
  function enableRadioPreview() {
    document.querySelectorAll('.demo-preview .radio-group, .demo-preview').forEach(function(group) {
      var radios = group.querySelectorAll('.radio');
      if (radios.length === 0) return;
      
      radios.forEach(function(radio) {
        var input = radio.querySelector('.radio-input, input[type="radio"]');
        if (!input || input.disabled) return;
        
        radio.style.cursor = 'pointer';
        radio.addEventListener('click', function(e) {
          if (e.target === input) return;
          
          // 取消同组其他选中
          var name = input.name;
          if (name) {
            group.querySelectorAll('input[name="' + name + '"]').forEach(function(r) {
              r.checked = false;
            });
          }
          
          input.checked = true;
          input.dispatchEvent(new Event('change'));
        });
      });
    });
  }

  /**
   * 启用 Dropdown 下拉菜单预览交互
   */
  function enableDropdownPreview() {
    document.querySelectorAll('.demo-preview .dropdown').forEach(function(dropdown) {
      var trigger = dropdown.querySelector('.dropdown-trigger');
      var menu = dropdown.querySelector('.dropdown-menu');
      
      if (!trigger) return;
      
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.toggle('dropdown-open');
        dropdown.classList.toggle('is-open', isOpen);
        
        // 关闭其他下拉
        document.querySelectorAll('.demo-preview .dropdown').forEach(function(d) {
          if (d !== dropdown) {
            d.classList.remove('dropdown-open', 'is-open');
          }
        });
      });
      
      // 菜单项点击
      dropdown.querySelectorAll('.dropdown-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
          e.stopPropagation();
          dropdown.classList.remove('dropdown-open', 'is-open');
        });
      });
    });
  }

  /**
   * 启用 Collapse 折叠面板预览交互
   */
  function enableCollapsePreview() {
    document.querySelectorAll('.demo-preview .collapse-item, .demo-preview .collapse-header').forEach(function(header) {
      if (header.classList.contains('collapse-header')) {
        var item = header.closest('.collapse-item');
        header.style.cursor = 'pointer';
        
        header.addEventListener('click', function() {
          if (item) {
            item.classList.toggle('is-active');
            item.classList.toggle('collapse-item-active');
          }
        });
      }
    });
  }

  /**
   * 启用 Carousel 轮播图预览交互
   */
  function enableCarouselPreview() {
    document.querySelectorAll('.demo-preview .carousel').forEach(function(carousel) {
      var track = carousel.querySelector('.carousel-track');
      var slides = carousel.querySelectorAll('.carousel-slide');
      var dots = carousel.querySelectorAll('.carousel-dot');
      var prevBtn = carousel.querySelector('.carousel-prev');
      var nextBtn = carousel.querySelector('.carousel-next');
      
      if (slides.length === 0) return;
      
      var currentIndex = 0;
      
      function goToSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        currentIndex = index;
        
        if (track) {
          track.style.transform = 'translateX(-' + (index * 100) + '%)';
          track.style.transition = 'transform 0.3s ease';
        }
        
        dots.forEach(function(dot, i) {
          dot.classList.toggle('carousel-dot-active', i === index);
          dot.style.background = i === index ? 'white' : 'rgba(255,255,255,0.5)';
        });
      }
      
      if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          goToSlide(currentIndex - 1);
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          goToSlide(currentIndex + 1);
        });
      }
      
      dots.forEach(function(dot, index) {
        dot.addEventListener('click', function(e) {
          e.stopPropagation();
          goToSlide(index);
        });
      });
    });
  }

  /**
   * 启用 Input 输入框预览交互
   */
  function enableInputPreview() {
    // 清除按钮
    document.querySelectorAll('.demo-preview .input-group, .demo-preview .search').forEach(function(wrapper) {
      var input = wrapper.querySelector('input:not([type="checkbox"]):not([type="radio"])');
      var clearBtn = wrapper.querySelector('.input-clear, .search-clear');
      
      if (input && clearBtn) {
        clearBtn.style.cursor = 'pointer';
        
        function updateClearBtn() {
          if (input.value && input.value.length > 0) {
            wrapper.classList.add('has-value');
            clearBtn.style.opacity = '1';
            clearBtn.style.visibility = 'visible';
            clearBtn.style.display = 'flex';
          } else {
            wrapper.classList.remove('has-value');
            clearBtn.style.opacity = '0';
            clearBtn.style.visibility = 'hidden';
          }
        }
        
        input.addEventListener('input', updateClearBtn);
        
        clearBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          input.value = '';
          wrapper.classList.remove('has-value');
          clearBtn.style.opacity = '0';
          clearBtn.style.visibility = 'hidden';
          input.focus();
        });
        
        // 初始化
        updateClearBtn();
      }
    });
    
    // 密码显示/隐藏切换
    document.querySelectorAll('.demo-preview .input-group').forEach(function(wrapper) {
      var input = wrapper.querySelector('input[type="password"]');
      var toggleBtn = wrapper.querySelector('.input-toggle-password');
      
      if (input && toggleBtn) {
        toggleBtn.style.cursor = 'pointer';
        
        // 眼睛睁开图标（可见密码）
        var eyeOpenSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        // 眼睛闭合图标（隐藏密码）
        var eyeClosedSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
        
        toggleBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          if (input.type === 'password') {
            input.type = 'text';
            toggleBtn.innerHTML = eyeClosedSvg;
            toggleBtn.classList.add('is-visible');
          } else {
            input.type = 'password';
            toggleBtn.innerHTML = eyeOpenSvg;
            toggleBtn.classList.remove('is-visible');
          }
        });
      }
    });
  }

  /**
   * 启用 Menu 侧边菜单预览交互
   */
  function enableMenuPreview() {
    document.querySelectorAll('.demo-preview .menu').forEach(function(menu) {
      var items = menu.querySelectorAll('.menu-item:not(.menu-item-disabled), .menu-link');
      
      items.forEach(function(item) {
        // 阻止链接跳转
        var link = item.tagName === 'A' ? item : item.querySelector('a');
        if (link) {
          link.addEventListener('click', function(e) {
            e.preventDefault();
          });
        }
        
        item.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // 移除其他选中状态
          menu.querySelectorAll('.menu-item-active, .is-active').forEach(function(i) {
            i.classList.remove('menu-item-active', 'is-active');
          });
          
          // 设置当前选中
          item.classList.add('menu-item-active', 'is-active');
        });
      });
      
      // 子菜单展开/收起
      var subTriggers = menu.querySelectorAll('.menu-item-has-children > .menu-item-content, .menu-submenu-title, .menu-group-title');
      subTriggers.forEach(function(trigger) {
        trigger.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var parent = trigger.closest('.menu-item-has-children, .menu-submenu, .menu-group');
          if (parent) {
            parent.classList.toggle('menu-item-open');
            parent.classList.toggle('is-open');
          }
        });
      });
    });
  }

  /**
   * 启用 Pagination 分页预览交互
   */
  function enablePaginationPreview() {
    document.querySelectorAll('.demo-preview .pagination').forEach(function(pagination) {
      // 获取所有分页项，过滤掉带 SVG 的按钮（上一页/下一页）和省略号
      var allItems = Array.from(pagination.querySelectorAll('.pagination-item'));
      var pageItems = allItems.filter(function(item) {
        // 排除带 SVG 的按钮（上一页/下一页）
        return !item.querySelector('svg') && !item.classList.contains('pagination-ellipsis');
      });
      
      // 上一页按钮（第一个带 SVG 的）
      var prevBtn = allItems.find(function(item) {
        return item.querySelector('svg path[d*="15 18"]') || item.textContent.includes('上一页');
      });
      
      // 下一页按钮（第二个带 SVG 的）
      var nextBtn = allItems.find(function(item) {
        return item.querySelector('svg path[d*="9 18"]') || item.textContent.includes('下一页');
      });
      
      var simpleInfo = pagination.querySelector('.pagination-simple-separator');
      
      if (pageItems.length === 0) return;
      
      // 获取当前选中的页码索引
      function getCurrentIndex() {
        for (var i = 0; i < pageItems.length; i++) {
          if (pageItems[i].classList.contains('pagination-item-active')) {
            return i;
          }
        }
        return 0;
      }
      
      // 设置当前页
      function setCurrentPage(index) {
        if (index < 0 || index >= pageItems.length) return;
        
        pageItems.forEach(function(item, i) {
          var isActive = i === index;
          item.classList.toggle('pagination-item-active', isActive);
          // 视觉样式
          if (isActive) {
            item.style.background = '#3b82f6';
            item.style.color = 'white';
            item.style.borderColor = '#3b82f6';
          } else {
            item.style.background = '';
            item.style.color = '';
            item.style.borderColor = '';
          }
        });
        
        // 更新简洁模式的页码
        if (simpleInfo) {
          var match = simpleInfo.textContent.match(/\d+\s*\/\s*(\d+)/);
          if (match) {
            simpleInfo.textContent = (index + 1) + ' / ' + match[1];
          }
        }
      }
      
      // 页码点击
      pageItems.forEach(function(item, index) {
        if (item.disabled) return;
        item.style.cursor = 'pointer';
        item.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          setCurrentPage(index);
        });
      });
      
      // 上一页
      if (prevBtn && !prevBtn.disabled) {
        prevBtn.style.cursor = 'pointer';
        prevBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var current = getCurrentIndex();
          if (current > 0) {
            setCurrentPage(current - 1);
          }
        });
      }
      
      // 下一页
      if (nextBtn && !nextBtn.disabled) {
        nextBtn.style.cursor = 'pointer';
        nextBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var current = getCurrentIndex();
          if (current < pageItems.length - 1) {
            setCurrentPage(current + 1);
          }
        });
      }
    });
  }

  /**
   * 启用 Slider 滑块预览交互
   */
  function enableSliderPreview() {
    document.querySelectorAll('.demo-preview .slider').forEach(function(slider) {
      var track = slider.querySelector('.slider-track');
      var fill = slider.querySelector('.slider-fill, .slider-track-fill');
      var thumb = slider.querySelector('.slider-thumb, .slider-handle');
      var valueDisplay = slider.querySelector('.slider-value');
      
      if (!track || !thumb) return;
      
      var isDragging = false;
      var min = parseFloat(slider.dataset.min) || 0;
      var max = parseFloat(slider.dataset.max) || 100;
      var value = parseFloat(slider.dataset.value) || 50;
      
      function updateSlider(percent) {
        percent = Math.max(0, Math.min(100, percent));
        value = min + (max - min) * (percent / 100);
        
        thumb.style.left = percent + '%';
        if (fill) fill.style.width = percent + '%';
        if (valueDisplay) valueDisplay.textContent = Math.round(value);
      }
      
      function handleMove(clientX) {
        var rect = track.getBoundingClientRect();
        var percent = ((clientX - rect.left) / rect.width) * 100;
        updateSlider(percent);
      }
      
      thumb.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isDragging = true;
        document.body.style.userSelect = 'none';
      });
      
      document.addEventListener('mousemove', function(e) {
        if (isDragging) {
          handleMove(e.clientX);
        }
      });
      
      document.addEventListener('mouseup', function() {
        isDragging = false;
        document.body.style.userSelect = '';
      });
      
      track.addEventListener('click', function(e) {
        handleMove(e.clientX);
      });
    });
  }

  /**
   * 启用 Rate 评分预览交互
   */
  function enableRatePreview() {
    document.querySelectorAll('.demo-preview .rate').forEach(function(rate) {
      var items = rate.querySelectorAll('.rate-item, .rate-star');
      if (items.length === 0) return;
      
      var currentValue = 0;
      
      // 找到当前激活的数量
      items.forEach(function(item, index) {
        if (item.classList.contains('rate-item-active') || item.classList.contains('rate-star-active')) {
          currentValue = index + 1;
        }
      });
      
      items.forEach(function(item, index) {
        // 悬停效果
        item.addEventListener('mouseenter', function() {
          items.forEach(function(i, idx) {
            i.classList.toggle('rate-item-hover', idx <= index);
            i.style.color = idx <= index ? '#fbbf24' : '#d1d5db';
          });
        });
        
        // 点击选择
        item.addEventListener('click', function(e) {
          e.stopPropagation();
          currentValue = index + 1;
          items.forEach(function(i, idx) {
            var isActive = idx < currentValue;
            i.classList.toggle('rate-item-active', isActive);
            i.classList.toggle('rate-star-active', isActive);
            i.style.color = isActive ? '#fbbf24' : '#d1d5db';
          });
        });
      });
      
      // 鼠标离开时恢复
      rate.addEventListener('mouseleave', function() {
        items.forEach(function(item, index) {
          var isActive = index < currentValue;
          item.classList.remove('rate-item-hover');
          item.style.color = isActive ? '#fbbf24' : '#d1d5db';
        });
      });
    });
  }

  /**
   * 启用 Modal 弹窗预览交互（关闭按钮）
   */
  function enableModalPreview() {
    document.querySelectorAll('.demo-preview [style*="border-radius: 12px"][style*="box-shadow"]').forEach(function(modal) {
      var allButtons = modal.querySelectorAll('button');
      
      allButtons.forEach(function(btn) {
        btn.style.cursor = 'pointer';
        
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // 动画效果
          modal.style.transition = 'all 0.3s ease';
          modal.style.opacity = '0';
          modal.style.transform = 'scale(0.95)';
          
          setTimeout(function() {
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
          }, 600);
        });
      });
    });
  }

  /**
   * 启用 Toast 轻提示预览交互（关闭按钮）
   */
  function enableToastPreview() {
    document.querySelectorAll('.demo-preview [style*="border-left: 4px solid"], .demo-preview .toast').forEach(function(toast) {
      var closeBtn = toast.querySelector('button');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(20px)';
          setTimeout(function() {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
          }, 800);
        });
      }
    });
  }

  /**
   * 启用 Alert 警告提示预览交互（关闭按钮）
   */
  function enableAlertPreview() {
    document.querySelectorAll('.demo-preview .alert').forEach(function(alert) {
      var closeBtn = alert.querySelector('.alert-close');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          alert.style.opacity = '0';
          alert.style.height = alert.offsetHeight + 'px';
          setTimeout(function() {
            alert.style.height = '0';
            alert.style.padding = '0';
            alert.style.margin = '0';
          }, 150);
          setTimeout(function() {
            alert.style.opacity = '1';
            alert.style.height = '';
            alert.style.padding = '';
            alert.style.margin = '';
          }, 1000);
        });
      }
    });
  }

  /**
   * 启用 Tooltip 文字提示预览交互
   */
  function enableTooltipPreview() {
    document.querySelectorAll('.demo-preview .tooltip').forEach(function(tooltip) {
      var content = tooltip.querySelector('.tooltip-content');
      if (!content) return;
      
      // 确保父容器允许溢出显示
      var card = tooltip.closest('.demo-card, .demo-preview');
      if (card) {
        card.style.overflow = 'visible';
      }
      
      tooltip.addEventListener('mouseenter', function() {
        content.style.opacity = '1';
        content.style.visibility = 'visible';
        content.style.zIndex = '9999';
      });
      
      tooltip.addEventListener('mouseleave', function() {
        content.style.opacity = '0';
        content.style.visibility = 'hidden';
      });
    });
    
    // 处理 data-tooltip 属性的元素
    document.querySelectorAll('.demo-preview [data-tooltip]').forEach(function(el) {
      var tooltipText = el.getAttribute('data-tooltip');
      if (!tooltipText) return;
      
      el.style.position = 'relative';
      
      el.addEventListener('mouseenter', function() {
        var tip = document.createElement('div');
        tip.className = 'tooltip-popup';
        tip.textContent = tooltipText;
        tip.style.cssText = 'position:absolute;bottom:100%;left:50%;transform:translateX(-50%);padding:6px 10px;background:#1f2937;color:white;font-size:12px;border-radius:4px;white-space:nowrap;z-index:9999;margin-bottom:6px;';
        el.appendChild(tip);
      });
      
      el.addEventListener('mouseleave', function() {
        var tip = el.querySelector('.tooltip-popup');
        if (tip) tip.remove();
      });
    });
  }

  /**
   * 启用 Steps 步骤条预览交互
   */
  function enableStepsPreview() {
    document.querySelectorAll('.demo-preview .steps').forEach(function(steps) {
      // 支持 .step 和 .steps-item 两种命名
      var items = Array.from(steps.querySelectorAll('.step, .steps-item'));
      if (items.length === 0) return;
      
      items.forEach(function(item, index) {
        item.style.cursor = 'pointer';
        
        item.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          items.forEach(function(i, idx) {
            // 清除所有状态
            i.classList.remove('step-done', 'step-active', 'step-wait',
                              'steps-item-active', 'steps-item-finish', 'steps-item-wait');
            
            var icon = i.querySelector('.step-icon, .steps-icon');
            
            if (idx < index) {
              // 已完成
              i.classList.add('step-done');
              if (icon) {
                icon.style.background = '#10b981';
                icon.style.borderColor = '#10b981';
                icon.style.color = 'white';
                icon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
              }
            } else if (idx === index) {
              // 当前
              i.classList.add('step-active');
              if (icon) {
                icon.style.background = '#3b82f6';
                icon.style.borderColor = '#3b82f6';
                icon.style.color = 'white';
                icon.textContent = String(idx + 1);
              }
            } else {
              // 等待
              i.classList.add('step-wait');
              if (icon) {
                icon.style.background = 'white';
                icon.style.borderColor = '#d1d5db';
                icon.style.color = '#9ca3af';
                icon.textContent = String(idx + 1);
              }
            }
          });
        });
      });
    });
  }

  /**
   * 启用 Tag 标签预览交互（关闭按钮）
   */
  function enableTagPreview() {
    document.querySelectorAll('.demo-preview .tag').forEach(function(tag) {
      var closeBtn = tag.querySelector('.tag-close');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          tag.style.opacity = '0';
          tag.style.transform = 'scale(0.8)';
          setTimeout(function() {
            tag.style.opacity = '1';
            tag.style.transform = 'scale(1)';
          }, 800);
        });
      }
    });
  }

  /**
   * 注入组件样式
   */
  function injectComponentStyles(config) {
    var styleId = 'component-style-' + currentComponent;
    var existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    if (currentCss) {
      var style = document.createElement('style');
      style.id = styleId;
      style.textContent = currentCss;
      document.head.appendChild(style);
    }
  }

  /**
   * 切换代码显示/隐藏
   */
  function toggleCode(demoId, btn) {
    var codeEl = document.getElementById(demoId);
    if (!codeEl) return;
    
    var isOpen = codeEl.classList.toggle('is-open');
    btn.classList.toggle('is-active', isOpen);
    
    // 更新按钮标题
    btn.setAttribute('title', isOpen ? '隐藏代码' : '显示代码');
    
    // 更新图标
    var icon = btn.querySelector('i');
    if (icon) {
      icon.className = isOpen ? 'ri-code-s-slash-fill' : 'ri-code-s-slash-line';
    }
  }

  /**
   * 切换代码 Tab（HTML / CSS）
   */
  function switchCodeTab(demoId, tab, btn) {
    var container = document.getElementById(demoId);
    if (!container) return;
    
    // 切换 tab 按钮状态
    var tabs = container.querySelectorAll('.demo-code-tab');
    tabs.forEach(function(t) {
      t.classList.toggle('is-active', t === btn);
    });
    
    // 切换代码面板
    var panels = container.querySelectorAll('.demo-code-panel');
    panels.forEach(function(panel) {
      if (tab === 'html') {
        panel.classList.toggle('is-active', panel.classList.contains('demo-code-html'));
      } else {
        panel.classList.toggle('is-active', panel.classList.contains('demo-code-css'));
      }
    });
    
    // 更新复制按钮的数据
    var copyBtn = container.querySelector('.demo-copy-btn');
    if (copyBtn) {
      if (tab === 'html') {
        copyBtn.setAttribute('title', '复制 HTML');
        copyBtn.setAttribute('data-code', copyBtn.getAttribute('data-html-code'));
      } else {
        copyBtn.setAttribute('title', '复制 CSS');
        copyBtn.setAttribute('data-code', copyBtn.getAttribute('data-css-code'));
      }
    }
  }

  /**
   * 切换 CSS 显示
   */
  function toggleCss(btn) {
    var codeEl = document.getElementById('css-code');
    if (!codeEl) return;
    
    var isOpen = codeEl.classList.toggle('is-open');
    btn.classList.toggle('is-active', isOpen);
  }

  /**
   * 复制代码
   */
  function copyCode(btn) {
    var code = decodeURIComponent(btn.getAttribute('data-code'));
    copyToClipboard(code).then(function() {
      var icon = btn.querySelector('i');
      icon.className = 'ri-check-line';
      btn.classList.add('is-copied');
      
      // 埋点
      trackComponentEvent('component_copy', currentCategory, currentComponent, 'html');
      
      setTimeout(function() {
        icon.className = 'ri-file-copy-line';
        btn.classList.remove('is-copied');
      }, 2000);
    });
  }

  /**
   * 复制 CSS
   */
  function copyCss(btn) {
    copyToClipboard(currentCss).then(function() {
      var icon = btn.querySelector('i');
      icon.className = 'ri-check-line';
      btn.classList.add('is-copied');
      
      trackComponentEvent('component_copy', currentCategory, currentComponent, 'css');
      
      setTimeout(function() {
        icon.className = 'ri-file-copy-line';
        btn.classList.remove('is-copied');
      }, 2000);
    });
  }

  /**
   * 复制到剪贴板
   */
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    
    // 降级方案
    return new Promise(function(resolve, reject) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (e) {
        reject(e);
      }
      document.body.removeChild(textarea);
    });
  }

  /**
   * 获取文件内容
   */
  async function fetchFile(url) {
    var response = await fetch(url + '?t=' + Date.now());
    if (!response.ok) throw new Error('文件加载失败: ' + url);
    return response.text();
  }

  /**
   * HTML 转义
   */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 埋点
   */
  function trackComponentEvent(event, category, component, type) {
    if (typeof LA !== 'undefined' && LA.track) {
      var params = { category: category, component: component };
      if (type) params.type = type;
      LA.track(event, params);
    }
  }

  // 监听路由加载完成事件
  window.addEventListener('toolContentLoaded', function(e) {
    if (e.detail === 'component-lib') {
      init();
    }
  });

  // 监听组件库内部路由变化（浏览器后退/前进）
  window.addEventListener('componentLibHashChange', function(e) {
    var componentInfo = getComponentFromUrl();
    if (componentInfo) {
      loadComponent(componentInfo.component, componentInfo.category);
    }
  });

  // 如果已经在组件库页面，立即初始化
  if (document.getElementById('componentBody')) {
    init();
  }

  // 暴露公共方法
  window.ComponentLib = {
    loadComponent: loadComponent,
    switchCodeTab: switchCodeTab,
    toggleCode: toggleCode,
    toggleCss: toggleCss,
    copyCode: copyCode,
    copyCss: copyCss
  };

})();
