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
                case 'qwen':
                case 'bailian':
                    // 阿里云百炼 - 使用代理避免 CORS
                    url = '/api/bailian/models';
                    headers = {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    };
                    break;
                    
                case 'openai':
                    // OpenAI - 使用代理避免 CORS
                    url = '/api/openai/models';
                    headers = {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    };
                    break;
                    
                case 'deepseek':
                case 'moonshot':
                    // 其他厂商 - 直接调用（可能有 CORS 问题）
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
                case 'openai': {
                    // OpenAI - 使用 API 获取模型列表并与预定义合并
                    const predefinedOpenAIImage = [
                        { id: 'dall-e-3', name: 'DALL-E 3' },
                        { id: 'dall-e-2', name: 'DALL-E 2' },
                        { id: 'gpt-image-1', name: 'GPT Image 1' }
                    ];
                    
                    try {
                        const url = '/api/openai/models';
                        const headers = {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        };
                        const response = await fetch(url, { headers });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.data && Array.isArray(data.data)) {
                                const apiModels = data.data.filter(m => {
                                    const id = (m.id || '').toLowerCase();
                                    return id.includes('dall-e') || id.includes('image');
                                }).map(m => ({ id: m.id, name: m.id, fromApi: true }));
                                
                                const existingIds = new Set(apiModels.map(m => m.id));
                                const merged = [...apiModels, ...predefinedOpenAIImage.filter(m => !existingIds.has(m.id))];
                                console.log('OpenAI图片模型（合并后）:', merged.length, '个');
                                modelsCache[cacheKey] = { models: merged, timestamp: Date.now() };
                                return merged;
                            }
                        }
                    } catch (e) {
                        console.warn('从OpenAI API获取模型失败:', e);
                    }
                    modelsCache[cacheKey] = { models: predefinedOpenAIImage, timestamp: Date.now() };
                    return predefinedOpenAIImage;
                }

                case 'bailian':
                case 'qwen': {
                    // 阿里百炼 - 使用 OpenAI 兼容模式接口获取模型列表
                    // 并与预定义常用模型合并
                    
                    // 预定义的常用图片生成模型
                    const predefinedImageModels = [
                        { id: 'wanx-v1', name: '通义万相 v1' },
                        { id: 'wanx2.0-t2i-turbo', name: '通义万相2.0 文生图Turbo' },
                        { id: 'wanx2.1-t2i-turbo', name: '通义万相2.1 文生图Turbo' },
                        { id: 'wanx2.1-t2i-plus', name: '通义万相2.1 文生图Plus' },
                        { id: 'flux-schnell', name: 'FLUX Schnell' },
                        { id: 'flux-dev', name: 'FLUX Dev' },
                        { id: 'stable-diffusion-3.5-large', name: 'SD 3.5 Large' },
                        { id: 'stable-diffusion-xl', name: 'SDXL' },
                        { id: 'wanx-style-cosplay-v1', name: '通义万相 Cosplay人物' },
                        { id: 'wanx-style-repaint-v1', name: '通义万相 人像风格重绘' }
                    ];
                    
                    try {
                        const url = '/api/bailian/models';
                        const headers = {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        };

                        const response = await fetch(url, { headers });
                        if (response.ok) {
                            const data = await response.json();
                            
                            if (data.data && Array.isArray(data.data)) {
                                // 从 API 返回中筛选图片相关模型
                                const apiImageModels = data.data.filter(model => {
                                    const modelId = (model.id || '').toLowerCase();
                                    // 包含图片相关关键词
                                    const isImageRelated = modelId.includes('image') ||
                                           modelId.includes('wanx') ||
                                           modelId.includes('flux') ||
                                           modelId.includes('stable') ||
                                           modelId.includes('cogview');
                                    // 排除视频模型和纯编辑模型
                                    const isVideoModel = modelId.includes('i2v') || 
                                           modelId.includes('video') || 
                                           modelId.includes('t2v') ||
                                           modelId.includes('v2v');
                                    return isImageRelated && !isVideoModel;
                                }).map(model => ({
                                    id: model.id,
                                    name: model.id,
                                    fromApi: true
                                }));
                                
                                // 合并：API 模型优先，然后是预定义模型（去重）
                                const existingIds = new Set(apiImageModels.map(m => m.id));
                                const mergedModels = [
                                    ...apiImageModels,
                                    ...predefinedImageModels.filter(m => !existingIds.has(m.id))
                                ];
                                
                                console.log('百炼图片模型（合并后）:', mergedModels.length, '个');
                                
                                // 缓存结果
                                modelsCache[cacheKey] = {
                                    models: mergedModels,
                                    timestamp: Date.now()
                                };
                                return mergedModels;
                            }
                        }
                    } catch (e) {
                        console.warn('从百炼API获取模型失败，使用预定义列表:', e);
                    }
                    
                    // 备用：返回预定义模型列表
                    modelsCache[cacheKey] = { models: predefinedImageModels, timestamp: Date.now() };
                    return predefinedImageModels;
                }

                case 'zhipu': {
                    // 智谱 - 使用 API 获取模型列表并与预定义合并
                    const predefinedZhipuImage = [
                        { id: 'cogview-3', name: 'CogView-3' },
                        { id: 'cogview-3-plus', name: 'CogView-3 Plus' },
                        { id: 'cogview-4', name: 'CogView-4' }
                    ];
                    
                    try {
                        const url = '/api/zhipu/models';
                        const headers = {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        };
                        const response = await fetch(url, { headers });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.data && Array.isArray(data.data)) {
                                const apiModels = data.data.filter(m => {
                                    const id = (m.id || '').toLowerCase();
                                    return id.includes('cogview') || id.includes('image');
                                }).map(m => ({ id: m.id, name: m.id, fromApi: true }));
                                
                                const existingIds = new Set(apiModels.map(m => m.id));
                                const merged = [...apiModels, ...predefinedZhipuImage.filter(m => !existingIds.has(m.id))];
                                console.log('智谱图片模型（合并后）:', merged.length, '个');
                                modelsCache[cacheKey] = { models: merged, timestamp: Date.now() };
                                return merged;
                            }
                        }
                    } catch (e) {
                        console.warn('从智谱API获取模型失败:', e);
                    }
                    modelsCache[cacheKey] = { models: predefinedZhipuImage, timestamp: Date.now() };
                    return predefinedZhipuImage;
                }

                case 'custom': {
                    // 自定义API：从 /models 接口获取图片模型
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
                                // 筛选图片生成模型
                                const imageModels = data.data.filter(model => {
                                    const id = (model.id || '').toLowerCase();
                                    const isImage = id.includes('dall-e') ||
                                           id.includes('image') ||
                                           id.includes('wanx') ||
                                           id.includes('cogview') ||
                                           id.includes('flux') ||
                                           id.includes('stable-diffusion') ||
                                           id.includes('midjourney');
                                    const isVideo = id.includes('video') || id.includes('i2v') || id.includes('t2v');
                                    return isImage && !isVideo;
                                }).map(model => ({
                                    id: model.id,
                                    name: model.id,
                                    fromApi: true
                                }));

                                console.log('自定义API图片模型:', imageModels.length, '个');
                                modelsCache[cacheKey] = { models: imageModels, timestamp: Date.now() };
                                return imageModels;
                            }
                        }
                    } catch (e) {
                        console.warn('自定义API获取图片模型失败:', e);
                    }
                    return [];
                }

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
                case 'qwen': {
                    // 阿里百炼 - 使用 OpenAI 兼容模式接口获取视频模型列表
                    // 并与预定义常用模型合并
                    
                    // 预定义的常用视频生成模型
                    const predefinedVideoModels = [
                        { id: 'wanx2.1-i2v-turbo', name: '通义万相2.1 图生视频Turbo' },
                        { id: 'wanx2.1-i2v-plus', name: '通义万相2.1 图生视频Plus' },
                        { id: 'wanx-i2v-01', name: '通义万相 图生视频v1' },
                        { id: 'wanx2.1-t2v-turbo', name: '通义万相2.1 文生视频Turbo' },
                        { id: 'wanx2.1-t2v-plus', name: '通义万相2.1 文生视频Plus' }
                    ];
                    
                    try {
                        const url = '/api/bailian/models';
                        const headers = {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        };

                        const response = await fetch(url, { headers });
                        if (response.ok) {
                            const data = await response.json();
                            
                            if (data.data && Array.isArray(data.data)) {
                                // 从 API 返回中筛选视频相关模型
                                const apiVideoModels = data.data.filter(model => {
                                    const modelId = (model.id || '').toLowerCase();
                                    // 包含视频相关关键词
                                    return modelId.includes('i2v') || 
                                           modelId.includes('video') || 
                                           modelId.includes('t2v') ||
                                           modelId.includes('v2v') ||
                                           modelId.includes('animation');
                                }).map(model => ({
                                    id: model.id,
                                    name: model.id,
                                    fromApi: true
                                }));
                                
                                // 合并：API 模型优先，然后是预定义模型（去重）
                                const existingIds = new Set(apiVideoModels.map(m => m.id));
                                const mergedModels = [
                                    ...apiVideoModels,
                                    ...predefinedVideoModels.filter(m => !existingIds.has(m.id))
                                ];
                                
                                console.log('百炼视频模型（合并后）:', mergedModels.length, '个');
                                
                                // 缓存结果
                                modelsCache[cacheKey] = {
                                    models: mergedModels,
                                    timestamp: Date.now()
                                };
                                return mergedModels;
                            }
                        }
                    } catch (e) {
                        console.warn('从百炼API获取视频模型失败，使用预定义列表:', e);
                    }
                    
                    // 备用：返回预定义模型列表
                    modelsCache[cacheKey] = { models: predefinedVideoModels, timestamp: Date.now() };
                    return predefinedVideoModels;
                }

                case 'zhipu': {
                    // 智谱 - 使用 API 获取视频模型列表并与预定义合并
                    const predefinedZhipuVideo = [
                        { id: 'cogvideox', name: 'CogVideoX' },
                        { id: 'cogvideox-flash', name: 'CogVideoX Flash' }
                    ];
                    
                    try {
                        const url = '/api/zhipu/models';
                        const headers = {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        };
                        const response = await fetch(url, { headers });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.data && Array.isArray(data.data)) {
                                const apiModels = data.data.filter(m => {
                                    const id = (m.id || '').toLowerCase();
                                    return id.includes('video') || id.includes('cogvideo');
                                }).map(m => ({ id: m.id, name: m.id, fromApi: true }));
                                
                                const existingIds = new Set(apiModels.map(m => m.id));
                                const merged = [...apiModels, ...predefinedZhipuVideo.filter(m => !existingIds.has(m.id))];
                                console.log('智谱视频模型（合并后）:', merged.length, '个');
                                modelsCache[cacheKey] = { models: merged, timestamp: Date.now() };
                                return merged;
                            }
                        }
                    } catch (e) {
                        console.warn('从智谱API获取视频模型失败:', e);
                    }
                    modelsCache[cacheKey] = { models: predefinedZhipuVideo, timestamp: Date.now() };
                    return predefinedZhipuVideo;
                }

                case 'openai': {
                    // OpenAI - 使用 API 获取视频模型（如 Sora）
                    const predefinedOpenAIVideo = [
                        { id: 'sora', name: 'Sora' }
                    ];
                    
                    try {
                        const url = '/api/openai/models';
                        const headers = {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        };
                        const response = await fetch(url, { headers });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.data && Array.isArray(data.data)) {
                                const apiModels = data.data.filter(m => {
                                    const id = (m.id || '').toLowerCase();
                                    return id.includes('video') || id.includes('sora');
                                }).map(m => ({ id: m.id, name: m.id, fromApi: true }));
                                
                                if (apiModels.length > 0) {
                                    const existingIds = new Set(apiModels.map(m => m.id));
                                    const merged = [...apiModels, ...predefinedOpenAIVideo.filter(m => !existingIds.has(m.id))];
                                    console.log('OpenAI视频模型（合并后）:', merged.length, '个');
                                    modelsCache[cacheKey] = { models: merged, timestamp: Date.now() };
                                    return merged;
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('从OpenAI API获取视频模型失败:', e);
                    }
                    // OpenAI 视频模型可能未开放，返回空或预定义
                    return [];
                }

                case 'custom': {
                    // 自定义API：从 /models 接口获取视频模型
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
                                // 筛选视频生成模型
                                const videoModels = data.data.filter(model => {
                                    const id = (model.id || '').toLowerCase();
                                    return id.includes('video') ||
                                           id.includes('i2v') ||
                                           id.includes('t2v') ||
                                           id.includes('v2v') ||
                                           id.includes('animation') ||
                                           id.includes('cogvideo') ||
                                           id.includes('sora') ||
                                           id.includes('runway') ||
                                           id.includes('pika');
                                }).map(model => ({
                                    id: model.id,
                                    name: model.id,
                                    fromApi: true
                                }));

                                console.log('自定义API视频模型:', videoModels.length, '个');
                                modelsCache[cacheKey] = { models: videoModels, timestamp: Date.now() };
                                return videoModels;
                            }
                        }
                    } catch (e) {
                        console.warn('自定义API获取视频模型失败:', e);
                    }
                    return [];
                }

                default:
                    // 其他厂商暂不支持视频生成
                    return [];
            }

        } catch (error) {
            console.error('获取视频模型列表失败:', error);
            throw error;
        }
    }

    // ============ 图片上传到 Supabase Storage ============
    async function uploadImageToStorage(base64Image) {
        // 获取 Supabase 客户端
        const supabase = window.toolsSupabase;
        if (!supabase) {
            throw new Error('Supabase 未初始化，无法上传图片');
        }

        try {
            // 将 base64 转换为 Blob
            const base64Data = base64Image.split(',')[1];
            const mimeType = base64Image.match(/data:([^;]+);/)?.[1] || 'image/png';
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });

            // 生成唯一文件名
            const ext = mimeType.split('/')[1] || 'png';
            const fileName = `character-ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

            // 上传到 Supabase Storage (chat-images bucket)
            console.log('正在上传图片到 Supabase Storage...');
            const { data, error } = await supabase.storage
                .from('chat-images')
                .upload(fileName, blob, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                throw error;
            }

            // 获取公网 URL
            const { data: urlData } = supabase.storage
                .from('chat-images')
                .getPublicUrl(fileName);

            console.log('图片上传成功，公网URL:', urlData.publicUrl);
            return urlData.publicUrl;
        } catch (error) {
            console.error('图片上传失败:', error);
            throw new Error(`图片上传失败: ${error.message}`);
        }
    }

    // ============ 角色参考图片生成（人物一致性）============
    // 判断是否是图像编辑模型（通过关键词匹配）
    function isImageEditModelByName(modelId) {
        const id = (modelId || '').toLowerCase();
        // 包含这些关键词的是图像编辑模型
        return id.includes('imageedit') ||      // wanx2.1-imageedit, qwen-image-edit-plus
               id.includes('image-edit') ||     // qwen-image-edit-plus
               id.includes('repaint') ||        // wanx-style-repaint-v1
               id.includes('cosplay') ||        // wanx-style-cosplay-v1
               id.includes('i2i');              // image-to-image 模型
    }
    
    // 判断是否是纯文生图模型
    function isTextToImageModelByName(modelId) {
        const id = (modelId || '').toLowerCase();
        // 包含这些关键词的是纯文生图模型
        return id.includes('t2i') ||            // text-to-image
               id.includes('z-image') ||        // z-image-turbo
               id.includes('flux') ||           // flux-schnell, flux-dev
               id.includes('stable-diffusion') || // stable-diffusion
               id.includes('cogview') ||        // cogview
               id.includes('dall-e');           // dall-e
    }

    async function generateImageWithCharacterRef(apiKey, prompt, refImages, size, n, originalModel) {
        // 获取第一个角色的参考图片
        const refImage = refImages[0];
        
        // 构建包含角色名的增强提示词
        const characterNames = refImages.map(r => r.name).join('、');
        const enhancedPrompt = `${prompt}，主角是${characterNames}`;
        console.log('使用角色增强提示词，角色:', characterNames);
        console.log('使用模型:', originalModel);

        // 检查图片格式
        const hasValidImage = refImage && refImage.image;
        let isBase64 = hasValidImage && refImage.image.startsWith('data:');
        let isUrl = hasValidImage && (refImage.image.startsWith('http://') || refImage.image.startsWith('https://'));
        let imageUrl = isUrl ? refImage.image : null;

        // 判断模型类型（使用关键词匹配）
        const isImageEditModel = isImageEditModelByName(originalModel);
        const isTextOnlyModel = isTextToImageModelByName(originalModel);
        
        console.log('模型类型判断:', { isImageEditModel, isTextOnlyModel, modelId: originalModel });
        
        if (isTextOnlyModel && !isImageEditModel) {
            console.log('模型是纯文生图模型，不支持图片输入，使用增强提示词生成');
        }

        // 只有图像编辑模型才尝试使用图片输入
        if (isImageEditModel && hasValidImage) {
            // 如果是 base64，先上传获取 URL
            if (isBase64 && !isUrl) {
                console.log('图像编辑模型需要图片URL，正在上传 base64 图片到云存储...');
                try {
                    imageUrl = await uploadImageToStorage(refImage.image);
                    isUrl = true;
                    isBase64 = false;
                    console.log('图片上传成功，获取到公网URL:', imageUrl);
                } catch (uploadError) {
                    console.warn('图片上传失败，将使用纯文生图模式:', uploadError.message);
                    imageUrl = null;
                }
            }

            // 如果有有效的图片 URL，使用图像编辑接口
            if (imageUrl) {
                console.log('使用图像编辑接口，传入参考图片URL:', imageUrl);
                try {
                    const response = await fetch('/api/dashscope/services/aigc/image2image/image-synthesis', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'X-DashScope-Async': 'enable'
                        },
                        body: JSON.stringify({
                            model: originalModel,
                            input: { 
                                prompt: enhancedPrompt,
                                base_image_url: imageUrl
                            },
                            parameters: { size: size, n: n }
                        })
                    });

                    const data = await response.json();
                    
                    // 检查是否成功
                    if (response.ok && data.output && data.output.task_id) {
                        return await pollImageTask(apiKey, data.output.task_id);
                    }
                    
                    // 如果失败，记录错误并继续使用文生图
                    console.warn('图像编辑接口失败:', data.message || response.status);
                } catch (err) {
                    console.warn('图像编辑接口调用失败:', err.message);
                }
            }
        }

        // 默认：使用文生图接口
        console.log('使用阿里百炼文生图接口，模型:', originalModel);
        const response = await fetch('/api/dashscope/services/aigc/text2image/image-synthesis', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-Async': 'enable'
            },
            body: JSON.stringify({
                model: originalModel || 'wanx-v1',
                input: { prompt: enhancedPrompt },
                parameters: { size: size, n: n }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API 请求失败: ${response.status}`);
        }

        const data = await response.json();
        if (data.output && data.output.task_id) {
            return await pollImageTask(apiKey, data.output.task_id);
        }
        throw new Error('图片生成任务创建失败');
    }

    // ============ 图片生成 API ============
    async function generateImage(prompt, options = {}) {
        // 支持指定厂商，或使用当前激活的厂商
        let provider, apiKey, endpoint;
        
        if (options.provider) {
            const config = getConfig(options.provider);
            if (!config) {
                throw new Error(`厂商 ${options.provider} 未配置`);
            }
            provider = options.provider;
            apiKey = config.apiKey;
            endpoint = config.baseUrl || config.endpoint;
        } else {
            const activeConfig = getActiveConfig();
            if (!activeConfig) {
                throw new Error('请先配置 API');
            }
            provider = activeConfig.provider;
            apiKey = activeConfig.apiKey;
            endpoint = activeConfig.baseUrl || activeConfig.endpoint;
        }

        const model = options.model || 'wanx-v1';
        const size = options.size || '1024*1024';
        const n = options.n || 1;
        const refImages = options.refImages || []; // 角色参考图片

        try {
            switch (provider) {
                case 'bailian':
                case 'qwen': {
                    // 检查是否有角色参考图片，如果有则使用人物一致性生成
                    if (refImages.length > 0 && refImages[0].image) {
                        return await generateImageWithCharacterRef(apiKey, prompt, refImages, size, n, model);
                    }
                    
                    // 阿里百炼所有图片模型都使用原生接口
                    // （兼容模式 /compatible-mode/v1 不支持图片生成 API）
                    console.log('使用阿里百炼原生接口，模型:', model);
                    const response = await fetch('/api/dashscope/services/aigc/text2image/image-synthesis', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'X-DashScope-Async': 'enable'
                        },
                        body: JSON.stringify({
                            model: model,
                            input: { prompt: prompt },
                            parameters: { size: size, n: n }
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `API 请求失败: ${response.status}`);
                    }

                    const data = await response.json();
                    
                    // 异步任务，需要轮询获取结果
                    if (data.output && data.output.task_id) {
                        return await pollImageTask(apiKey, data.output.task_id);
                    }
                    
                    throw new Error('图片生成任务创建失败');
                }

                case 'openai': {
                    // OpenAI DALL-E（通过代理或自定义端点）
                    const useProxy = !endpoint || endpoint === 'https://api.openai.com/v1';
                    const apiEndpoint = useProxy ? '/api/openai' : endpoint;
                    const response = await fetch(`${apiEndpoint}/images/generations`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: model,
                            prompt: prompt,
                            size: size.replace('*', 'x'),
                            n: n
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
                    }

                    const data = await response.json();
                    if (data.data && data.data.length > 0) {
                        return data.data.map(img => img.url);
                    }
                    throw new Error('图片生成失败');
                }

                case 'zhipu': {
                    // 智谱 CogView（通过代理或自定义端点）
                    const useProxy = !endpoint || endpoint === 'https://open.bigmodel.cn/api/paas/v4';
                    const apiEndpoint = useProxy ? '/api/zhipu' : endpoint;
                    const response = await fetch(`${apiEndpoint}/images/generations`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: model,
                            prompt: prompt
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
                    }

                    const data = await response.json();
                    if (data.data && data.data.length > 0) {
                        return data.data.map(img => img.url);
                    }
                    throw new Error('图片生成失败');
                }

                default:
                    throw new Error(`当前厂商 ${provider} 不支持图片生成`);
            }
        } catch (error) {
            console.error('图片生成失败:', error);
            throw error;
        }
    }

    // 轮询阿里百炼图片生成任务（通过代理）
    async function pollImageTask(apiKey, taskId, maxAttempts = 60) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(r => setTimeout(r, 2000)); // 每2秒轮询一次

            const response = await fetch(`/api/dashscope/tasks/${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`任务查询失败: ${response.status}`);
            }

            const data = await response.json();
            const status = data.output?.task_status;

            if (status === 'SUCCEEDED') {
                const results = data.output?.results;
                if (results && results.length > 0) {
                    return results.map(r => r.url);
                }
                throw new Error('图片生成结果为空');
            } else if (status === 'FAILED') {
                throw new Error(data.output?.message || '图片生成失败');
            }
            // PENDING 或 RUNNING 状态继续轮询
        }
        throw new Error('图片生成超时');
    }

    // ============ 视频生成 API ============
    async function generateVideo(imageUrl, prompt, options = {}) {
        // 支持指定厂商，或使用当前激活的厂商
        let provider, apiKey, endpoint;
        
        if (options.provider) {
            const config = getConfig(options.provider);
            if (!config) {
                throw new Error(`厂商 ${options.provider} 未配置`);
            }
            provider = options.provider;
            apiKey = config.apiKey;
            endpoint = config.baseUrl || config.endpoint;
        } else {
            const activeConfig = getActiveConfig();
            if (!activeConfig) {
                throw new Error('请先配置 API');
            }
            provider = activeConfig.provider;
            apiKey = activeConfig.apiKey;
            endpoint = activeConfig.baseUrl || activeConfig.endpoint;
        }

        const model = options.model || 'wanx2.1-i2v-turbo';
        const duration = options.duration || 5;

        try {
            switch (provider) {
                case 'bailian':
                case 'qwen': {
                    // 阿里百炼 - 通义万相视频生成（图生视频，通过代理）
                    const response = await fetch('/api/dashscope/services/aigc/image2video/video-synthesis', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'X-DashScope-Async': 'enable'
                        },
                        body: JSON.stringify({
                            model: model,
                            input: {
                                image_url: imageUrl,
                                prompt: prompt
                            },
                            parameters: {
                                duration: duration
                            }
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `API 请求失败: ${response.status}`);
                    }

                    const data = await response.json();
                    
                    // 异步任务，需要轮询获取结果
                    if (data.output && data.output.task_id) {
                        return await pollVideoTask(apiKey, data.output.task_id);
                    }
                    
                    throw new Error('视频生成任务创建失败');
                }

                default:
                    throw new Error(`当前厂商 ${provider} 不支持视频生成`);
            }
        } catch (error) {
            console.error('视频生成失败:', error);
            throw error;
        }
    }

    // 轮询阿里百炼视频生成任务（通过代理）
    async function pollVideoTask(apiKey, taskId, maxAttempts = 120) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(r => setTimeout(r, 3000)); // 每3秒轮询一次

            const response = await fetch(`/api/dashscope/tasks/${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`任务查询失败: ${response.status}`);
            }

            const data = await response.json();
            const status = data.output?.task_status;

            if (status === 'SUCCEEDED') {
                const videoUrl = data.output?.video_url;
                if (videoUrl) {
                    return videoUrl;
                }
                throw new Error('视频生成结果为空');
            } else if (status === 'FAILED') {
                throw new Error(data.output?.message || '视频生成失败');
            }
            // PENDING 或 RUNNING 状态继续轮询
        }
        throw new Error('视频生成超时');
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
        generateImage,
        generateVideo,
        uploadImageToStorage,
        setActiveProvider,
        getActiveProvider,
        getActiveConfig
    };
    
})();
