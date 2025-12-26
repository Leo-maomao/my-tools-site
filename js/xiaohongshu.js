/**
 * 小红书内容生成器
 */
(function() {
    'use strict';

    // 各厂商支持的模型列表
    var PROVIDER_MODELS = {
        openai: [
            { id: 'gpt-4o', name: 'GPT-4o' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
        ],
        qwen: [
            { id: 'qwen-plus', name: '通义千问 Plus' },
            { id: 'qwen-turbo', name: '通义千问 Turbo' },
            { id: 'qwen-max', name: '通义千问 Max' }
        ],
        bailian: [
            { id: 'qwen-plus', name: '通义千问 Plus' },
            { id: 'qwen-turbo', name: '通义千问 Turbo' },
            { id: 'qwen-max', name: '通义千问 Max' },
            { id: 'qwen-long', name: '通义千问 Long' },
            { id: 'deepseek-v3', name: 'DeepSeek V3' },
            { id: 'deepseek-r1', name: 'DeepSeek R1' }
        ],
        claude: [
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' }
        ],
        deepseek: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat' }
        ],
        moonshot: [
            { id: 'moonshot-v1-32k', name: 'Moonshot 32K' },
            { id: 'moonshot-v1-128k', name: 'Moonshot 128K' }
        ],
        zhipu: [
            { id: 'glm-4', name: 'GLM-4' },
            { id: 'glm-4-flash', name: 'GLM-4 Flash' }
        ]
    };

    // IndexedDB 存储模块
    var Storage = {
        dbName: 'weMediaDB',
        storeName: 'templates',
        db: null,

        init: function() {
            var self = this;
            return new Promise(function(resolve, reject) {
                var request = indexedDB.open(self.dbName, 1);

                request.onerror = function() {
                    reject(request.error);
                };

                request.onsuccess = function() {
                    self.db = request.result;
                    resolve();
                };

                request.onupgradeneeded = function(e) {
                    var db = e.target.result;
                    if (!db.objectStoreNames.contains(self.storeName)) {
                        db.createObjectStore(self.storeName, { keyPath: 'id' });
                    }
                };
            });
        },

        save: function(id, imageData) {
            var self = this;
            return new Promise(function(resolve, reject) {
                if (!self.db) {
                    reject(new Error('数据库未初始化'));
                    return;
                }
                var tx = self.db.transaction(self.storeName, 'readwrite');
                var store = tx.objectStore(self.storeName);
                var request = store.put({ id: id, data: imageData, timestamp: Date.now() });

                request.onsuccess = function() { resolve(); };
                request.onerror = function() { reject(request.error); };
            });
        },

        get: function(id) {
            var self = this;
            return new Promise(function(resolve, reject) {
                if (!self.db) {
                    reject(new Error('数据库未初始化'));
                    return;
                }
                var tx = self.db.transaction(self.storeName, 'readonly');
                var store = tx.objectStore(self.storeName);
                var request = store.get(id);

                request.onsuccess = function() {
                    resolve(request.result ? request.result.data : null);
                };
                request.onerror = function() { reject(request.error); };
            });
        },

        remove: function(id) {
            var self = this;
            return new Promise(function(resolve, reject) {
                if (!self.db) {
                    reject(new Error('数据库未初始化'));
                    return;
                }
                var tx = self.db.transaction(self.storeName, 'readwrite');
                var store = tx.objectStore(self.storeName);
                var request = store.delete(id);

                request.onsuccess = function() { resolve(); };
                request.onerror = function() { reject(request.error); };
            });
        }
    };

    // 配置参数（根据模板图片分析）
    var CONFIG = {
        // 图片尺寸
        imageWidth: 1080,
        imageHeight: 1440,

        // 封面图标题配置
        cover: {
            titleX: 540,           // 标题X坐标（居中）
            titleY: 420,           // 标题Y起始坐标
            titleMaxWidth: 900,    // 标题最大宽度
            titleFontSize: 64,     // 标题字号
            titleLineHeight: 1.4,  // 标题行高
            titleColor: '#8B4513', // 标题颜色（棕色）
            titleStroke: '#FFFFFF', // 标题描边颜色
            titleStrokeWidth: 4,   // 描边宽度
            titleFont: 'bold {size}px "PingFang SC", "Microsoft YaHei", sans-serif'
        },

        // 背景图正文配置
        content: {
            textX: 70,             // 文字区域左边距
            textY: 130,            // 文字区域顶部距离
            textWidth: 940,        // 文字区域宽度 (1080 - 70*2)
            textHeight: 980,       // 文字区域高度
            fontSize: 36,          // 正文字号
            lineHeight: 1.7,       // 行高
            paragraphSpacing: 24,  // 段落间距
            textColor: '#333333',  // 文字颜色
            textFont: '{size}px "PingFang SC", "Microsoft YaHei", sans-serif'
        }
    };

    // DOM 元素
    var elements = {
        // 封面图
        coverUploadArea: document.getElementById('coverUploadArea'),
        coverTemplateInput: document.getElementById('coverTemplateInput'),
        coverPlaceholder: document.getElementById('coverPlaceholder'),
        coverPreviewImg: document.getElementById('coverPreviewImg'),
        coverTitle: document.getElementById('coverTitle'),
        markCoverArea: document.getElementById('markCoverArea'),
        coverMarkIcon: document.getElementById('coverMarkIcon'),
        coverMarkText: document.getElementById('coverMarkText'),
        deleteCoverBtn: document.getElementById('deleteCoverBtn'),

        // 背景图
        bgUploadArea: document.getElementById('bgUploadArea'),
        bgTemplateInput: document.getElementById('bgTemplateInput'),
        bgPlaceholder: document.getElementById('bgPlaceholder'),
        bgPreviewImg: document.getElementById('bgPreviewImg'),
        contentEditor: document.getElementById('contentEditor'),
        contentCharCount: document.getElementById('contentCharCount'),
        markBgArea: document.getElementById('markBgArea'),
        bgMarkIcon: document.getElementById('bgMarkIcon'),
        bgMarkText: document.getElementById('bgMarkText'),
        deleteBgBtn: document.getElementById('deleteBgBtn'),

        // 发布信息
        xhsTitle: document.getElementById('xhsTitle'),
        xhsDesc: document.getElementById('xhsDesc'),
        descCharCount: document.getElementById('descCharCount'),

        // 按钮
        generateBtn: document.getElementById('generateBtn'),
        downloadAllBtn: document.getElementById('downloadAllBtn'),

        // 预览
        previewContainer: document.getElementById('previewContainer'),
        copySection: document.getElementById('copySection'),
        copyTitle: document.getElementById('copyTitle'),
        copyDesc: document.getElementById('copyDesc'),

        // Canvas
        canvas: document.getElementById('renderCanvas'),

        // AI功能
        modelSelect: document.getElementById('xhsModelSelect'),
        optimizeAllBtn: document.getElementById('optimizeAllBtn'),
        aiPreviewModal: document.getElementById('aiPreviewModal'),
        aiPreviewBody: document.getElementById('aiPreviewBody'),
        aiPreviewClose: document.getElementById('aiPreviewClose'),
        aiPreviewCancel: document.getElementById('aiPreviewCancel'),
        aiPreviewApply: document.getElementById('aiPreviewApply')
    };

    // 状态
    var state = {
        coverTemplate: null,  // 封面模板图片
        coverTemplateData: null, // 封面模板 base64
        bgTemplate: null,     // 背景模板图片
        bgTemplateData: null, // 背景模板 base64
        generatedImages: [],  // 生成的图片
        // 用户标记的区域（相对于原图的比例）
        coverArea: null,      // { x, y, width, height } 比例值 0-1
        bgArea: null,         // { x, y, width, height } 比例值 0-1
        // AI功能
        selectedModel: null,  // 当前选中的模型
        allModels: [],        // 所有可用模型
        aiOptimizeResults: {} // AI优化结果缓存
    };

    // 初始化
    function init() {
        bindEvents();
        initFullscreen();
        initAreaMarker();
        initAI(); // 初始化AI功能

        // 初始化 IndexedDB 并恢复已保存的模板
        Storage.init().then(function() {
            loadSavedTemplates();
            loadSavedAreas();
        }).catch(function(err) {
            // 存储初始化失败，静默处理
        });
    }

    // 加载已保存的区域
    function loadSavedAreas() {
        Storage.get('xhs_cover_area').then(function(data) {
            if (data) {
                state.coverArea = data;
                updateMarkButtonState('cover', true);
            }
        });
        Storage.get('xhs_bg_area').then(function(data) {
            if (data) {
                state.bgArea = data;
                updateMarkButtonState('bg', true);
            }
        });
    }

    // 更新标记按钮状态
    function updateMarkButtonState(type, isMarked) {
        var btn, icon, text;
        if (type === 'cover') {
            btn = elements.markCoverArea;
            icon = elements.coverMarkIcon;
            text = elements.coverMarkText;
        } else {
            btn = elements.markBgArea;
            icon = elements.bgMarkIcon;
            text = elements.bgMarkText;
        }

        if (isMarked) {
            btn.classList.add('is-marked');
            icon.className = 'ri-check-line';
            text.textContent = '已标记';
        } else {
            btn.classList.remove('is-marked');
            icon.className = 'ri-drag-move-line';
            text.textContent = '标记区域';
        }
    }

    // 加载已保存的模板
    function loadSavedTemplates() {
        // 加载封面模板
        Storage.get('xhs_cover_template').then(function(data) {
            if (data) {
                loadImageFromData(data, 'cover');
            }
        });

        // 加载背景模板
        Storage.get('xhs_bg_template').then(function(data) {
            if (data) {
                loadImageFromData(data, 'bg');
            }
        });
    }

    // 绑定事件
    function bindEvents() {
        // 封面模板上传
        elements.coverUploadArea.addEventListener('click', function() {
            elements.coverTemplateInput.click();
        });
        elements.coverTemplateInput.addEventListener('change', function(e) {
            handleImageUpload(e, 'cover');
        });

        // 背景模板上传
        elements.bgUploadArea.addEventListener('click', function() {
            elements.bgTemplateInput.click();
        });
        elements.bgTemplateInput.addEventListener('change', function(e) {
            handleImageUpload(e, 'bg');
        });

        // 正文字数统计
        elements.contentEditor.addEventListener('input', function() {
            var count = this.innerText.length;
            elements.contentCharCount.textContent = count + '字';
        });

        // 支持粘贴图片
        elements.contentEditor.addEventListener('paste', handlePaste);

        // 正文描述字数统计
        elements.xhsDesc.addEventListener('input', function() {
            var count = this.value.length;
            elements.descCharCount.textContent = count + '字';
        });

        // 生成按钮
        elements.generateBtn.addEventListener('click', generateImages);

        // 下载全部
        elements.downloadAllBtn.addEventListener('click', downloadAllImages);

        // 复制按钮
        document.querySelectorAll('.btn-copy').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var targetId = this.getAttribute('data-target');
                copyToClipboard(targetId, this);
            });
        });

        // 标记区域按钮
        elements.markCoverArea.addEventListener('click', function(e) {
            e.stopPropagation();
            openAreaMarker('cover');
        });
        elements.markBgArea.addEventListener('click', function(e) {
            e.stopPropagation();
            openAreaMarker('bg');
        });

        // 删除图片按钮
        elements.deleteCoverBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteTemplate('cover');
        });
        elements.deleteBgBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteTemplate('bg');
        });

        // AI优化按钮事件
        document.querySelectorAll('.btn-ai-optimize').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var target = this.getAttribute('data-target');
                optimizeSingleField(target, this);
            });
        });

        // 一键优化按钮
        if (elements.optimizeAllBtn) {
            elements.optimizeAllBtn.addEventListener('click', optimizeAllFields);
        }

        // 模型选择器
        if (elements.modelSelect) {
            elements.modelSelect.addEventListener('change', function() {
                var value = this.value;
                if (value) {
                    var parts = value.split('|');
                    state.selectedModel = {
                        providerId: parts[0],
                        modelId: parts[1]
                    };
                } else {
                    state.selectedModel = null;
                }
            });
        }

        // AI预览弹窗事件
        if (elements.aiPreviewClose) {
            elements.aiPreviewClose.addEventListener('click', closeAIPreview);
        }
        if (elements.aiPreviewCancel) {
            elements.aiPreviewCancel.addEventListener('click', closeAIPreview);
        }
        if (elements.aiPreviewApply) {
            elements.aiPreviewApply.addEventListener('click', applyAIOptimization);
        }
        if (elements.aiPreviewModal) {
            elements.aiPreviewModal.querySelector('.xhs-ai-preview-backdrop').addEventListener('click', closeAIPreview);
        }

        // 监听API配置更新事件
        window.addEventListener('apiConfigUpdated', function() {
            loadModels();
        });
    }

    // ========== AI功能 ==========
    
    // 初始化AI功能
    async function initAI() {
        // 先初始化UI.Select容器
        if (window.UI && window.UI.Select) {
            window.UI.Select.init(document.querySelector('.xhs-main'));
        }
        // 异步加载模型数据
        await loadModels();
    }

    // 加载所有可用模型（异步获取）
    async function loadModels() {
        // 确保获取最新的DOM元素
        elements.modelSelect = document.getElementById('xhsModelSelect');
        
        if (!window.ToolsAPIConfig) {
            state.allModels = [];
            renderModelSelect();
            return;
        }

        var configs = window.ToolsAPIConfig.loadAllConfigs();
        var models = [];
        
        // 显示加载状态
        if (elements.modelSelect) {
            elements.modelSelect.innerHTML = '<option value="">加载模型中...</option>';
            if (window.UI && window.UI.Select) {
                window.UI.Select.refresh(elements.modelSelect);
            }
        }

        // 遍历已配置的厂商，动态获取模型列表
        var providerIds = Object.keys(configs);
        
        for (var i = 0; i < providerIds.length; i++) {
            var providerId = providerIds[i];
            var config = configs[providerId];
            
            if (config.apiKey) {
                try {
                    // 动态获取模型列表
                    var providerModels = await window.ToolsAPIConfig.fetchModels(
                        providerId, 
                        config.apiKey, 
                        config.baseUrl || config.endpoint
                    );
                    
                    providerModels.forEach(function(model) {
                        models.push({
                            providerId: providerId,
                            modelId: model.id,
                            displayName: model.name
                        });
                    });
                } catch (error) {
                    console.warn('获取 ' + providerId + ' 模型列表失败:', error.message);
                    // 如果动态获取失败，使用备用的硬编码列表
                    var fallbackModels = PROVIDER_MODELS[providerId] || [];
                    fallbackModels.forEach(function(model) {
                        models.push({
                            providerId: providerId,
                            modelId: model.id,
                            displayName: model.name + ' (离线)'
                        });
                    });
                }
            }
        }

        state.allModels = models;
        renderModelSelect();
    }

    // 渲染模型选择器
    function renderModelSelect() {
        var select = elements.modelSelect;
        if (!select) return;

        select.innerHTML = '';

        if (state.allModels.length === 0) {
            select.innerHTML = '<option value="">请先在设置中配置API</option>';
            if (elements.optimizeAllBtn) {
                elements.optimizeAllBtn.disabled = true;
            }
            // 刷新UI.Select
            if (window.UI && window.UI.Select) {
                window.UI.Select.refresh(select);
            }
            return;
        }

        // 添加默认选项
        var defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '选择模型';
        select.appendChild(defaultOption);

        // 按厂商分组
        var grouped = {};
        state.allModels.forEach(function(model) {
            if (!grouped[model.providerId]) {
                grouped[model.providerId] = [];
            }
            grouped[model.providerId].push(model);
        });

        Object.keys(grouped).forEach(function(providerId) {
            var providerInfo = window.ToolsAPIConfig.getProviderInfo(providerId);
            var providerName = providerInfo ? providerInfo.name : providerId;
            var optgroup = document.createElement('optgroup');
            optgroup.label = providerName;

            grouped[providerId].forEach(function(model) {
                var option = document.createElement('option');
                option.value = model.providerId + '|' + model.modelId;
                option.textContent = model.displayName;
                optgroup.appendChild(option);
            });

            select.appendChild(optgroup);
        });

        if (elements.optimizeAllBtn) {
            elements.optimizeAllBtn.disabled = false;
        }

        // 刷新UI.Select
        if (window.UI && window.UI.Select) {
            window.UI.Select.refresh(select);
        }
    }

    // AI优化提示词
    var AI_PROMPTS = {
        coverTitle: {
            system: '你是一个小红书运营专家，擅长写吸引人的封面标题。',
            user: '请优化以下小红书封面标题，使其更加吸引眼球、简洁有力（控制在15字以内）。只输出优化后的标题，不要任何解释：\n\n'
        },
        contentEditor: {
            system: '你是一个小红书内容创作专家，擅长写出高互动的正文内容。',
            user: '请优化以下小红书正文内容，使其更加生动有趣、易读、有互动性。保持原意，适当添加emoji表情，每段不要太长。只输出优化后的内容，不要任何解释：\n\n'
        },
        xhsTitle: {
            system: '你是一个小红书运营专家，擅长写优秀的发布标题。',
            user: '请优化以下小红书发布标题，使其更加吸引人点击、包含关键词、控制在20字以内。只输出优化后的标题，不要任何解释：\n\n'
        },
        xhsDesc: {
            system: '你是一个小红书运营专家，擅长写高转化的发布内容。',
            user: '请优化以下小红书发布内容，使其更加吸引人、包含话题标签、引导互动。适当添加emoji和#话题标签。只输出优化后的内容，不要任何解释：\n\n'
        }
    };

    // 获取字段内容
    function getFieldContent(target) {
        if (target === 'contentEditor') {
            return elements.contentEditor.innerText.trim();
        } else {
            var el = document.getElementById(target);
            return el ? el.value.trim() : '';
        }
    }

    // 设置字段内容
    function setFieldContent(target, content) {
        if (target === 'contentEditor') {
            elements.contentEditor.innerText = content;
            var count = content.length;
            elements.contentCharCount.textContent = count + '字';
        } else {
            var el = document.getElementById(target);
            if (el) {
                el.value = content;
                // 触发字数统计更新
                if (target === 'xhsDesc') {
                    elements.descCharCount.textContent = content.length + '字';
                }
            }
        }
    }

    // 调用AI API
    async function callAI(systemPrompt, userPrompt) {
        if (!state.selectedModel || !window.ToolsAPIConfig) {
            throw new Error('请先选择模型');
        }

        var activeConfig = window.ToolsAPIConfig.getConfig(state.selectedModel.providerId);
        if (!activeConfig || !activeConfig.apiKey) {
            throw new Error('API配置不完整');
        }

        var providerInfo = window.ToolsAPIConfig.getProviderInfo(state.selectedModel.providerId);
        var apiUrl = activeConfig.baseUrl || (providerInfo ? providerInfo.endpoint : '');
        if (!apiUrl) {
            throw new Error('API地址配置不正确');
        }

        // 确保URL以/chat/completions结尾
        if (!apiUrl.endsWith('/chat/completions')) {
            apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';
        }

        var response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + activeConfig.apiKey
            },
            body: JSON.stringify({
                model: state.selectedModel.modelId,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error('AI请求失败: ' + response.status);
        }

        var data = await response.json();
        return data.choices[0].message.content.trim();
    }

    // 优化单个字段
    async function optimizeSingleField(target, btn) {
        var content = getFieldContent(target);
        if (!content) {
            alert('请先输入内容');
            return;
        }

        if (!state.selectedModel) {
            alert('请先选择模型');
            return;
        }

        var prompt = AI_PROMPTS[target];
        if (!prompt) {
            alert('不支持的字段类型');
            return;
        }

        // 设置loading状态
        btn.classList.add('is-loading');
        btn.disabled = true;

        try {
            var optimized = await callAI(prompt.system, prompt.user + content);
            
            // 存储优化结果
            state.aiOptimizeResults = {
                [target]: {
                    original: content,
                    optimized: optimized
                }
            };

            // 显示预览
            showAIPreview();
        } catch (error) {
            alert('AI优化失败: ' + error.message);
        } finally {
            btn.classList.remove('is-loading');
            btn.disabled = false;
        }
    }

    // 一键优化所有字段
    async function optimizeAllFields() {
        if (!state.selectedModel) {
            alert('请先选择模型');
            return;
        }

        var btn = elements.optimizeAllBtn;
        var originalText = btn.innerHTML;
        btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> 优化中...';
        btn.disabled = true;

        var results = {};
        var fields = ['coverTitle', 'contentEditor', 'xhsTitle', 'xhsDesc'];
        var hasContent = false;

        try {
            for (var i = 0; i < fields.length; i++) {
                var target = fields[i];
                var content = getFieldContent(target);
                
                if (content) {
                    hasContent = true;
                    var prompt = AI_PROMPTS[target];
                    var optimized = await callAI(prompt.system, prompt.user + content);
                    results[target] = {
                        original: content,
                        optimized: optimized
                    };
                }
            }

            if (!hasContent) {
                alert('请先输入内容');
                return;
            }

            state.aiOptimizeResults = results;
            showAIPreview();
        } catch (error) {
            alert('AI优化失败: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // 显示AI预览弹窗
    function showAIPreview() {
        var body = elements.aiPreviewBody;
        body.innerHTML = '';

        var fieldNames = {
            coverTitle: '封面标题',
            contentEditor: '正文内容',
            xhsTitle: '发布标题',
            xhsDesc: '发布内容'
        };

        Object.keys(state.aiOptimizeResults).forEach(function(target) {
            var result = state.aiOptimizeResults[target];
            var item = document.createElement('div');
            item.className = 'xhs-ai-preview-item';
            item.innerHTML = 
                '<div class="xhs-ai-preview-label">' + (fieldNames[target] || target) + '</div>' +
                '<div class="xhs-ai-preview-original">' + escapeHtml(result.original) + '</div>' +
                '<div class="xhs-ai-preview-optimized">' + escapeHtml(result.optimized) + '</div>';
            body.appendChild(item);
        });

        elements.aiPreviewModal.classList.add('is-open');
    }

    // 关闭AI预览弹窗
    function closeAIPreview() {
        elements.aiPreviewModal.classList.remove('is-open');
    }

    // 应用AI优化结果
    function applyAIOptimization() {
        Object.keys(state.aiOptimizeResults).forEach(function(target) {
            var result = state.aiOptimizeResults[target];
            setFieldContent(target, result.optimized);
        });

        closeAIPreview();
        state.aiOptimizeResults = {};
    }

    // HTML转义
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== 模板管理 ==========

    // 删除模板
    function deleteTemplate(type) {
        if (type === 'cover') {
            state.coverTemplate = null;
            state.coverTemplateData = null;
            state.coverArea = null;
            elements.coverPreviewImg.style.display = 'none';
            elements.coverPreviewImg.src = '';
            elements.coverPlaceholder.style.display = 'flex';
            elements.coverUploadArea.classList.remove('has-image');
            elements.markCoverArea.style.display = 'none';
            elements.deleteCoverBtn.style.display = 'none';
            elements.coverTemplateInput.value = '';
            updateMarkButtonState('cover', false);
            Storage.remove('xhs_cover_template');
            Storage.remove('xhs_cover_area');
        } else if (type === 'bg') {
            state.bgTemplate = null;
            state.bgTemplateData = null;
            state.bgArea = null;
            elements.bgPreviewImg.style.display = 'none';
            elements.bgPreviewImg.src = '';
            elements.bgPlaceholder.style.display = 'flex';
            elements.bgUploadArea.classList.remove('has-image');
            elements.markBgArea.style.display = 'none';
            elements.deleteBgBtn.style.display = 'none';
            elements.bgTemplateInput.value = '';
            updateMarkButtonState('bg', false);
            Storage.remove('xhs_bg_template');
            Storage.remove('xhs_bg_area');
        }
    }

    // 处理粘贴事件
    function handlePaste(e) {
        var clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        var items = clipboardData.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                var file = items[i].getAsFile();
                var reader = new FileReader();
                reader.onload = function(event) {
                    var img = document.createElement('img');
                    img.src = event.target.result;
                    // 插入图片到光标位置
                    var selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        var range = selection.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(img);
                        // 移动光标到图片后
                        range.setStartAfter(img);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } else {
                        elements.contentEditor.appendChild(img);
                    }
                    // 更新字数
                    elements.contentCharCount.textContent = elements.contentEditor.innerText.length + '字';
                };
                reader.readAsDataURL(file);
                return;
            }
        }
    }

    // 处理图片上传
    function handleImageUpload(e, type) {
        var file = e.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(event) {
            var imageData = event.target.result;
            loadImageFromData(imageData, type);

            // 保存到 IndexedDB
            var storageKey = 'xhs_' + type + '_template';
            Storage.save(storageKey, imageData).catch(function(err) {
                // 保存失败，静默处理
            });
        };
        reader.readAsDataURL(file);
    }

    // 从 base64 数据加载图片
    function loadImageFromData(imageData, type) {
        var img = new Image();
        img.onload = function() {
            if (type === 'cover') {
                state.coverTemplate = img;
                state.coverTemplateData = imageData;
                elements.coverPreviewImg.src = imageData;
                elements.coverPreviewImg.style.display = 'block';
                elements.coverPlaceholder.style.display = 'none';
                elements.coverUploadArea.classList.add('has-image');
                elements.markCoverArea.style.display = 'flex';
                elements.deleteCoverBtn.style.display = 'flex';
            } else if (type === 'bg') {
                state.bgTemplate = img;
                state.bgTemplateData = imageData;
                elements.bgPreviewImg.src = imageData;
                elements.bgPreviewImg.style.display = 'block';
                elements.bgPlaceholder.style.display = 'none';
                elements.bgUploadArea.classList.add('has-image');
                elements.markBgArea.style.display = 'flex';
                elements.deleteBgBtn.style.display = 'flex';
            }
        };
        img.src = imageData;
    }


    // 从contentEditor解析内容（文字和图片）
    function parseEditorContent() {
        var items = [];
        var childNodes = elements.contentEditor.childNodes;

        function processNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                var text = node.textContent;
                if (text.trim()) {
                    items.push({ type: 'text', text: text });
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'IMG') {
                    var img = new Image();
                    img.src = node.src;
                    items.push({ type: 'image', img: img, src: node.src });
                } else if (node.tagName === 'BR') {
                    items.push({ type: 'text', text: '\n' });
                } else if (node.tagName === 'DIV' || node.tagName === 'P') {
                    // 块级元素，递归处理子节点后添加换行
                    for (var i = 0; i < node.childNodes.length; i++) {
                        processNode(node.childNodes[i]);
                    }
                    items.push({ type: 'text', text: '\n' });
                } else {
                    // 其他元素，递归处理子节点
                    for (var i = 0; i < node.childNodes.length; i++) {
                        processNode(node.childNodes[i]);
                    }
                }
            }
        }

        for (var i = 0; i < childNodes.length; i++) {
            processNode(childNodes[i]);
        }

        return items;
    }

    // 生成图片
    function generateImages() {
        var coverTitle = elements.coverTitle.value.trim();
        var editorContent = parseEditorContent();
        var hasContent = editorContent.some(function(item) {
            return (item.type === 'text' && item.text.trim()) || item.type === 'image';
        });

        if (!state.coverTemplate && !state.bgTemplate) {
            alert('请至少上传一个模板图片');
            return;
        }
        
        // 埋点：小红书图片生成
        if (typeof trackEvent === 'function') {
            trackEvent('xhs_generate', {
                has_cover: !!(state.coverTemplate && coverTitle),
                has_content: !!(state.bgTemplate && hasContent)
            });
        }

        state.generatedImages = [];
        elements.previewContainer.innerHTML = '';

        // 生成封面图
        if (state.coverTemplate && coverTitle) {
            var coverImage = generateCoverImage(coverTitle);
            state.generatedImages.push({ type: 'cover', data: coverImage, name: '封面图' });
        }

        // 生成正文图
        if (state.bgTemplate && hasContent) {
            var contentImages = generateContentImages(editorContent);
            contentImages.forEach(function(img, index) {
                state.generatedImages.push({
                    type: 'content',
                    data: img,
                    name: '正文图 ' + (index + 1)
                });
            });
        }

        // 显示预览
        renderPreview();

        // 更新复制区域
        updateCopySection();

        // 启用下载按钮
        elements.downloadAllBtn.disabled = state.generatedImages.length === 0;
    }

    // 生成封面图
    function generateCoverImage(title) {
        var canvas = elements.canvas;
        var ctx = canvas.getContext('2d');
        var cfg = CONFIG.cover;

        // 设置画布尺寸
        canvas.width = state.coverTemplate.width || CONFIG.imageWidth;
        canvas.height = state.coverTemplate.height || CONFIG.imageHeight;

        // 绘制背景图
        ctx.drawImage(state.coverTemplate, 0, 0, canvas.width, canvas.height);

        // 获取标题区域（用户标记的或默认的）
        var area;
        if (state.coverArea) {
            area = {
                x: state.coverArea.x * canvas.width,
                y: state.coverArea.y * canvas.height,
                width: state.coverArea.width * canvas.width,
                height: state.coverArea.height * canvas.height
            };
        } else {
            // 默认区域
            area = {
                x: canvas.width * 0.1,
                y: canvas.height * 0.25,
                width: canvas.width * 0.8,
                height: canvas.height * 0.4
            };
        }

        // 动态计算字号以填满区域
        var fontSize = calculateOptimalFontSize(ctx, title, area.width, area.height, cfg);
        ctx.font = cfg.titleFont.replace('{size}', fontSize);

        // 设置文字样式
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // 文字换行处理
        var lines = wrapText(ctx, title, area.width);
        var lineHeight = fontSize * cfg.titleLineHeight;
        var totalTextHeight = lines.length * lineHeight;

        // 垂直居中
        var startY = area.y + (area.height - totalTextHeight) / 2;
        var centerX = area.x + area.width / 2;

        // 绘制文字（描边 + 填充）
        lines.forEach(function(line, index) {
            var y = startY + index * lineHeight;

            // 描边
            ctx.strokeStyle = cfg.titleStroke;
            ctx.lineWidth = Math.max(2, fontSize / 16);
            ctx.lineJoin = 'round';
            ctx.strokeText(line, centerX, y);

            // 填充
            ctx.fillStyle = cfg.titleColor;
            ctx.fillText(line, centerX, y);
        });

        return canvas.toDataURL('image/png');
    }

    // 计算最优字号以填满区域
    function calculateOptimalFontSize(ctx, text, maxWidth, maxHeight, cfg) {
        var minSize = 24;
        var maxSize = 200;
        var optimalSize = minSize;

        for (var size = maxSize; size >= minSize; size -= 4) {
            ctx.font = cfg.titleFont.replace('{size}', size);
            var lines = wrapText(ctx, text, maxWidth);
            var lineHeight = size * cfg.titleLineHeight;
            var totalHeight = lines.length * lineHeight;

            if (totalHeight <= maxHeight) {
                optimalSize = size;
                break;
            }
        }

        return optimalSize;
    }

    // 生成正文图（自动分页）
    function generateContentImages(contentItems) {
        var canvas = elements.canvas;
        var ctx = canvas.getContext('2d');
        var cfg = CONFIG.content;

        // 设置画布尺寸
        canvas.width = state.bgTemplate.width || CONFIG.imageWidth;
        canvas.height = state.bgTemplate.height || CONFIG.imageHeight;

        // 获取正文区域（用户标记的或默认的）
        var textX, textY, textWidth, textHeight;
        if (state.bgArea) {
            textX = state.bgArea.x * canvas.width;
            textY = state.bgArea.y * canvas.height;
            textWidth = state.bgArea.width * canvas.width;
            textHeight = state.bgArea.height * canvas.height;
        } else {
            // 默认区域
            var scale = canvas.width / CONFIG.imageWidth;
            textX = cfg.textX * scale;
            textY = cfg.textY * scale;
            textWidth = cfg.textWidth * scale;
            textHeight = cfg.textHeight * scale;
        }

        // 字体大小根据区域自适应
        var fontSize = Math.min(textWidth / 20, textHeight / 25, 40);
        var lineHeight = fontSize * cfg.lineHeight;
        var paragraphSpacing = fontSize * 0.6;

        // 设置文字样式
        ctx.font = cfg.textFont.replace('{size}', fontSize);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = cfg.textColor;

        // 分割段落并处理图片
        var allItems = [];

        contentItems.forEach(function(item) {
            if (item.type === 'image') {
                allItems.push({ type: 'image', img: item.img });
            } else {
                // 文本段落
                var paragraphs = item.text.split(/\n+/);
                paragraphs.forEach(function(para, pIndex) {
                    if (para.trim() === '') return;
                    var lines = wrapText(ctx, para, textWidth);
                    lines.forEach(function(line, lIndex) {
                        allItems.push({
                            type: 'text',
                            text: line,
                            isLastOfParagraph: lIndex === lines.length - 1 && pIndex < paragraphs.length - 1
                        });
                    });
                });
            }
        });

        // 图片最大高度（区域高度的40%）
        var maxImageHeight = textHeight * 0.4;
        var images = [];
        var currentIdx = 0;

        while (currentIdx < allItems.length) {
            // 绘制背景
            ctx.drawImage(state.bgTemplate, 0, 0, canvas.width, canvas.height);
            ctx.font = cfg.textFont.replace('{size}', fontSize);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillStyle = cfg.textColor;

            // 绘制本页内容
            var y = textY;

            while (currentIdx < allItems.length && y < textY + textHeight) {
                var item = allItems[currentIdx];

                if (item.type === 'image') {
                    // 绘制图片（居中）
                    var img = item.img;
                    var imgRatio = img.width / img.height;
                    var drawHeight = Math.min(maxImageHeight, textHeight - (y - textY) - lineHeight);
                    if (drawHeight < lineHeight * 2) {
                        // 本页空间不够，换页
                        break;
                    }
                    var drawWidth = drawHeight * imgRatio;
                    if (drawWidth > textWidth) {
                        drawWidth = textWidth;
                        drawHeight = drawWidth / imgRatio;
                    }
                    // 居中绘制
                    var imgX = textX + (textWidth - drawWidth) / 2;
                    ctx.drawImage(img, imgX, y, drawWidth, drawHeight);
                    y += drawHeight + paragraphSpacing;
                    currentIdx++;
                } else {
                    // 绘制文字
                    if (y + lineHeight > textY + textHeight) {
                        break;
                    }
                    ctx.fillText(item.text, textX, y);
                    y += lineHeight;
                    if (item.isLastOfParagraph) {
                        y += paragraphSpacing;
                    }
                    currentIdx++;
                }
            }

            images.push(canvas.toDataURL('image/png'));
        }

        return images;
    }

    // 文字换行处理
    function wrapText(ctx, text, maxWidth) {
        var lines = [];
        var currentLine = '';

        for (var i = 0; i < text.length; i++) {
            var char = text[i];
            var testLine = currentLine + char;
            var metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    // 渲染预览（小图模式）
    function renderPreview() {
        if (state.generatedImages.length === 0) {
            elements.previewContainer.innerHTML = '<div class="preview-empty"><i class="ri-image-2-line"></i><p>上传模板并输入内容后<br>点击"生成图片"查看预览</p></div>';
            return;
        }

        var html = '<div class="preview-grid">';
        state.generatedImages.forEach(function(img, index) {
            html += '<div class="preview-thumb" data-index="' + index + '">';
            html += '  <img src="' + img.data + '" alt="' + img.name + '">';
            html += '  <span class="preview-thumb-label">' + img.name + '</span>';
            html += '  <button class="preview-thumb-zoom" title="查看大图">';
            html += '    <i class="ri-fullscreen-line"></i>';
            html += '  </button>';
            html += '</div>';
        });
        html += '</div>';

        elements.previewContainer.innerHTML = html;

        // 绑定点击预览事件
        elements.previewContainer.querySelectorAll('.preview-thumb').forEach(function(thumb) {
            thumb.addEventListener('click', function() {
                var index = parseInt(this.getAttribute('data-index'));
                openFullscreen(index);
            });
        });
    }

    // 区域标记相关
    var areaMarkerState = {
        modal: null,
        canvas: null,
        ctx: null,
        selection: null,
        confirmBtn: null,
        centerBtn: null,
        type: null, // 'cover' or 'bg'
        isDrawing: false,
        isDragging: false,
        isResizing: false,
        resizeDir: null,
        startX: 0,
        startY: 0,
        dragOffsetX: 0,
        dragOffsetY: 0,
        rect: null,
        canvasRect: null,
        scale: 1
    };

    function initAreaMarker() {
        areaMarkerState.modal = document.getElementById('areaMarkerModal');
        areaMarkerState.canvas = document.getElementById('areaMarkerCanvas');
        areaMarkerState.ctx = areaMarkerState.canvas.getContext('2d');
        areaMarkerState.selection = document.getElementById('areaSelection');
        areaMarkerState.confirmBtn = document.getElementById('areaMarkerConfirm');
        areaMarkerState.centerBtn = document.getElementById('areaMarkerCenter');

        var canvasWrap = document.querySelector('.area-marker-canvas-wrap');

        // 鼠标按下事件
        canvasWrap.addEventListener('mousedown', function(e) {
            areaMarkerState.canvasRect = areaMarkerState.canvas.getBoundingClientRect();
            var mouseX = e.clientX - areaMarkerState.canvasRect.left;
            var mouseY = e.clientY - areaMarkerState.canvasRect.top;

            // 检查是否点击了调整手柄
            if (e.target.classList.contains('resize-handle')) {
                areaMarkerState.isResizing = true;
                areaMarkerState.resizeDir = e.target.getAttribute('data-dir');
                areaMarkerState.startX = mouseX;
                areaMarkerState.startY = mouseY;
                return;
            }

            // 检查是否点击了选区内部（拖动）
            if (e.target === areaMarkerState.selection || e.target.parentElement === areaMarkerState.selection) {
                if (areaMarkerState.rect) {
                    areaMarkerState.isDragging = true;
                    var wrapRect = canvasWrap.getBoundingClientRect();
                    var offsetX = areaMarkerState.canvasRect.left - wrapRect.left;
                    var offsetY = areaMarkerState.canvasRect.top - wrapRect.top;
                    areaMarkerState.dragOffsetX = mouseX - areaMarkerState.rect.x;
                    areaMarkerState.dragOffsetY = mouseY - areaMarkerState.rect.y;
                    return;
                }
            }

            // 在画布上绘制新选区
            if (e.target === areaMarkerState.canvas) {
                areaMarkerState.isDrawing = true;
                areaMarkerState.startX = mouseX;
                areaMarkerState.startY = mouseY;
                areaMarkerState.selection.classList.add('is-active');
            }
        });

        // 鼠标移动事件
        canvasWrap.addEventListener('mousemove', function(e) {
            if (!areaMarkerState.canvasRect) return;
            var mouseX = e.clientX - areaMarkerState.canvasRect.left;
            var mouseY = e.clientY - areaMarkerState.canvasRect.top;

            // 调整大小
            if (areaMarkerState.isResizing && areaMarkerState.rect) {
                resizeSelection(mouseX, mouseY);
                updateSelectionDisplay();
                return;
            }

            // 拖动选区
            if (areaMarkerState.isDragging && areaMarkerState.rect) {
                var newX = mouseX - areaMarkerState.dragOffsetX;
                var newY = mouseY - areaMarkerState.dragOffsetY;
                // 限制在画布内
                newX = Math.max(0, Math.min(newX, areaMarkerState.canvasRect.width - areaMarkerState.rect.width));
                newY = Math.max(0, Math.min(newY, areaMarkerState.canvasRect.height - areaMarkerState.rect.height));
                areaMarkerState.rect.x = newX;
                areaMarkerState.rect.y = newY;
                updateSelectionDisplay();
                return;
            }

            // 绘制新选区
            if (areaMarkerState.isDrawing) {
                var x = Math.min(areaMarkerState.startX, mouseX);
                var y = Math.min(areaMarkerState.startY, mouseY);
                var width = Math.abs(mouseX - areaMarkerState.startX);
                var height = Math.abs(mouseY - areaMarkerState.startY);

                // 限制在画布内
                x = Math.max(0, x);
                y = Math.max(0, y);
                width = Math.min(width, areaMarkerState.canvasRect.width - x);
                height = Math.min(height, areaMarkerState.canvasRect.height - y);

                areaMarkerState.rect = { x: x, y: y, width: width, height: height };
                updateSelectionDisplay();
            }
        });

        // 鼠标松开事件
        document.addEventListener('mouseup', function() {
            if (areaMarkerState.isDrawing || areaMarkerState.isDragging || areaMarkerState.isResizing) {
                areaMarkerState.isDrawing = false;
                areaMarkerState.isDragging = false;
                areaMarkerState.isResizing = false;
                areaMarkerState.resizeDir = null;
                if (areaMarkerState.rect && areaMarkerState.rect.width > 10 && areaMarkerState.rect.height > 10) {
                    areaMarkerState.confirmBtn.disabled = false;
                    areaMarkerState.centerBtn.disabled = false;
                }
            }
        });

        // 取消按钮
        document.getElementById('areaMarkerCancel').addEventListener('click', closeAreaMarker);

        // 居中按钮
        areaMarkerState.centerBtn.addEventListener('click', centerSelection);

        // 确认按钮
        areaMarkerState.confirmBtn.addEventListener('click', confirmAreaMarker);

        // 背景点击关闭
        document.querySelector('.area-marker-backdrop').addEventListener('click', closeAreaMarker);
    }

    // 调整选区大小
    function resizeSelection(mouseX, mouseY) {
        var r = areaMarkerState.rect;
        var dir = areaMarkerState.resizeDir;
        var minSize = 20;

        switch(dir) {
            case 'nw':
                var newWidth = r.x + r.width - mouseX;
                var newHeight = r.y + r.height - mouseY;
                if (newWidth >= minSize) { r.width = newWidth; r.x = mouseX; }
                if (newHeight >= minSize) { r.height = newHeight; r.y = mouseY; }
                break;
            case 'n':
                var newHeight = r.y + r.height - mouseY;
                if (newHeight >= minSize) { r.height = newHeight; r.y = mouseY; }
                break;
            case 'ne':
                var newWidth = mouseX - r.x;
                var newHeight = r.y + r.height - mouseY;
                if (newWidth >= minSize) { r.width = newWidth; }
                if (newHeight >= minSize) { r.height = newHeight; r.y = mouseY; }
                break;
            case 'e':
                var newWidth = mouseX - r.x;
                if (newWidth >= minSize) { r.width = newWidth; }
                break;
            case 'se':
                var newWidth = mouseX - r.x;
                var newHeight = mouseY - r.y;
                if (newWidth >= minSize) { r.width = newWidth; }
                if (newHeight >= minSize) { r.height = newHeight; }
                break;
            case 's':
                var newHeight = mouseY - r.y;
                if (newHeight >= minSize) { r.height = newHeight; }
                break;
            case 'sw':
                var newWidth = r.x + r.width - mouseX;
                var newHeight = mouseY - r.y;
                if (newWidth >= minSize) { r.width = newWidth; r.x = mouseX; }
                if (newHeight >= minSize) { r.height = newHeight; }
                break;
            case 'w':
                var newWidth = r.x + r.width - mouseX;
                if (newWidth >= minSize) { r.width = newWidth; r.x = mouseX; }
                break;
        }

        // 限制在画布范围内
        r.x = Math.max(0, r.x);
        r.y = Math.max(0, r.y);
        r.width = Math.min(r.width, areaMarkerState.canvasRect.width - r.x);
        r.height = Math.min(r.height, areaMarkerState.canvasRect.height - r.y);
    }

    // 水平居中选区
    function centerSelection() {
        if (!areaMarkerState.rect || !areaMarkerState.canvasRect) return;
        var canvasWidth = areaMarkerState.canvasRect.width;
        areaMarkerState.rect.x = (canvasWidth - areaMarkerState.rect.width) / 2;
        updateSelectionDisplay();
    }

    function updateSelectionDisplay() {
        if (!areaMarkerState.rect) return;
        var r = areaMarkerState.rect;
        var canvasRect = areaMarkerState.canvasRect;
        var wrapRect = document.querySelector('.area-marker-canvas-wrap').getBoundingClientRect();

        // 计算 selection 相对于 wrap 的位置
        var offsetX = canvasRect.left - wrapRect.left;
        var offsetY = canvasRect.top - wrapRect.top;

        areaMarkerState.selection.style.left = (offsetX + r.x) + 'px';
        areaMarkerState.selection.style.top = (offsetY + r.y) + 'px';
        areaMarkerState.selection.style.width = r.width + 'px';
        areaMarkerState.selection.style.height = r.height + 'px';
    }

    function openAreaMarker(type) {
        areaMarkerState.type = type;
        areaMarkerState.rect = null;
        areaMarkerState.selection.classList.remove('is-active');
        areaMarkerState.confirmBtn.disabled = true;
        areaMarkerState.centerBtn.disabled = true;

        // 设置标题
        var title = type === 'cover' ? '标记标题区域' : '标记正文区域';
        document.getElementById('areaMarkerTitle').textContent = title;

        // 绘制图片到 canvas
        var img = type === 'cover' ? state.coverTemplate : state.bgTemplate;
        if (!img) return;

        // 计算缩放后的尺寸，使图片适应屏幕
        var maxWidth = window.innerWidth * 0.8;
        var maxHeight = window.innerHeight * 0.6;
        var scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        areaMarkerState.scale = scale;

        areaMarkerState.canvas.width = img.width * scale;
        areaMarkerState.canvas.height = img.height * scale;
        areaMarkerState.ctx.drawImage(img, 0, 0, areaMarkerState.canvas.width, areaMarkerState.canvas.height);

        areaMarkerState.modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeAreaMarker() {
        areaMarkerState.modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    function confirmAreaMarker() {
        if (!areaMarkerState.rect) return;

        var r = areaMarkerState.rect;
        var scale = areaMarkerState.scale;
        var img = areaMarkerState.type === 'cover' ? state.coverTemplate : state.bgTemplate;

        // 转换为相对于原图的比例值
        var area = {
            x: r.x / scale / img.width,
            y: r.y / scale / img.height,
            width: r.width / scale / img.width,
            height: r.height / scale / img.height
        };

        if (areaMarkerState.type === 'cover') {
            state.coverArea = area;
            updateMarkButtonState('cover', true);
            Storage.save('xhs_cover_area', area);
        } else {
            state.bgArea = area;
            updateMarkButtonState('bg', true);
            Storage.save('xhs_bg_area', area);
        }

        closeAreaMarker();
    }

    // 全屏预览相关
    var fullscreenState = {
        currentIndex: 0,
        modal: null,
        img: null,
        info: null
    };

    function initFullscreen() {
        fullscreenState.modal = document.getElementById('fullscreenModal');
        fullscreenState.img = document.getElementById('fullscreenImg');
        fullscreenState.info = document.getElementById('fullscreenInfo');

        // 关闭按钮
        document.getElementById('fullscreenClose').addEventListener('click', closeFullscreen);

        // 背景点击关闭
        document.querySelector('.fullscreen-backdrop').addEventListener('click', closeFullscreen);

        // 上一张/下一张
        document.getElementById('fullscreenPrev').addEventListener('click', function(e) {
            e.stopPropagation();
            showPrevImage();
        });
        document.getElementById('fullscreenNext').addEventListener('click', function(e) {
            e.stopPropagation();
            showNextImage();
        });

        // 键盘导航
        document.addEventListener('keydown', function(e) {
            if (!fullscreenState.modal.classList.contains('is-open')) return;
            if (e.key === 'Escape') closeFullscreen();
            if (e.key === 'ArrowLeft') showPrevImage();
            if (e.key === 'ArrowRight') showNextImage();
        });
    }

    function openFullscreen(index) {
        fullscreenState.currentIndex = index;
        updateFullscreenImage();
        fullscreenState.modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeFullscreen() {
        fullscreenState.modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    function updateFullscreenImage() {
        var img = state.generatedImages[fullscreenState.currentIndex];
        fullscreenState.img.src = img.data;
        fullscreenState.info.textContent = (fullscreenState.currentIndex + 1) + ' / ' + state.generatedImages.length;
    }

    function showPrevImage() {
        if (state.generatedImages.length <= 1) return;
        fullscreenState.currentIndex = (fullscreenState.currentIndex - 1 + state.generatedImages.length) % state.generatedImages.length;
        updateFullscreenImage();
    }

    function showNextImage() {
        if (state.generatedImages.length <= 1) return;
        fullscreenState.currentIndex = (fullscreenState.currentIndex + 1) % state.generatedImages.length;
        updateFullscreenImage();
    }

    // 更新复制区域
    function updateCopySection() {
        elements.copySection.style.display = 'block';

        // 标题
        var title = elements.xhsTitle.value.trim() || elements.coverTitle.value.trim() || '-';
        elements.copyTitle.textContent = title;

        // 正文描述
        var desc = elements.xhsDesc.value.trim() || '-';
        elements.copyDesc.textContent = desc;
    }

    // 下载单张图片
    function downloadImage(img) {
        var link = document.createElement('a');
        link.download = img.name + '.png';
        link.href = img.data;
        link.click();
    }

    // 下载全部图片
    function downloadAllImages() {
        state.generatedImages.forEach(function(img, index) {
            setTimeout(function() {
                downloadImage(img);
            }, index * 300); // 间隔下载，避免浏览器阻止
        });
    }

    // 复制到剪贴板
    function copyToClipboard(targetId, btn) {
        var content = document.getElementById(targetId).textContent;
        if (content === '-') return;

        navigator.clipboard.writeText(content).then(function() {
            btn.classList.add('copied');
            var icon = btn.querySelector('i');
            icon.className = 'ri-check-line';

            setTimeout(function() {
                btn.classList.remove('copied');
                icon.className = 'ri-file-copy-line';
            }, 2000);
        });
    }

    // 启动
    init();
})();

// 新手引导
(function() {
    'use strict';
    
    // 页面加载完成后显示引导（从Supabase加载配置）
    if (typeof window.ToolsGuide !== 'undefined') {
        setTimeout(function() {
            window.ToolsGuide.show('xiaohongshu');
        }, 300);
    }
})();
