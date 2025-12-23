// API 配置管理模块
(function() {
    'use strict';
    
    const CONFIG_KEY = 'tools_api_config';
    const GUIDE_KEY = 'tools_guide_status';
    
    // 默认配置
    const DEFAULT_CONFIG = {
        api_endpoint: '',
        default_model: 'qwen-plus',
        models: [
            { id: 'qwen-plus', name: '通义千问 Plus', provider: '阿里云' },
            { id: 'qwen-turbo', name: '通义千问 Turbo', provider: '阿里云' },
            { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
            { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' }
        ]
    };
    
    // API 配置管理
    const APIConfig = {
        // 获取配置
        get: function() {
            try {
                const config = localStorage.getItem(CONFIG_KEY);
                return config ? JSON.parse(config) : DEFAULT_CONFIG;
            } catch (e) {
                console.error('读取配置失败:', e);
                return DEFAULT_CONFIG;
            }
        },
        
        // 保存配置
        save: function(config) {
            try {
                localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
                return true;
            } catch (e) {
                console.error('保存配置失败:', e);
                return false;
            }
        },
        
        // 清除配置
        clear: function() {
            localStorage.removeItem(CONFIG_KEY);
        },
        
        // 检查是否已配置
        isConfigured: function() {
            const config = this.get();
            return !!config.api_endpoint;
        },
        
        // 获取模型列表
        getModels: function() {
            return this.get().models || [];
        },
        
        // 获取默认模型
        getDefaultModel: function() {
            return this.get().default_model || 'qwen-plus';
        }
    };
    
    // 新手引导管理
    const GuideManager = {
        // 获取引导状态
        getStatus: function(toolId) {
            try {
                const status = localStorage.getItem(GUIDE_KEY);
                const guides = status ? JSON.parse(status) : {};
                return guides[toolId] || { shown: false, dontShowAgain: false };
            } catch (e) {
                return { shown: false, dontShowAgain: false };
            }
        },
        
        // 保存引导状态
        saveStatus: function(toolId, shown, dontShowAgain) {
            try {
                const status = localStorage.getItem(GUIDE_KEY);
                const guides = status ? JSON.parse(status) : {};
                guides[toolId] = { shown: shown, dontShowAgain: dontShowAgain };
                localStorage.setItem(GUIDE_KEY, JSON.stringify(guides));
            } catch (e) {
                console.error('保存引导状态失败:', e);
            }
        },
        
        // 检查是否需要显示引导
        shouldShow: function(toolId) {
            const status = this.getStatus(toolId);
            return !status.shown || !status.dontShowAgain;
        },
        
        // 重置引导（用于"重新查看"功能）
        reset: function(toolId) {
            this.saveStatus(toolId, false, false);
        }
    };
    
    // 暴露到全局
    window.ToolsAPIConfig = APIConfig;
    window.ToolsGuideManager = GuideManager;
    
})();

