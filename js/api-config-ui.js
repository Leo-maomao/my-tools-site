// API 配置模态框交互逻辑
(function() {
    'use strict';
    
    // DOM 元素
    const apiConfigBtn = document.getElementById('apiConfigBtn');
    const apiConfigModal = document.getElementById('apiConfigModal');
    const apiConfigClose = document.getElementById('apiConfigClose');
    const apiConfigCancel = document.getElementById('apiConfigCancel');
    const apiConfigSave = document.getElementById('apiConfigSave');
    const apiConfigClear = document.getElementById('apiConfigClear');
    
    const apiEndpointInput = document.getElementById('apiEndpoint');
    const defaultModelSelect = document.getElementById('defaultModel');
    
    if (!apiConfigBtn || !apiConfigModal) return;
    
    // 打开配置模态框
    function openConfigModal() {
        // 加载当前配置
        const config = window.ToolsAPIConfig.get();
        apiEndpointInput.value = config.api_endpoint || '';
        defaultModelSelect.value = config.default_model || 'qwen-plus';
        
        apiConfigModal.classList.add('is-visible');
        setTimeout(() => apiEndpointInput.focus(), 100);
    }
    
    // 关闭配置模态框
    function closeConfigModal() {
        apiConfigModal.classList.remove('is-visible');
    }
    
    // 保存配置
    function saveConfig() {
        const endpoint = apiEndpointInput.value.trim();
        
        if (!endpoint) {
            alert('请输入 API 端点地址');
            return;
        }
        
        const config = window.ToolsAPIConfig.get();
        config.api_endpoint = endpoint;
        config.default_model = defaultModelSelect.value;
        
        if (window.ToolsAPIConfig.save(config)) {
            alert('配置已保存');
            closeConfigModal();
            
            // 触发配置更新事件
            window.dispatchEvent(new CustomEvent('apiConfigUpdated', { detail: config }));
        } else {
            alert('保存失败，请重试');
        }
    }
    
    // 清除配置
    function clearConfig() {
        if (confirm('确定要清除所有配置吗？此操作不可恢复。')) {
            window.ToolsAPIConfig.clear();
            apiEndpointInput.value = '';
            defaultModelSelect.value = 'qwen-plus';
            alert('配置已清除');
            closeConfigModal();
            
            // 触发配置清除事件
            window.dispatchEvent(new Event('apiConfigCleared'));
        }
    }
    
    // 事件绑定
    if (apiConfigBtn) apiConfigBtn.addEventListener('click', openConfigModal);
    if (apiConfigClose) apiConfigClose.addEventListener('click', closeConfigModal);
    if (apiConfigCancel) apiConfigCancel.addEventListener('click', closeConfigModal);
    if (apiConfigSave) apiConfigSave.addEventListener('click', saveConfig);
    if (apiConfigClear) apiConfigClear.addEventListener('click', clearConfig);
    
    // Enter 键保存
    if (apiEndpointInput) {
        apiEndpointInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') saveConfig();
        });
    }
    
    // 暴露到全局（供其他页面使用）
    window.openAPIConfig = openConfigModal;
    
})();

