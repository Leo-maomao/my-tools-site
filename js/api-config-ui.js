// API 配置 UI 管理 - 两页式版本
(function() {
    'use strict';
    
    // 消息提示函数
    function showMessage(text, type = 'info') {
        // 创建或获取消息容器
        let container = document.querySelector('.ui-message-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'ui-message-container';
            document.body.appendChild(container);
        }
        
        // 创建消息元素
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
        
        // 显示动画
        requestAnimationFrame(() => {
            message.classList.add('is-visible');
        });
        
        // 3秒后自动消失
        setTimeout(() => {
            message.classList.remove('is-visible');
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 3000);
    }
    
    const modal = document.getElementById('apiConfigModal');
    const modalClose = document.getElementById('apiConfigClose');
    const modalTitle = document.getElementById('modalTitle');
    
    // 页面元素
    const listPage = document.getElementById('configListPage');
    const editPage = document.getElementById('configEditPage');
    const configuredProvidersList = document.getElementById('configuredProvidersList');
    const emptyState = document.getElementById('emptyState');
    
    // 按钮元素
    const listPageActions = document.getElementById('listPageActions');
    const editPageActions = document.getElementById('editPageActions');
    const addConfigBtn = document.getElementById('addConfigBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const deleteConfigBtn = document.getElementById('deleteConfigBtn');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    
    // 表单元素
    const providerSelect = document.getElementById('providerSelect');
    const apiKeyInput = document.getElementById('apiKey');
    const customFields = document.getElementById('customFields');
    const customEndpoint = document.getElementById('customEndpoint');
    const modelFetchStatus = document.getElementById('modelFetchStatus');
   
    if (!modal) return;
    
    // UI Select 相关
    let selectedProvider = '';
    let selectedProviderText = '-- 请选择提供商 --';
    let currentEditProvider = null; // 当前正在编辑的厂商
    let fetchedModels = []; // 获取到的模型列表
    
    // ===== 页面切换 =====
    
    function showListPage() {
        listPage.style.display = 'block';
        editPage.style.display = 'none';
        listPageActions.style.display = 'flex';
        editPageActions.style.display = 'none';
        modalTitle.textContent = '⚙️ API 配置';
        renderConfiguredProviders();
    }
    
    function showEditPage(provider = null) {
        listPage.style.display = 'none';
        editPage.style.display = 'block';
        listPageActions.style.display = 'none';
        editPageActions.style.display = 'flex';
        
        currentEditProvider = provider;
        
        if (provider) {
            modalTitle.textContent = '编辑配置';
            deleteConfigBtn.style.display = 'inline-flex';
            loadConfigToForm(provider);
        } else {
            modalTitle.textContent = '新增配置';
            deleteConfigBtn.style.display = 'none';
            resetForm();
        }
    }
    
    // ===== 渲染配置列表 =====
    
    function renderConfiguredProviders() {
        const configs = window.ToolsAPIConfig.loadAllConfigs();
        const activeProvider = window.ToolsAPIConfig.getActiveProvider();
        const allProviders = window.ToolsAPIConfig.getAllProviders();
        
        configuredProvidersList.innerHTML = '';
        
        const configuredKeys = Object.keys(configs);
        
        if (configuredKeys.length === 0) {
            configuredProvidersList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        configuredProvidersList.style.display = 'flex';
        emptyState.style.display = 'none';
        
        configuredKeys.forEach(key => {
            const config = configs[key];
            const providerInfo = allProviders[key];
            const isActive = key === activeProvider;
            
            const item = document.createElement('div');
            item.className = `provider-item ${isActive ? 'is-active' : ''}`;
            item.dataset.provider = key;
            
            const modelCount = config.models ? config.models.length : 0;
            
            item.innerHTML = `
                <div class="provider-item-icon">${providerInfo.icon}</div>
                <div class="provider-item-info">
                    <div class="provider-item-name">${providerInfo.name}</div>
                    <div class="provider-item-meta">${modelCount} 个模型</div>
                    ${isActive ? '<span class="provider-item-badge">使用中</span>' : ''}
                </div>
                <div class="provider-item-actions">
                    <button class="provider-item-action-btn btn-edit" data-action="edit" title="编辑">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="provider-item-action-btn btn-delete" data-action="delete" title="删除">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            `;
            
            // 点击整个条目：设置为当前使用
            item.addEventListener('click', (e) => {
                // 如果点击的是按钮，不触发选择
                if (e.target.closest('[data-action]')) return;
                
                window.ToolsAPIConfig.setActiveProvider(key);
                renderConfiguredProviders();
                window.dispatchEvent(new CustomEvent('apiConfigUpdated'));
            });
            
            // 编辑按钮
            const editBtn = item.querySelector('[data-action="edit"]');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showEditPage(key);
            });
            
            // 删除按钮
            const deleteBtn = item.querySelector('[data-action="delete"]');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (!confirm(`确定要删除 ${providerInfo.name} 的配置吗？`)) {
                    return;
                }
                
                const success = window.ToolsAPIConfig.deleteConfig(key);
                if (success) {
                    // 如果删除的是当前使用的，清除当前使用标记
                    if (key === activeProvider) {
                        window.ToolsAPIConfig.setActiveProvider('');
                    }
                    renderConfiguredProviders();
                    window.dispatchEvent(new CustomEvent('apiConfigUpdated'));
                } else {
                    showMessage('删除失败，请重试', 'error');
                }
            });
            
            configuredProvidersList.appendChild(item);
        });
    }
    
    // ===== UI Select 初始化 =====
    
    function initUISelect() {
        const trigger = providerSelect.querySelector('.ui-select-trigger');
        const dropdown = providerSelect.querySelector('.ui-select-dropdown');
        const options = providerSelect.querySelectorAll('.ui-select-option');
        const valueEl = providerSelect.querySelector('.ui-select-value');
        
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = providerSelect.classList.contains('is-open');
            
            if (isOpen) {
                closeUISelect();
            } else {
                openUISelect();
            }
        });
        
        options.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                const value = this.getAttribute('data-value');
                const text = this.textContent;
                selectOption(value, text);
                closeUISelect();
            });
        });
        
        document.addEventListener('click', function(e) {
            if (!providerSelect.contains(e.target)) {
                closeUISelect();
            }
        });
    }
    
    function openUISelect() {
        providerSelect.classList.add('is-open');
    }
    
    function closeUISelect() {
        providerSelect.classList.remove('is-open');
    }
    
    function selectOption(value, text) {
        selectedProvider = value;
        selectedProviderText = text;
        
        const valueEl = providerSelect.querySelector('.ui-select-value');
        valueEl.textContent = text;
        
        if (value) {
            valueEl.classList.remove('is-placeholder');
        } else {
            valueEl.classList.add('is-placeholder');
        }
        
        // 更新选中状态
        const options = providerSelect.querySelectorAll('.ui-select-option');
        options.forEach(opt => {
            if (opt.getAttribute('data-value') === value) {
                opt.classList.add('is-selected');
            } else {
                opt.classList.remove('is-selected');
            }
        });
        
        // 显示/隐藏自定义字段
        if (value === 'custom') {
            customFields.style.display = 'block';
        } else {
            customFields.style.display = 'none';
        }
    }
    
    function getSelectedProvider() {
        return selectedProvider;
    }
    
    // ===== 加载配置到表单 =====
    
    function loadConfigToForm(provider) {
        const config = window.ToolsAPIConfig.getConfig(provider);
        
        if (config) {
            const info = window.ToolsAPIConfig.getProviderInfo(provider);
            selectOption(provider, info ? info.name : provider);
            apiKeyInput.value = config.apiKey;
            
            if (provider === 'custom') {
                customFields.style.display = 'block';
                customEndpoint.value = config.endpoint;
            }
            
            fetchedModels = config.models || [];
        }
    }
    
    // ===== 重置表单 =====
    
    function resetForm() {
        selectOption('', '-- 请选择提供商 --');
        apiKeyInput.value = '';
        customEndpoint.value = '';
        customFields.style.display = 'none';
        fetchedModels = [];
        modelFetchStatus.style.display = 'none';
    }
    
    // ===== 获取模型列表 =====
    
    async function fetchAndSaveModels(provider, apiKey, endpoint) {
        try {
            modelFetchStatus.style.display = 'flex';
            
            const models = await window.ToolsAPIConfig.fetchModels(provider, apiKey, endpoint);
            fetchedModels = models;
            
            modelFetchStatus.innerHTML = `
                <i class="ri-checkbox-circle-line"></i>
                <span>已获取 ${models.length} 个可用模型</span>
            `;
            
            setTimeout(() => {
                modelFetchStatus.style.display = 'none';
            }, 2000);
            
            return true;
        } catch (error) {
            modelFetchStatus.innerHTML = `
                <i class="ri-error-warning-line"></i>
                <span>获取模型失败: ${error.message}</span>
            `;
            
            setTimeout(() => {
                modelFetchStatus.style.display = 'none';
            }, 3000);
            
            return false;
        }
    }
    
    // ===== 事件处理 =====
    
    // 新增配置按钮
    if (addConfigBtn) {
        addConfigBtn.addEventListener('click', () => {
            showEditPage(null);
        });
    }
    
    // 返回按钮
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            showListPage();
        });
    }
    
    // 删除配置按钮（现在在编辑页也保留，用于快速删除）
    if (deleteConfigBtn) {
        deleteConfigBtn.addEventListener('click', () => {
            if (!currentEditProvider) return;
            
            const providerInfo = window.ToolsAPIConfig.getProviderInfo(currentEditProvider);
            const activeProvider = window.ToolsAPIConfig.getActiveProvider();
            
            if (!confirm(`确定要删除 ${providerInfo.name} 的配置吗？`)) {
                return;
            }
            
            const success = window.ToolsAPIConfig.deleteConfig(currentEditProvider);
            if (success) {
                // 如果删除的是当前使用的，清除当前使用标记
                if (currentEditProvider === activeProvider) {
                    window.ToolsAPIConfig.setActiveProvider('');
                }
                showMessage('配置已删除', 'success');
                showListPage();
                window.dispatchEvent(new CustomEvent('apiConfigUpdated'));
            } else {
                showMessage('删除失败，请重试', 'error');
            }
        });
    }
    
    // 保存配置按钮
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', async () => {
            const provider = getSelectedProvider();
            const apiKey = apiKeyInput.value.trim();
            
            if (!provider) {
                showMessage('请选择 API 提供商', 'warning');
                return;
            }
            
            if (!apiKey) {
                showMessage('请输入 API Key', 'warning');
                return;
            }
            
            let endpoint = '';
            
            if (provider === 'custom') {
                endpoint = customEndpoint.value.trim();
                if (!endpoint) {
                    showMessage('请输入自定义 API 端点', 'warning');
                    return;
                }
            }
            
            // 检查是否已存在该厂商配置（非编辑模式或编辑的不是同一个厂商）
            const existingConfig = window.ToolsAPIConfig.getConfig(provider);
            if (existingConfig && currentEditProvider !== provider) {
                const providerInfo = window.ToolsAPIConfig.getProviderInfo(provider);
                if (!confirm(`${providerInfo.name} 已配置，是否覆盖现有的 API Key？`)) {
                    return;
                }
            }
            
            // 获取模型列表
            const fetchSuccess = await fetchAndSaveModels(provider, apiKey, endpoint);
            
            if (!fetchSuccess && provider === 'custom') {
                // 自定义API如果获取失败，询问是否继续
                if (!confirm('获取模型列表失败，是否继续保存？（保存后该厂商将不可用）')) {
                    return;
                }
            }
            
            // 保存配置
            const success = window.ToolsAPIConfig.saveConfig(provider, apiKey, endpoint, fetchedModels);
            
            if (success) {
                showMessage('配置保存成功！', 'success');
                showListPage();
                window.dispatchEvent(new CustomEvent('apiConfigUpdated'));
            } else {
                showMessage('配置保存失败，请重试', 'error');
            }
        });
    }
    
    // 关闭按钮
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            closeModal();
        });
    }
    
    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // ===== 模态框控制 =====
    
    function openModal() {
        showListPage();
        modal.classList.add('is-visible');
    }
    
    function closeModal() {
        closeUISelect();
        modal.classList.remove('is-visible');
    }
    
    // 初始化
    if (providerSelect) {
        initUISelect();
    }
    
    // 暴露到全局
    window.openAPIConfig = openModal;
    
})();
