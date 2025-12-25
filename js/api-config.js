// API 配置管理模块 - 多厂商版本
(function() {
    'use strict';
    
    const CONFIG_KEY = 'tools_api_configs'; // 存储所有配置
    const ACTIVE_PROVIDER_KEY = 'tools_active_provider'; // 存储当前使用的厂商
    
    // 图标 CDN 基础路径
    const ICON_CDN = 'https://unpkg.com/@lobehub/icons-static-png@latest/light';
    
    // 支持的提供商列表
    const PROVIDERS = {
        openai: { name: 'OpenAI (GPT)', icon: `${ICON_CDN}/openai.png`, endpoint: 'https://api.openai.com/v1' },
        qwen: { name: '阿里云通义千问', icon: `${ICON_CDN}/qwen.png`, endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
        bailian: { name: '阿里云百炼', icon: `${ICON_CDN}/bailian.png`, endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
        claude: { name: 'Anthropic Claude', icon: `${ICON_CDN}/anthropic.png`, endpoint: 'https://api.anthropic.com/v1' },
        deepseek: { name: 'DeepSeek', icon: `${ICON_CDN}/deepseek-color.png`, endpoint: 'https://api.deepseek.com/v1' },
        moonshot: { name: '月之暗面 Kimi', icon: `${ICON_CDN}/moonshot.png`, endpoint: 'https://api.moonshot.cn/v1' },
        zhipu: { name: '智谱 GLM', icon: `${ICON_CDN}/zhipu-color.png`, endpoint: 'https://open.bigmodel.cn/api/paas/v4' },
        minimax: { name: 'MiniMax', icon: `${ICON_CDN}/minimax-color.png`, endpoint: 'https://api.minimax.chat/v1' },
        baichuan: { name: '百川智能', icon: `${ICON_CDN}/baichuan-color.png`, endpoint: 'https://api.baichuan-ai.com/v1' },
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
    
    // 保存单个厂商配置（旧版，兼容）
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
    
    // 保存完整提供商配置（新版）
    function saveProviderConfig(provider, configData) {
        const configs = loadAllConfigs();
        
        configs[provider] = {
            ...configData,
            provider: provider,
            providerName: PROVIDERS[provider]?.name || provider,
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
    
    // 模型缓存（避免重复请求）
    const modelsCache = {};
    const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
    
    // 获取模型列表（调用API）
    async function fetchModels(provider, apiKey, endpoint, forceRefresh = false) {
        // 检查缓存
        const cacheKey = `${provider}_${apiKey.substring(0, 8)}`;
        if (!forceRefresh && modelsCache[cacheKey]) {
            const cached = modelsCache[cacheKey];
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return cached.models;
            }
        }
        
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
                case 'qwen':
                case 'bailian':
                    // 这些厂商支持 OpenAI 兼容的 /models 接口
                    url = `${apiEndpoint}/models`;
                    headers = {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    };
                    break;
                    
                case 'claude':
                    // Anthropic Claude 使用固定模型列表（不支持 /models 接口）
                    return [
                        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
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
                    // 过滤出文本生成模型（排除 embedding、audio 等）
                    const textModels = data.data.filter(model => {
                        const id = model.id.toLowerCase();
                        // 排除非文本生成模型
                        if (id.includes('embedding') || 
                            id.includes('audio') || 
                            id.includes('tts') || 
                            id.includes('whisper') ||
                            id.includes('dall-e') ||
                            id.includes('image') ||
                            id.includes('vision') ||
                            id.includes('moderation')) {
                            return false;
                        }
                        return true;
                    });
                    
                    const models = textModels.map(model => ({
                        id: model.id,
                        name: formatModelName(model.id)
                    }));
                    
                    // 缓存结果
                    modelsCache[cacheKey] = {
                        models: models,
                        timestamp: Date.now()
                    };
                    
                    return models;
                }
                
                throw new Error('无法解析模型列表');
            }
            
        } catch (error) {
            console.error('获取模型列表失败:', error);
            throw error;
        }
    }

    // 获取图片生成模型列表
    async function fetchImageModels(provider, apiKey, endpoint, forceRefresh = false) {
        // 检查缓存
        const cacheKey = `${provider}_image_${apiKey.substring(0, 8)}`;
        if (!forceRefresh && modelsCache[cacheKey]) {
            const cached = modelsCache[cacheKey];
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return cached.models;
            }
        }

        try {
            const providerInfo = PROVIDERS[provider];
            if (!providerInfo) {
                throw new Error('不支持的提供商');
            }

            const apiEndpoint = endpoint || providerInfo.endpoint;

            // 不同厂商的图片生成模型
            switch (provider) {
                case 'openai':
                    // OpenAI DALL-E
                    return [
                        { id: 'dall-e-3', name: 'DALL-E 3' },
                        { id: 'dall-e-2', name: 'DALL-E 2' }
                    ];

                case 'bailian':
                case 'qwen':
                    // 阿里百炼 - 通义万相
                    return [
                        { id: 'wanx-v1', name: '通义万相 v1' },
                        { id: 'wanx-sketch-to-image-v1', name: '通义万相 草图生图' },
                        { id: 'wanx-background-generation-v2', name: '通义万相 背景生成' }
                    ];

                case 'zhipu':
                    // 智谱 CogView
                    return [
                        { id: 'cogview-3', name: 'CogView-3' },
                        { id: 'cogview-3-plus', name: 'CogView-3 Plus' }
                    ];

                case 'custom':
                    // 自定义API：尝试从 /models 接口获取图片模型
                    try {
                        const url = `${apiEndpoint}/models`;
                        const headers = {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        };

                        const response = await fetch(url, { headers });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.data && Array.isArray(data.data)) {
                                // 只保留图片生成模型
                                const imageModels = data.data.filter(model => {
                                    const id = model.id.toLowerCase();
                                    return id.includes('dall-e') ||
                                           id.includes('image') ||
                                           id.includes('wanx') ||
                                           id.includes('cogview') ||
                                           id.includes('stable-diffusion') ||
                                           id.includes('midjourney');
                                });

                                const models = imageModels.map(model => ({
                                    id: model.id,
                                    name: formatModelName(model.id)
                                }));

                                // 缓存结果
                                modelsCache[cacheKey] = {
                                    models: models,
                                    timestamp: Date.now()
                                };

                                return models;
                            }
                        }
                    } catch (e) {
                        console.warn('自定义API获取图片模型失败，返回空列表');
                    }
                    return [];

                default:
                    // 其他厂商暂不支持图片生成
                    return [];
            }

        } catch (error) {
            console.error('获取图片模型列表失败:', error);
            throw error;
        }
    }

    // 获取视频生成模型列表
    async function fetchVideoModels(provider, apiKey, endpoint, forceRefresh = false) {
        // 检查缓存
        const cacheKey = `${provider}_video_${apiKey.substring(0, 8)}`;
        if (!forceRefresh && modelsCache[cacheKey]) {
            const cached = modelsCache[cacheKey];
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return cached.models;
            }
        }

        try {
            const providerInfo = PROVIDERS[provider];
            if (!providerInfo) {
                throw new Error('不支持的提供商');
            }

            const apiEndpoint = endpoint || providerInfo.endpoint;

            // 不同厂商的视频生成模型
            switch (provider) {
                case 'bailian':
                case 'qwen':
                    // 阿里百炼 - 通义万相视频
                    return [
                        { id: 'wanx-video-v1', name: '通义万相视频 v1' },
                        { id: 'wanx-animation-v1', name: '通义万相动画 v1' }
                    ];

                case 'zhipu':
                    // 智谱 CogVideo
                    return [
                        { id: 'cogvideo-v1', name: 'CogVideo v1' }
                    ];

                case 'openai':
                    // OpenAI 暂不支持视频生成
                    return [];

                case 'custom':
                    // 自定义API：尝试从 /models 接口获取视频模型
                    try {
                        const url = `${apiEndpoint}/models`;
                        const headers = {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        };

                        const response = await fetch(url, { headers });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.data && Array.isArray(data.data)) {
                                // 只保留视频生成模型
                                const videoModels = data.data.filter(model => {
                                    const id = model.id.toLowerCase();
                                    return id.includes('video') ||
                                           id.includes('animation') ||
                                           id.includes('cogvideo') ||
                                           id.includes('runway') ||
                                           id.includes('pika');
                                });

                                const models = videoModels.map(model => ({
                                    id: model.id,
                                    name: formatModelName(model.id)
                                }));

                                // 缓存结果
                                modelsCache[cacheKey] = {
                                    models: models,
                                    timestamp: Date.now()
                                };

                                return models;
                            }
                        }
                    } catch (e) {
                        console.warn('自定义API获取视频模型失败，返回空列表');
                    }
                    return [];

                default:
                    // 其他厂商暂不支持视频生成
                    return [];
            }

        } catch (error) {
            console.error('获取视频模型列表失败:', error);
            throw error;
        }
    }

    // 格式化模型名称，使其更易读
    function formatModelName(modelId) {
        // 常见模型名称映射
        const nameMap = {
            'gpt-4o': 'GPT-4o',
            'gpt-4o-mini': 'GPT-4o Mini',
            'gpt-4-turbo': 'GPT-4 Turbo',
            'gpt-4': 'GPT-4',
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'qwen-plus': '通义千问 Plus',
            'qwen-turbo': '通义千问 Turbo',
            'qwen-max': '通义千问 Max',
            'qwen-long': '通义千问 Long',
            'qwen-vl-plus': '通义千问 VL Plus',
            'qwen-vl-max': '通义千问 VL Max',
            'deepseek-chat': 'DeepSeek Chat',
            'deepseek-coder': 'DeepSeek Coder',
            'deepseek-v3': 'DeepSeek V3',
            'deepseek-r1': 'DeepSeek R1',
            'moonshot-v1-8k': 'Moonshot 8K',
            'moonshot-v1-32k': 'Moonshot 32K',
            'moonshot-v1-128k': 'Moonshot 128K'
        };
        
        if (nameMap[modelId]) {
            return nameMap[modelId];
        }
        
        // 简单格式化：将连字符替换为空格，首字母大写
        return modelId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    // 暴露到全局
    window.ToolsAPIConfig = {
        loadAllConfigs,
        getConfig,
        saveConfig,
        saveProviderConfig,
        deleteConfig,
        getConfiguredProviders,
        getAllAvailableModels,
        getProviderInfo,
        getAllProviders,
        isConfigured,
        fetchModels,
        fetchImageModels,
        fetchVideoModels,
        setActiveProvider,
        getActiveProvider,
        getActiveConfig
    };
    
})();
