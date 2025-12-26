// 设置页面逻辑 - 弹窗版本
(function() {
  'use strict';

  let currentTab = 'api';
  let currentEditProvider = null;
  let currentEditTool = null;
  let currentGuideImageData = null;
  let guideConfigMap = {};
  let selectedProvider = '';
  let selectedProviderText = '请选择厂商';

  // DOM元素
  let elements = {};

  // 工具列表
  const TOOLS = [
    { id: 'xiaohongshu', name: '小红书' },
    { id: 'product-assistant', name: '产品助理' },
    { id: 'daily-report', name: '报告小助手' },
    { id: 'fund-assistant', name: '基金助手' },
    { id: 'drama-workshop', name: '短剧工坊', requireAdmin: true }
  ];
  
  // 获取当前用户可见的工具列表
  function getVisibleTools() {
    const isAdmin = window.ToolsAuth && window.ToolsAuth.isAdmin();
    return TOOLS.filter(tool => !tool.requireAdmin || isAdmin);
  }


  // 提供商配置定义（只管理 Key，模型在工具页选择）
  const PROVIDER_CONFIGS = {
    openai: {
      name: 'OpenAI (GPT)',
      fields: [
        { id: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: '请输入 API Key' },
        { id: 'baseUrl', label: 'API 基础地址', type: 'text', required: true, default: 'https://api.openai.com/v1', hidden: true }
      ]
    },
    qwen: {
      name: '阿里云通义千问',
      fields: [
        { id: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: '请输入 DashScope API Key' },
        { id: 'baseUrl', label: 'API 基础地址', type: 'text', required: true, default: 'https://dashscope.aliyuncs.com/compatible-mode/v1', hidden: true }
      ]
    },
    bailian: {
      name: '阿里云百炼',
      fields: [
        { id: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: '请输入百炼平台 API Key' },
        { id: 'baseUrl', label: 'API 基础地址', type: 'text', required: true, default: 'https://dashscope.aliyuncs.com/compatible-mode/v1', hidden: true }
      ]
    },
    claude: {
      name: 'Anthropic Claude',
      fields: [
        { id: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: '请输入 API Key' },
        { id: 'apiVersion', label: 'API 版本', type: 'text', required: true, default: '2023-06-01', hidden: true },
        { id: 'baseUrl', label: 'API 基础地址', type: 'text', required: true, default: 'https://api.anthropic.com', hidden: true }
      ]
    },
    deepseek: {
      name: 'DeepSeek',
      fields: [
        { id: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: '请输入 API Key' },
        { id: 'baseUrl', label: 'API 基础地址', type: 'text', required: true, default: 'https://api.deepseek.com/v1', hidden: true }
      ]
    },
    moonshot: {
      name: '月之暗面 Kimi',
      fields: [
        { id: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: '请输入 API Key' },
        { id: 'baseUrl', label: 'API 基础地址', type: 'text', required: true, default: 'https://api.moonshot.cn/v1', hidden: true }
      ]
    },
    zhipu: {
      name: '智谱 GLM',
      fields: [
        { id: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: '请输入 API Key' },
        { id: 'baseUrl', label: 'API 基础地址', type: 'text', required: true, default: 'https://open.bigmodel.cn/api/paas/v4', hidden: true }
      ]
    },
    minimax: {
      name: 'MiniMax',
      fields: [
        { id: 'groupId', label: 'Group ID', type: 'text', required: true, placeholder: '请输入 Group ID' },
        { id: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: '请输入 API Key' },
        { id: 'baseUrl', label: 'API 基础地址', type: 'text', required: true, default: 'https://api.minimax.chat/v1', hidden: true }
      ]
    },
    baichuan: {
      name: '百川智能',
      fields: [
        { id: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: '请输入 API Key' },
        { id: 'baseUrl', label: 'API 基础地址', type: 'text', required: true, default: 'https://api.baichuan-ai.com/v1', hidden: true }
      ]
    }
  };



  // 等待内容加载
  window.addEventListener('toolContentLoaded', function(e) {
    if (e.detail !== 'settings') return;
    initSettings();
  });

  // 创建弹窗HTML
  function createModals() {
    // 如果弹窗已存在，先移除
    const existingAPIModal = document.getElementById('apiConfigModal');
    const existingGuideModal = document.getElementById('guideConfigModal');
    const existingDropdown = document.getElementById('providerDropdown');
    if (existingAPIModal) existingAPIModal.remove();
    if (existingGuideModal) existingGuideModal.remove();
    if (existingDropdown) existingDropdown.remove();
    
    // API配置弹窗
    const apiModalHTML = `
      <div class="modal-overlay" id="apiConfigModal" style="display: none;">
        <div class="modal-box" style="max-width: 500px;">
          <div class="modal-header">
            <h3 id="apiModalTitle">新增配置</h3>
            <i class="ri-close-line modal-close" id="apiModalClose"></i>
          </div>
          <div class="modal-body">
            <div class="settings-form" id="apiConfigForm">
              <div class="form-group">
                <label>厂商 <span class="required">*</span></label>
                <div id="providerSelect" class="ui-select">
                  <div class="ui-select-trigger" tabindex="0">
                    <span class="ui-select-value is-placeholder">请选择厂商</span>
                  </div>
                  <div class="ui-select-dropdown">
                    <div class="ui-select-option" data-value="">请选择厂商</div>
                    <div class="ui-select-option" data-value="openai">OpenAI (GPT)</div>
                    <div class="ui-select-option" data-value="qwen">阿里云通义千问</div>
                    <div class="ui-select-option" data-value="bailian">阿里云百炼</div>
                    <div class="ui-select-option" data-value="claude">Anthropic Claude</div>
                    <div class="ui-select-option" data-value="deepseek">DeepSeek</div>
                    <div class="ui-select-option" data-value="moonshot">月之暗面 Kimi</div>
                    <div class="ui-select-option" data-value="zhipu">智谱 GLM</div>
                    <div class="ui-select-option" data-value="minimax">MiniMax</div>
                    <div class="ui-select-option" data-value="baichuan">百川智能</div>
                  </div>
                </div>
              </div>
              
              <!-- 动态字段区域 -->
              <div id="providerFields"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="modal-btn cancel" id="apiModalCancel">取消</button>
            <button class="modal-btn confirm" id="apiModalSave">保存</button>
          </div>
        </div>
      </div>
    `;
    
    // 引导配置弹窗
    const guideModalHTML = `
      <div class="modal-overlay" id="guideConfigModal" style="display: none;">
        <div class="modal-box guide-modal-compact">
          <div class="modal-header">
            <h3 id="guideModalTitle">配置引导</h3>
            <i class="ri-close-line modal-close" id="guideModalClose"></i>
          </div>
          <div class="modal-body">
            <div class="settings-form compact-form">
              <div class="form-row">
                <div class="form-group">
                  <label>工具名称</label>
                  <input id="guideToolName" class="form-input" disabled autocomplete="off" />
                </div>
                <div class="form-group">
                  <label>引导标题</label>
                  <input id="guideTitle" class="form-input" placeholder="请输入标题" autocomplete="off" />
                </div>
              </div>
              
              <div class="form-group">
                <label>引导描述</label>
                <textarea id="guideContent" class="form-textarea" rows="4" placeholder="请输入描述" autocomplete="off"></textarea>
              </div>
              
              <div class="form-group">
                <label>引导图片 <span class="label-hint">推荐比例 16:9</span></label>
                <div class="image-upload-wrapper compact">
                  <div class="image-upload-area" id="guideImageUploadArea">
                    <i class="ri-image-add-line"></i>
                    <span>上传图片</span>
                  </div>
                  <div class="image-preview-container" id="guideImagePreviewContainer" style="display: none;">
                    <img id="guideImagePreview" class="image-preview" />
                    <button class="image-delete-btn" id="guideImageDeleteBtn">
                      <i class="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
                <input type="file" id="guideImageInput" accept="image/*" style="display: none;" />
              </div>
              
              <input type="checkbox" id="guideNeedsConfig" style="display: none;" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="modal-btn cancel" id="guideModalCancel">取消</button>
            <button class="modal-btn confirm" id="guideModalSave">保存</button>
          </div>
        </div>
      </div>
    `;
    
    // 添加到body
    document.body.insertAdjacentHTML('beforeend', apiModalHTML);
    document.body.insertAdjacentHTML('beforeend', guideModalHTML);
    
    console.log('✓ 弹窗已创建并添加到body');
  }

  function initSettings() {
    console.log('=== 设置页面初始化 ===');
    
    // 先创建弹窗（添加到body，而不是模板中）
    createModals();
    
    // 延迟获取DOM元素，确保弹窗已创建
    setTimeout(() => {
      // 从页面内容区获取
      elements = {
        // 标签
        tabs: document.querySelectorAll('.settings-tab'),
        apiPanel: document.getElementById('apiPanel'),
        guidePanel: document.getElementById('guidePanel'),
        guideTab: document.getElementById('settingsGuideTab'),
        
        // API 配置相关
        apiList: document.getElementById('apiList'),
        apiEmptyState: document.getElementById('apiEmptyState'),
        addApiBtn: document.getElementById('addApiBtn'),
        
        // 引导管理相关
        guideGrid: document.getElementById('guideGrid')
      };
      
      // 从body获取弹窗元素（因为它们是动态创建的）
      Object.assign(elements, {
        // API 配置弹窗
        apiConfigModal: document.getElementById('apiConfigModal'),
        apiModalClose: document.getElementById('apiModalClose'),
        apiModalTitle: document.getElementById('apiModalTitle'),
        apiModalCancel: document.getElementById('apiModalCancel'),
        apiModalSave: document.getElementById('apiModalSave'),
        
        // API 表单
        providerSelect: document.getElementById('providerSelect'),
        
        // 引导配置弹窗
        guideConfigModal: document.getElementById('guideConfigModal'),
        guideModalClose: document.getElementById('guideModalClose'),
        guideModalTitle: document.getElementById('guideModalTitle'),
        guideModalCancel: document.getElementById('guideModalCancel'),
        guideModalSave: document.getElementById('guideModalSave'),
        
        // 引导表单
        guideToolName: document.getElementById('guideToolName'),
        guideTitle: document.getElementById('guideTitle'),
        guideContent: document.getElementById('guideContent'),
        guideNeedsConfig: document.getElementById('guideNeedsConfig'),
        guideImageUploadArea: document.getElementById('guideImageUploadArea'),
        guideImagePreviewContainer: document.getElementById('guideImagePreviewContainer'),
        guideImagePreview: document.getElementById('guideImagePreview'),
        guideImageDeleteBtn: document.getElementById('guideImageDeleteBtn'),
        guideImageInput: document.getElementById('guideImageInput')
      });
      
      console.log('DOM元素状态:', {
        addApiBtn: !!elements.addApiBtn,
        guideTab: !!elements.guideTab,
        apiConfigModal: !!elements.apiConfigModal,
        guideConfigModal: !!elements.guideConfigModal,
        apiModalClose: !!elements.apiModalClose,
        providerSelect: !!elements.providerSelect
      });
      
      // 初始化
      initEventListeners();
      initUISelect();
      checkAdminPermission();
      loadAPIList();
      
      console.log('=== 初始化完成 ===');
    }, 100);
  }

  // 初始化事件监听
  function initEventListeners() {
    console.log('绑定事件监听器');
    
    // 标签切换
    if (elements.tabs && elements.tabs.length > 0) {
      elements.tabs.forEach(tab => {
        tab.addEventListener('click', function() {
          switchTab(this.dataset.tab);
        });
      });
    }
    
    // API 配置按钮
    if (elements.addApiBtn) {
      console.log('✓ 绑定新增API配置按钮');
      elements.addApiBtn.addEventListener('click', () => {
        console.log('点击新增配置');
        openAPIConfigModal(null);
      });
    } else {
      console.error('✗ 新增API配置按钮未找到');
    }
    
    // API 弹窗事件
    if (elements.apiModalClose) {
      elements.apiModalClose.addEventListener('click', closeAPIConfigModal);
    }
    if (elements.apiModalCancel) {
      elements.apiModalCancel.addEventListener('click', closeAPIConfigModal);
    }
    if (elements.apiModalSave) {
      elements.apiModalSave.addEventListener('click', saveAPIConfig);
    }
    // API配置弹窗：阻止modal-box内的点击事件冒泡
    const apiModalBox = elements.apiConfigModal?.querySelector('.modal-box');
    if (apiModalBox) {
      apiModalBox.addEventListener('mousedown', (e) => e.stopPropagation());
      apiModalBox.addEventListener('click', (e) => e.stopPropagation());
    }
    
    // 引导弹窗事件
    if (elements.guideModalClose) {
      elements.guideModalClose.addEventListener('click', closeGuideConfigModal);
    }
    if (elements.guideModalCancel) {
      elements.guideModalCancel.addEventListener('click', closeGuideConfigModal);
    }
    if (elements.guideModalSave) {
      elements.guideModalSave.addEventListener('click', saveGuideConfig);
    }
    // 引导配置弹窗：阻止modal-box内的点击事件冒泡
    const guideModalBox = elements.guideConfigModal?.querySelector('.modal-box');
    if (guideModalBox) {
      guideModalBox.addEventListener('mousedown', (e) => e.stopPropagation());
      guideModalBox.addEventListener('click', (e) => e.stopPropagation());
    }
    
    // 图片上传
    if (elements.guideImageUploadArea) {
      elements.guideImageUploadArea.addEventListener('click', () => {
        if (elements.guideImageInput) elements.guideImageInput.click();
      });
    }
    if (elements.guideImageInput) {
      elements.guideImageInput.addEventListener('change', handleImageUpload);
    }
    if (elements.guideImageDeleteBtn) {
      elements.guideImageDeleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteImage();
      });
    }
  }

  // 检查管理员权限
  function checkAdminPermission() {
    if (!elements.guideTab) return;
    
    if (window.toolsSupabase) {
      window.toolsSupabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          elements.guideTab.style.display = 'flex';
          console.log('✓ 显示引导管理tab');
        }
      });
    }
    
    // 监听登录状态
    if (!window._settingsLoginListenerAdded) {
      window._settingsLoginListenerAdded = true;
      
      window.addEventListener('toolsUserLoggedIn', () => {
        if (elements.guideTab) elements.guideTab.style.display = 'flex';
      });
      
      window.addEventListener('toolsUserLoggedOut', () => {
        if (elements.guideTab) elements.guideTab.style.display = 'none';
        if (currentTab === 'guide') switchTab('api');
      });
    }
  }

  // 切换标签
  function switchTab(tabType) {
    currentTab = tabType;
    
    if (elements.tabs) {
      elements.tabs.forEach(t => t.classList.remove('is-active'));
      const activeTab = Array.from(elements.tabs).find(t => t.dataset.tab === tabType);
      if (activeTab) activeTab.classList.add('is-active');
    }
    
    if (tabType === 'api') {
      if (elements.apiPanel) elements.apiPanel.classList.add('is-active');
      if (elements.guidePanel) elements.guidePanel.classList.remove('is-active');
      loadAPIList();
    } else if (tabType === 'guide') {
      if (elements.apiPanel) elements.apiPanel.classList.remove('is-active');
      if (elements.guidePanel) elements.guidePanel.classList.add('is-active');
      loadGuideList();
    }
  }

  // ===== API 配置功能 =====

  function openAPIConfigModal(provider) {
    console.log('打开API配置弹窗:', provider);
    if (!elements.apiConfigModal) {
      console.error('API配置弹窗元素未找到');
      return;
    }
    
    currentEditProvider = provider;
    
    if (provider) {
      elements.apiModalTitle.textContent = '编辑配置';
      loadAPIConfigToForm(provider);
    } else {
      elements.apiModalTitle.textContent = '新增配置';
      resetAPIForm();
    }
    
    // 使用class控制显示
    elements.apiConfigModal.classList.add('is-visible');
    console.log('✓ 弹窗已显示');
  }

  function closeAPIConfigModal() {
    if (elements.apiConfigModal) {
      elements.apiConfigModal.classList.remove('is-visible');
    }
    // 关闭下拉菜单
    if (elements.providerSelect) {
      elements.providerSelect.classList.remove('is-open');
    }
    const dropdown = document.getElementById('providerDropdown');
    if (dropdown) {
      dropdown.classList.remove('is-visible');
    }
  }

  function loadAPIList() {
    if (!elements.apiList) return;
    
    const configs = window.ToolsAPIConfig.loadAllConfigs();
    const activeProvider = window.ToolsAPIConfig.getActiveProvider();
    const allProviders = window.ToolsAPIConfig.getAllProviders();
    
    const configKeys = Object.keys(configs);
    
    if (configKeys.length === 0) {
      elements.apiList.innerHTML = '';
      elements.apiEmptyState.style.display = 'flex';
      return;
    }
    
    elements.apiEmptyState.style.display = 'none';
    
    elements.apiList.innerHTML = configKeys.map(key => {
      const config = configs[key];
      const providerInfo = allProviders[key];
      const isActive = key === activeProvider;
      
      // 判断 icon 是 URL 还是 emoji
      const iconHtml = providerInfo.icon.startsWith('http') 
        ? `<img src="${providerInfo.icon}" alt="${providerInfo.name}" />`
        : providerInfo.icon;
      
      return `
        <div class="api-item ${isActive ? 'is-active' : ''}" data-provider="${key}">
          <div class="api-item-info">
            <div class="api-item-icon">
              ${iconHtml}
            </div>
            <div class="api-item-details">
              <div class="api-item-name">${providerInfo.name}</div>
            </div>
            ${isActive ? '<span class="api-item-badge"><i class="ri-check-line"></i> 使用中</span>' : ''}
          </div>
          <div class="api-item-actions">
            <button class="btn-icon" data-action="edit" title="编辑">
              <i class="ri-edit-line"></i>
            </button>
            <button class="btn-icon btn-delete" data-action="delete" title="删除">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    // 绑定事件
    elements.apiList.querySelectorAll('.api-item').forEach(item => {
      const provider = item.dataset.provider;
      
      item.addEventListener('click', (e) => {
        if (e.target.closest('[data-action]')) return;
        window.ToolsAPIConfig.setActiveProvider(provider);
        loadAPIList();
        window.dispatchEvent(new CustomEvent('apiConfigUpdated'));
      });
      
      const editBtn = item.querySelector('[data-action="edit"]');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openAPIConfigModal(provider);
        });
      }
      
      const deleteBtn = item.querySelector('[data-action="delete"]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const providerInfo = allProviders[provider];
          if (confirm(`确定要删除 ${providerInfo.name} 的配置吗？`)) {
            window.ToolsAPIConfig.deleteConfig(provider);
            if (provider === activeProvider) {
              window.ToolsAPIConfig.setActiveProvider('');
            }
            loadAPIList();
            window.dispatchEvent(new CustomEvent('apiConfigUpdated'));
          }
        });
      }
    });
  }

  function loadAPIConfigToForm(provider) {
    const config = window.ToolsAPIConfig.getConfig(provider);
    if (!config) return;
    
    const providerConfig = PROVIDER_CONFIGS[provider];
    const providerName = providerConfig ? providerConfig.name : provider;
    
    // 更新选择器显示，但不渲染字段（skipRender=true）
    selectOption(provider, providerName, true);
    
    // 用保存的配置值渲染字段
    renderProviderFields(provider, config);
  }

  function resetAPIForm() {
    selectOption('', '请选择厂商');
    const container = document.getElementById('providerFields');
    if (container) container.innerHTML = '';
  }

  async function saveAPIConfig() {
    const provider = selectedProvider;
    
    if (!provider) {
      showMessage('请选择厂商', 'warning');
      return;
    }
    
    const providerConfig = PROVIDER_CONFIGS[provider];
    if (!providerConfig) {
      showMessage('未知的提供商', 'error');
      return;
    }
    
    // 收集所有字段的值
    const configData = { provider };
    
    for (const field of providerConfig.fields) {
      let value;
      if (field.hidden) {
        // 隐藏字段使用默认值
        value = field.default || '';
      } else {
        const el = document.getElementById(`field_${field.id}`);
        if (field.type === 'select') {
          // ui-select 从 data-value 获取值
          value = el ? el.getAttribute('data-value') || '' : '';
        } else {
          value = el ? el.value.trim() : '';
        }
      }
      
      // 验证必填字段
      if (field.required && !value) {
        showMessage(`请填写 ${field.label}`, 'warning');
        return;
      }
      
      configData[field.id] = value;
    }
    
    // 检查是否已存在配置
    const existingConfig = window.ToolsAPIConfig.getConfig(provider);
    if (existingConfig && currentEditProvider !== provider) {
      if (!confirm(`${providerConfig.name} 已配置，是否覆盖现有配置？`)) {
        return;
      }
    }
    
    // 保存配置
    const success = window.ToolsAPIConfig.saveProviderConfig(provider, configData);
    
    if (success) {
      showMessage('配置保存成功！', 'success');
      closeAPIConfigModal();
      loadAPIList();
      window.dispatchEvent(new CustomEvent('apiConfigUpdated'));
      
      // 埋点：API 配置保存
      if (typeof trackEvent === 'function') {
        trackEvent('api_config_save', { provider: provider });
      }
    } else {
      showMessage('配置保存失败，请重试', 'error');
    }
  }
  
  function deleteAPIConfig() {
    if (!currentEditProvider) return;
    
    const providerInfo = window.ToolsAPIConfig.getProviderInfo(currentEditProvider);
    const activeProvider = window.ToolsAPIConfig.getActiveProvider();
    
    if (!confirm(`确定要删除 ${providerInfo.name} 的配置吗？`)) {
      return;
    }
    
    const success = window.ToolsAPIConfig.deleteConfig(currentEditProvider);
    if (success) {
      if (currentEditProvider === activeProvider) {
        window.ToolsAPIConfig.setActiveProvider('');
      }
      showMessage('配置已删除', 'success');
      closeAPIConfigModal();
      loadAPIList();
      window.dispatchEvent(new CustomEvent('apiConfigUpdated'));
    } else {
      showMessage('删除失败，请重试', 'error');
    }
  }

  // UI Select 功能
  function initUISelect() {
    if (!elements.providerSelect) {
      console.log('initUISelect: providerSelect 不存在');
      return;
    }
    
    const trigger = elements.providerSelect.querySelector('.ui-select-trigger');
    if (!trigger) {
      console.log('initUISelect: trigger 不存在');
      return;
    }
    
    // 检查 dropdown 是否已经被移到 body
    let dropdown = document.getElementById('providerDropdown');
    if (!dropdown) {
      // 从弹窗中获取dropdown并移到body
      dropdown = elements.providerSelect.querySelector('.ui-select-dropdown');
      if (!dropdown) {
        console.log('initUISelect: dropdown 不存在');
        return;
      }
      dropdown.id = 'providerDropdown';
      document.body.appendChild(dropdown);
    }
    
    console.log('initUISelect: 开始绑定事件');
    
    const options = dropdown.querySelectorAll('.ui-select-option');
    
    // 绑定trigger点击事件
    trigger.onclick = function(e) {
      e.stopPropagation();
      
      const dd = document.getElementById('providerDropdown');
      if (!dd) return;
      
      const isOpen = dd.classList.contains('is-visible');
      
      if (!isOpen) {
        const rect = trigger.getBoundingClientRect();
        dd.style.top = (rect.bottom + 4) + 'px';
        dd.style.left = rect.left + 'px';
        dd.style.width = rect.width + 'px';
        dd.classList.add('is-visible');
        elements.providerSelect.classList.add('is-open');
      } else {
        dd.classList.remove('is-visible');
        elements.providerSelect.classList.remove('is-open');
      }
    };
    
    // 绑定选项点击事件
    options.forEach(option => {
      option.onclick = function(e) {
        e.stopPropagation();
        const value = this.getAttribute('data-value');
        const text = this.textContent;
        selectOption(value, text);
        const dd = document.getElementById('providerDropdown');
        if (dd) dd.classList.remove('is-visible');
        elements.providerSelect.classList.remove('is-open');
      };
    });
    
    // 点击其他地方关闭下拉菜单（只绑定一次）
    if (!window._providerDropdownClickBound) {
      window._providerDropdownClickBound = true;
      document.addEventListener('click', function(e) {
        const dd = document.getElementById('providerDropdown');
        if (dd && dd.classList.contains('is-visible') &&
            !dd.contains(e.target) && 
            elements.providerSelect && !elements.providerSelect.contains(e.target)) {
          dd.classList.remove('is-visible');
          elements.providerSelect.classList.remove('is-open');
        }
      });
    }
  }

  function selectOption(value, text, skipRender = false) {
    selectedProvider = value;
    selectedProviderText = text;
    
    const valueEl = elements.providerSelect.querySelector('.ui-select-value');
    if (valueEl) {
      valueEl.textContent = text;
      
      if (value) {
        valueEl.classList.remove('is-placeholder');
      } else {
        valueEl.classList.add('is-placeholder');
      }
    }
    
    const options = document.querySelectorAll('#providerDropdown .ui-select-option, .ui-select-dropdown .ui-select-option');
    options.forEach(opt => {
      if (opt.getAttribute('data-value') === value) {
        opt.classList.add('is-selected');
      } else {
        opt.classList.remove('is-selected');
      }
    });
    
    // 渲染对应提供商的动态字段（除非跳过）
    if (!skipRender) {
      renderProviderFields(value);
    }
  }

  // 渲染提供商动态字段
  function renderProviderFields(provider, existingConfig = null) {
    const container = document.getElementById('providerFields');
    if (!container) return;
    
    if (!provider || !PROVIDER_CONFIGS[provider]) {
      container.innerHTML = '';
      return;
    }
    
    const config = PROVIDER_CONFIGS[provider];
    let html = '';
    
    config.fields.forEach(field => {
      // 如果字段是隐藏的（有默认值且不需要用户修改），跳过渲染
      if (field.hidden) return;
      
      // 只有在编辑模式（existingConfig存在）且有保存的值时才预填
      let value = '';
      if (existingConfig && existingConfig[field.id]) {
        value = existingConfig[field.id];
      }
      
      const requiredMark = field.required ? '<span class="required">*</span>' : '';
      
      if (field.type === 'select') {
        // select 字段
        const options = field.options || [];
        const selectedText = value || options[0] || '请选择';
        html += `
          <div class="form-group">
            <label>${field.label} ${requiredMark}</label>
            <div id="field_${field.id}" class="ui-select ui-select-inline" data-value="${value}">
              <div class="ui-select-trigger" tabindex="0">
                <span class="ui-select-value">${selectedText}</span>
              </div>
              <div class="ui-select-dropdown">
                ${options.map(opt => `<div class="ui-select-option${value === opt ? ' is-selected' : ''}" data-value="${opt}">${opt}</div>`).join('')}
              </div>
            </div>
          </div>
        `;
      } else {
        const inputType = field.type === 'password' ? 'password' : 'text';
        const placeholder = field.placeholder || '';
        // 生成随机 name 防止浏览器记住
        const randomName = `field_${field.id}_${Math.random().toString(36).substr(2, 9)}`;
        html += `
          <div class="form-group">
            <label>${field.label} ${requiredMark}</label>
            <input id="field_${field.id}" name="${randomName}" class="form-input" type="${inputType}" 
                   placeholder="${placeholder}" value="${value}" 
                   autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                   data-lpignore="true" data-form-type="other" data-1p-ignore="true" />
          </div>
        `;
      }
    });
    
    container.innerHTML = html;
    
    // 初始化内联ui-select组件
    initInlineSelects(container);
    
    // 强制禁用密码字段的自动填充
    container.querySelectorAll('input[type="password"]').forEach(input => {
      // 先设为 readonly，聚焦时移除
      input.setAttribute('readonly', 'readonly');
      input.addEventListener('focus', function() {
        this.removeAttribute('readonly');
      });
      input.addEventListener('blur', function() {
        this.setAttribute('readonly', 'readonly');
      });
    });
    
    // 延迟清空输入字段以对抗浏览器自动填充（仅新增模式）
    if (!existingConfig) {
      setTimeout(() => {
        config.fields.forEach(field => {
          if (field.hidden || field.type === 'select') return;
          const el = document.getElementById(`field_${field.id}`);
          if (el && el.value && !existingConfig) {
            el.value = '';
          }
        });
      }, 100);
    }
  }


  // 初始化内联的ui-select组件
  function initInlineSelects(container) {
    const selects = container.querySelectorAll('.ui-select-inline');
    
    selects.forEach(select => {
      const trigger = select.querySelector('.ui-select-trigger');
      const dropdown = select.querySelector('.ui-select-dropdown');
      const valueEl = select.querySelector('.ui-select-value');
      const options = select.querySelectorAll('.ui-select-option');
      
      if (!trigger || !dropdown) return;
      
      // 点击触发器切换下拉
      trigger.onclick = (e) => {
        e.stopPropagation();
        
        // 关闭其他下拉
        document.querySelectorAll('.ui-select-inline.is-open').forEach(s => {
          if (s !== select) s.classList.remove('is-open');
        });
        
        select.classList.toggle('is-open');
      };
      
      // 点击选项
      options.forEach(option => {
        option.onclick = (e) => {
          e.stopPropagation();
          const val = option.getAttribute('data-value');
          const text = option.textContent;
          
          // 更新值
          select.setAttribute('data-value', val);
          valueEl.textContent = text;
          
          // 更新选中状态
          options.forEach(o => o.classList.remove('is-selected'));
          option.classList.add('is-selected');
          
          // 关闭下拉
          select.classList.remove('is-open');
        };
      });
    });
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.ui-select-inline')) {
        document.querySelectorAll('.ui-select-inline.is-open').forEach(s => {
          s.classList.remove('is-open');
        });
      }
    });
  }

  // ===== 引导管理功能 =====

  function openGuideConfigModal(tool, config) {
    if (!elements.guideConfigModal) return;
    
    currentEditTool = tool;
    currentGuideImageData = config ? config.image_url : null;
    
    elements.guideModalTitle.textContent = `配置 - ${tool.name}`;
    if (elements.guideToolName) elements.guideToolName.value = tool.name;
    if (elements.guideTitle) elements.guideTitle.value = config ? config.title : '';
    if (elements.guideContent) elements.guideContent.value = config ? config.content : '';
    if (elements.guideNeedsConfig) elements.guideNeedsConfig.checked = config ? config.needs_config : false;
    
    if (currentGuideImageData) {
      if (elements.guideImagePreview) elements.guideImagePreview.src = currentGuideImageData;
      if (elements.guideImagePreviewContainer) elements.guideImagePreviewContainer.style.display = 'flex';
      if (elements.guideImageUploadArea) elements.guideImageUploadArea.style.display = 'none';
    } else {
      if (elements.guideImagePreviewContainer) elements.guideImagePreviewContainer.style.display = 'none';
      if (elements.guideImageUploadArea) elements.guideImageUploadArea.style.display = 'flex';
    }
    
    // 使用class控制显示
    elements.guideConfigModal.classList.add('is-visible');
  }

  function closeGuideConfigModal() {
    if (elements.guideConfigModal) {
      elements.guideConfigModal.classList.remove('is-visible');
    }
  }

  async function loadGuideList() {
    console.log('=== 加载引导列表 ===');
    console.log('guidePanel存在:', !!elements.guidePanel);
    console.log('guidePanel is-active:', elements.guidePanel?.classList.contains('is-active'));
    console.log('guideGrid存在:', !!elements.guideGrid);
    
    if (!elements.guideGrid) {
      console.error('引导网格元素未找到');
      return;
    }
    
    // 显示加载状态
    elements.guideGrid.innerHTML = `
      <div class="empty-state">
        <i class="ri-loader-4-line spin"></i>
        <p>加载中...</p>
      </div>
    `;
    
    // 检查Supabase是否初始化
    if (!window.toolsSupabase) {
      console.warn('Supabase 未初始化');
      elements.guideGrid.innerHTML = `
        <div class="empty-state">
          <i class="ri-error-warning-line"></i>
          <p>数据库未初始化</p>
          <span style="color: var(--text-muted); font-size: 14px;">请联系管理员配置数据库</span>
        </div>
      `;
      return;
    }
    
    // 加载引导配置
    try {
      const { data, error } = await window.toolsSupabase
        .from('guide_configs')
        .select('*');
      
      if (error) {
        console.error('加载引导配置错误:', error);
        elements.guideGrid.innerHTML = `
          <div class="empty-state">
            <i class="ri-error-warning-line"></i>
            <p>加载失败</p>
            <span style="color: var(--text-muted); font-size: 14px;">${error.message}</span>
          </div>
        `;
        return;
      }
      
      // 保存配置
      guideConfigMap = {};
      if (data) {
        data.forEach(config => {
          guideConfigMap[config.tool_id] = config;
        });
        console.log('加载到的引导配置:', Object.keys(guideConfigMap));
      }
      
    } catch (error) {
      console.error('加载引导配置失败:', error);
      elements.guideGrid.innerHTML = `
        <div class="empty-state">
          <i class="ri-error-warning-line"></i>
          <p>加载异常</p>
          <span style="color: var(--text-muted); font-size: 14px;">${error.message || '未知错误'}</span>
        </div>
      `;
      return;
    }
    
    // 渲染工具列表（根据权限过滤）
    const visibleTools = getVisibleTools();
    try {
      elements.guideGrid.innerHTML = visibleTools.map(tool => {
        const config = guideConfigMap[tool.id];
        const hasConfig = !!config;
        
        return `
          <div class="guide-card" data-tool="${tool.id}">
            <div class="guide-card-header">
              <div class="guide-card-title">${tool.name}</div>
              <div class="guide-card-status ${hasConfig ? 'is-configured' : ''}">
                ${hasConfig ? '已配置' : '未配置'}
              </div>
            </div>
            <div class="guide-card-preview">
              ${config && config.image_url ? 
                `<img src="${config.image_url}" alt="${tool.name}">` : 
                `<div class="guide-card-preview-placeholder"><i class="ri-image-line"></i></div>`
              }
            </div>
            ${config && config.title ? 
              `<div class="guide-card-description">${config.title}</div>` : 
              '<div class="guide-card-description" style="color: var(--text-muted);">点击配置引导内容</div>'
            }
          </div>
        `;
      }).join('');
      
      console.log('✓ 渲染了', visibleTools.length, '个工具卡片');
      console.log('guideGrid.children.length:', elements.guideGrid.children.length);
      console.log('guideGrid HTML:', elements.guideGrid.innerHTML.substring(0, 200) + '...');
    } catch (error) {
      console.error('渲染工具卡片失败:', error);
      elements.guideGrid.innerHTML = `
        <div class="empty-state">
          <i class="ri-error-warning-line"></i>
          <p>渲染失败</p>
          <span style="color: var(--text-muted); font-size: 14px;">${error.message}</span>
        </div>
      `;
      return;
    }
    
    // 绑定点击事件
    elements.guideGrid.querySelectorAll('.guide-card').forEach(card => {
      const toolId = card.dataset.tool;
      const tool = visibleTools.find(t => t.id === toolId);
      const config = guideConfigMap[toolId];
      
      card.addEventListener('click', () => {
        console.log('点击工具卡片:', tool.name);
        openGuideConfigModal(tool, config);
      });
    });
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showMessage('请上传图片文件', 'error');
      return;
    }
    
    if (file.size > 500 * 1024) {
      showMessage('图片大小不能超过 500KB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
      currentGuideImageData = event.target.result;
      if (elements.guideImagePreview) elements.guideImagePreview.src = currentGuideImageData;
      if (elements.guideImagePreviewContainer) elements.guideImagePreviewContainer.style.display = 'flex';
      if (elements.guideImageUploadArea) elements.guideImageUploadArea.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  function deleteImage() {
    currentGuideImageData = null;
    if (elements.guideImagePreviewContainer) elements.guideImagePreviewContainer.style.display = 'none';
    if (elements.guideImageUploadArea) elements.guideImageUploadArea.style.display = 'flex';
    if (elements.guideImageInput) elements.guideImageInput.value = '';
  }

  async function saveGuideConfig() {
    if (!currentEditTool) return;
    
    const title = elements.guideTitle ? elements.guideTitle.value.trim() : '';
    // 处理内容：给每行添加 • 前缀（如果没有的话）
    let content = elements.guideContent ? elements.guideContent.value.trim() : '';
    if (content) {
      content = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          // 如果行首已经有 • 或 · 或 - 或 * 等标记，保持不变
          if (/^[•·\-\*]/.test(line)) {
            return line.replace(/^[·\-\*]/, '•'); // 统一替换为 •
          }
          return '• ' + line;
        })
        .join('\n');
    }
    const needsConfig = elements.guideNeedsConfig ? elements.guideNeedsConfig.checked : false;
    
    if (!title && !content && !currentGuideImageData) {
      showMessage('请至少填写标题、内容或上传图片中的一项', 'error');
      return;
    }
    
    if (elements.guideModalSave) {
      elements.guideModalSave.disabled = true;
      elements.guideModalSave.innerHTML = '<i class="ri-loader-4-line spin"></i> 保存中...';
    }
    
    try {
      const sb = window.toolsSupabase;
      if (!sb) throw new Error('Supabase未初始化');
      
      const configData = {
        tool_id: currentEditTool.id,
        tool_name: currentEditTool.name,
        title: title,
        content: content,
        image_url: currentGuideImageData || null,
        needs_config: needsConfig,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await sb
        .from('guide_configs')
        .upsert(configData, { onConflict: 'tool_id' });
      
      if (error) throw error;
      
      showMessage('保存成功', 'success');
      closeGuideConfigModal();
      loadGuideList();
      
    } catch (error) {
      console.error('保存失败:', error);
      showMessage('保存失败：' + error.message, 'error');
    } finally {
      if (elements.guideModalSave) {
        elements.guideModalSave.disabled = false;
        elements.guideModalSave.textContent = '保存';
      }
    }
  }

  // 消息提示
  function showMessage(text, type = 'info') {
    let container = document.querySelector('.ui-message-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'ui-message-container';
      document.body.appendChild(container);
    }
    
    const message = document.createElement('div');
    message.className = `ui-message ui-message--${type}`;
    
    const iconMap = {
      success: 'ri-checkbox-circle-line',
      error: 'ri-error-warning-line',
      warning: 'ri-alert-line',
      info: 'ri-information-line'
    };
    
    message.innerHTML = `
      <i class="${iconMap[type]}"></i>
      <span>${text}</span>
    `;
    
    container.appendChild(message);
    
    requestAnimationFrame(() => {
      message.classList.add('is-visible');
    });
    
    setTimeout(() => {
      message.classList.remove('is-visible');
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 300);
    }, 3000);
  }

})();
