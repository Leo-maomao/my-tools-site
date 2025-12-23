// API 配置管理模块 - 多厂商版本
(function() {
    'use strict';
    
    const CONFIG_KEY = 'tools_api_configs'; // 存储所有配置
    const ACTIVE_PROVIDER_KEY = 'tools_active_provider'; // 存储当前使用的厂商
    
    // 支持的提供商列表
    const PROVIDERS = {
        openai: { name: 'OpenAI (GPT)', icon: '🤖', endpoint: 'https://api.openai.com/v1' },
        qwen: { name: '阿里云通义千问', icon: '☁️', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
        claude: { name: 'Anthropic Claude', icon: '🧠', endpoint: 'https://api.anthropic.com/v1' },
        deepseek: { name: 'DeepSeek', icon: '🔍', endpoint: 'https://api.deepseek.com/v1' },
        moonshot: { name: '月之暗面 Kimi', icon: '🌙', endpoint: 'https://api.moonshot.cn/v1' },
        zhipu: { name: '智谱 GLM', icon: '💡', endpoint: 'https://open.bigmodel.cn/api/paas/v4' },
        minimax: { name: 'MiniMax', icon: '⚡', endpoint: 'https://api.minimax.chat/v1' },
        baichuan: { name: '百川智能', icon: '🏔️', endpoint: 'https://api.baichuan-ai.com/v1' },
        custom: { name: '自定义 API', icon: '🔧', endpoint: '' }
    };
    
    // 加载所有配置
    function loadAllConfigs() {
        try {
            const data = localStorage.getItem(CONFIG_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('加载配置失败:', e);
            return {};
        }
    }
    
    // 保存所有配置
    function saveAllConfigs(configs) {
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(configs));
            return true;
        } catch (e) {
            console.error('保存配置失败:', e);
            return false;
        }
    }
    
    // 获取单个厂商配置
    function getConfig(provider) {
        const configs = loadAllConfigs();
        return configs[provider] || null;
    }
    
    // 保存单个厂商配置
    function saveConfig(provider, apiKey, endpoint, models) {
        const configs = loadAllConfigs();
        
        configs[provider] = {
            provider: provider,
            providerName: PROVIDERS[provider]?.name || provider,
            apiKey: apiKey,
            endpoint: endpoint || PROVIDERS[provider]?.endpoint || '',
            models: models || [],
            configuredAt: new Date().toISOString()
        };
        
        return saveAllConfigs(configs);
    }
    
    // 删除单个厂商配置
    function deleteConfig(provider) {
        const configs = loadAllConfigs();
        delete configs[provider];
        return saveAllConfigs(configs);
    }
    
    // 获取所有已配置的厂商
    function getConfiguredProviders() {
        const configs = loadAllConfigs();
        return Object.keys(configs);
    }
    
    // 获取所有可用模型（从所有已配置的厂商）
    function getAllAvailableModels() {
        const configs = loadAllConfigs();
        const models = [];
        
        for (const [provider, config] of Object.entries(configs)) {
            if (config.models && config.models.length > 0) {
                config.models.forEach(model => {
                    models.push({
                        provider: provider,
                        providerName: config.providerName,
                        modelId: model.id || model,
                        modelName: model.name || model,
                        displayName: `${model.name || model} (${config.providerName})`
                    });
                });
            }
        }
        
        return models;
    }
    
    // 获取提供商信息
    function getProviderInfo(provider) {
        return PROVIDERS[provider] || null;
    }
    
    // 获取所有提供商列表
    function getAllProviders() {
        return PROVIDERS;
    }
    
    // 检查厂商是否已配置
    function isConfigured(provider) {
        const configs = loadAllConfigs();
        return !!configs[provider];
    }
    
    // 设置当前使用的厂商
    function setActiveProvider(provider) {
        try {
            localStorage.setItem(ACTIVE_PROVIDER_KEY, provider);
            return true;
        } catch (e) {
            console.error('设置当前厂商失败:', e);
            return false;
        }
    }
    
    // 获取当前使用的厂商
    function getActiveProvider() {
        try {
            return localStorage.getItem(ACTIVE_PROVIDER_KEY) || null;
        } catch (e) {
            console.error('获取当前厂商失败:', e);
            return null;
        }
    }
    
    // 获取当前使用的配置
    function getActiveConfig() {
        const activeProvider = getActiveProvider();
        if (!activeProvider) return null;
        return getConfig(activeProvider);
    }
    
    // 获取模型列表（调用API）
    async function fetchModels(provider, apiKey, endpoint) {
        try {
            const providerInfo = PROVIDERS[provider];
            if (!providerInfo) {
                throw new Error('不支持的提供商');
            }
            
            const apiEndpoint = endpoint || providerInfo.endpoint;
            
            // 不同厂商的模型列表接口
            let url = '';
            let headers = {};
            
            switch (provider) {
                case 'openai':
                case 'deepseek':
                case 'moonshot':
                    url = `${apiEndpoint}/models`;
                    headers = {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    };
                    break;
                    
                case 'qwen':
                    // 通义千问使用固定模型列表
                    return [
                        { id: 'qwen-plus', name: '通义千问 Plus' },
                        { id: 'qwen-turbo', name: '通义千问 Turbo' },
                        { id: 'qwen-max', name: '通义千问 Max' }
                    ];
                    
                case 'claude':
                    // Anthropic Claude 使用固定模型列表
                    return [
                        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
                        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
                        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
                    ];
                    
                case 'zhipu':
                    // 智谱 GLM 使用固定模型列表
                    return [
                        { id: 'glm-4', name: 'GLM-4' },
                        { id: 'glm-4v', name: 'GLM-4V' },
                        { id: 'glm-3-turbo', name: 'GLM-3-Turbo' }
                    ];
                    
                case 'minimax':
                    // MiniMax 使用固定模型列表
                    return [
                        { id: 'abab6-chat', name: 'MiniMax-6' },
                        { id: 'abab5.5-chat', name: 'MiniMax-5.5' }
                    ];
                    
                case 'baichuan':
                    // 百川智能使用固定模型列表
                    return [
                        { id: 'Baichuan2-Turbo', name: 'Baichuan2 Turbo' },
                        { id: 'Baichuan2-Turbo-192k', name: 'Baichuan2 Turbo 192K' }
                    ];
                    
                case 'custom':
                    // 自定义API尝试调用 /models 接口
                    url = `${apiEndpoint}/models`;
                    headers = {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    };
                    break;
                    
                default:
                    throw new Error('不支持的提供商');
            }
            
            if (url) {
                const response = await fetch(url, { headers });
                if (!response.ok) {
                    throw new Error(`API 请求失败: ${response.status}`);
                }
                
                const data = await response.json();
                
                // 解析响应，提取模型列表
                if (data.data && Array.isArray(data.data)) {
                    return data.data.map(model => ({
                        id: model.id,
                        name: model.id
                    }));
                }
                
                throw new Error('无法解析模型列表');
            }
            
        } catch (error) {
            console.error('获取模型列表失败:', error);
            throw error;
        }
    }
    
    // 暴露到全局
    window.ToolsAPIConfig = {
        loadAllConfigs,
        getConfig,
        saveConfig,
        deleteConfig,
        getConfiguredProviders,
        getAllAvailableModels,
        getProviderInfo,
        getAllProviders,
        isConfigured,
        fetchModels,
        setActiveProvider,
        getActiveProvider,
        getActiveConfig
    };
    
})();
