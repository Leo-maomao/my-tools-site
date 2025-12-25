// 报告小助手 - 主逻辑

(function() {
  var CONFIG = {
    // Supabase 配置
    SUPABASE_URL: 'https://aexcnubowsarpxkohqvv.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleGNudWJvd3NhcnB4a29ocXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjYyOTksImV4cCI6MjA3OTgwMjI5OX0.TCGkoBou99fui-cgcpod-b3BaSdq1mg7SFUtR2mIxms'
  };

  // 各厂商支持的模型列表
  var PROVIDER_MODELS = {
    openai: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
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
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
    ],
    deepseek: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' }
    ],
    moonshot: [
      { id: 'moonshot-v1-8k', name: 'Moonshot 8K' },
      { id: 'moonshot-v1-32k', name: 'Moonshot 32K' },
      { id: 'moonshot-v1-128k', name: 'Moonshot 128K' }
    ],
    zhipu: [
      { id: 'glm-4', name: 'GLM-4' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash' },
      { id: 'glm-3-turbo', name: 'GLM-3 Turbo' }
    ],
    minimax: [
      { id: 'abab6.5s-chat', name: 'MiniMax 6.5s' },
      { id: 'abab5.5-chat', name: 'MiniMax 5.5' }
    ],
    baichuan: [
      { id: 'Baichuan2-Turbo', name: 'Baichuan2 Turbo' },
      { id: 'Baichuan2-Turbo-192k', name: 'Baichuan2 192K' }
    ]
  };

  // 报告类型配置
  var REPORT_TYPES = {
    daily: {
      name: '日报',
      period: '今天',
      templates: ['simple', 'detailed', 'standup', 'okr'],
      dateFormat: function() {
        var d = new Date();
        return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
      }
    },
    weekly: {
      name: '周报',
      period: '本周',
      templates: ['simple', 'detailed', 'okr', 'summary'],
      dateFormat: function() {
        var d = new Date();
        var weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay() + 1);
        var weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return (weekStart.getMonth() + 1) + '月' + weekStart.getDate() + '日 - ' + (weekEnd.getMonth() + 1) + '月' + weekEnd.getDate() + '日';
      }
    },
    quarterly: {
      name: '季报',
      period: '本季度',
      templates: ['summary', 'detailed', 'okr', 'review'],
      dateFormat: function() {
        var d = new Date();
        var quarter = Math.floor(d.getMonth() / 3) + 1;
        return d.getFullYear() + '年第' + quarter + '季度';
      }
    },
    semiannual: {
      name: '半年报',
      period: '本半年',
      templates: ['summary', 'detailed', 'okr', 'review'],
      dateFormat: function() {
        var d = new Date();
        var half = d.getMonth() < 6 ? '上' : '下';
        return d.getFullYear() + '年' + half + '半年';
      }
    },
    annual: {
      name: '年报',
      period: '全年',
      templates: ['summary', 'detailed', 'okr', 'review'],
      dateFormat: function() {
        return new Date().getFullYear() + '年度';
      }
    }
  };

  // 报告模板配置
  var TEMPLATES = {
    simple: {
      name: '简洁版',
      prompt: '请将用户的工作内容整理成简洁的{reportType}格式。要求：\n1. 使用简单的列表形式\n2. 每条工作内容精简到一句话\n3. 突出完成的成果\n4. 整体简洁明了'
    },
    detailed: {
      name: '详细版',
      prompt: '请将用户的工作内容整理成详细的{reportType}格式。要求：\n1. 分为「已完成」「进行中」「下阶段计划」三个部分\n2. 每个工作项目包含：任务描述、完成进度、遇到的问题（如有）\n3. 适当补充工作细节，让内容更充实\n4. 结尾加上简短的工作总结'
    },
    okr: {
      name: 'OKR版',
      prompt: '请将用户的工作内容整理成OKR风格的{reportType}格式。要求：\n1. 将工作内容关联到目标(Objective)和关键结果(Key Results)\n2. 标注每项工作对KR的贡献度或进度\n3. 突出数据和成果指标\n4. 格式清晰，便于汇总'
    },
    standup: {
      name: '站会版',
      prompt: '请将用户的工作内容整理成站会汇报格式的{reportType}。要求：\n1. 分为三部分：做了什么、接下来要做什么、有什么阻碍\n2. 每部分控制在3-5条\n3. 语言简洁直接，适合口头汇报\n4. 突出进度和风险点'
    },
    summary: {
      name: '总结版',
      prompt: '请将用户的工作内容整理成工作总结格式的{reportType}。要求：\n1. 分为「重点工作回顾」「成果与亮点」「问题与改进」「下阶段计划」四个部分\n2. 突出关键成果和数据指标\n3. 总结经验教训\n4. 适合向上级汇报'
    },
    review: {
      name: '复盘版',
      prompt: '请将用户的工作内容整理成复盘格式的{reportType}。要求：\n1. 使用复盘四步法：目标回顾、结果评估、原因分析、经验总结\n2. 对比目标与实际完成情况\n3. 深入分析成功和失败的原因\n4. 提炼可复用的方法论和改进措施'
    }
  };

  // 输出格式配置
  var FORMATS = {
    text: {
      name: '纯文本',
      instruction: '请使用纯文本格式输出，不要使用任何Markdown语法。使用普通的数字编号和缩进来组织层级。'
    },
    markdown: {
      name: 'Markdown',
      instruction: '请使用Markdown格式输出，包括标题(#)、列表(-)、粗体(**)等格式。'
    },
    html: {
      name: '富文本',
      instruction: '请使用简单的HTML格式输出，包括<h3>标题、<ul><li>列表、<strong>粗体等标签，不需要完整的HTML文档结构。'
    }
  };

  var state = {
    isGenerating: false,
    currentOutput: '',
    selectedModel: null,
    allModels: []
  };

  function init() {
    bindEvents();
    updateTemplateOptions();
    loadModels();
    
    // 初始化全局 UI 组件
    if (window.UI && window.UI.Select) {
      window.UI.Select.init(document.querySelector('.dr-main'));
    }
    
    // 监听 API 配置更新事件
    window.addEventListener('apiConfigUpdated', function() {
      loadModels();
    });
  }
  
  // 加载所有可用模型（异步获取）
  async function loadModels() {
    if (!window.ToolsAPIConfig) {
      state.allModels = [];
      renderModelSelect();
      return;
    }
    
    // 显示加载状态
    var select = document.getElementById('modelSelect');
    if (select) {
      select.innerHTML = '<option value="">加载模型中...</option>';
      if (window.UI && window.UI.Select) {
        window.UI.Select.refresh(select);
      }
    }
    
    var configs = window.ToolsAPIConfig.loadAllConfigs();
    var providers = window.ToolsAPIConfig.getAllProviders();
    var models = [];
    var providerIds = Object.keys(configs);
    
    // 动态获取模型列表
    for (var i = 0; i < providerIds.length; i++) {
      var providerId = providerIds[i];
      var config = configs[providerId];
      var providerInfo = providers[providerId];
      
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
              id: providerId + ':' + model.id,
              name: model.name,
              providerId: providerId,
              providerName: providerInfo ? providerInfo.name : providerId,
              modelId: model.id
            });
          });
        } catch (error) {
          console.warn('获取 ' + providerId + ' 模型列表失败:', error.message);
          // 回退到备用列表
          var fallbackModels = PROVIDER_MODELS[providerId] || [];
          fallbackModels.forEach(function(model) {
            models.push({
              id: providerId + ':' + model.id,
              name: model.name + ' (离线)',
              providerId: providerId,
              providerName: providerInfo ? providerInfo.name : providerId,
              modelId: model.id
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
    var select = document.getElementById('modelSelect');
    if (!select) return;
    
    if (state.allModels.length === 0) {
      // 没有配置 API 时，显示提示
      select.innerHTML = '<option value="">请先在设置中配置API</option>';
    } else {
      // 有可用模型时，显示选择提示
      select.innerHTML = '<option value="">选择模型</option>';
      // 按提供商分组
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
          option.value = model.id;
          option.textContent = model.name;
          optgroup.appendChild(option);
        });
        
        select.appendChild(optgroup);
      });
    }
    
    // 默认不选择任何模型
    select.value = '';
    state.selectedModel = null;
    
    // 刷新 UI.Select 组件
    if (window.UI && window.UI.Select) {
      window.UI.Select.refresh(select);
    }
  }
  
  // 更新选中的模型
  function updateSelectedModel(value) {
    if (!value) {
      state.selectedModel = null;
      return;
    }
    
    var model = state.allModels.find(function(m) {
      return m.id === value;
    });
    
    state.selectedModel = model || null;
  }

  function bindEvents() {
    var generateBtn = document.getElementById('generateBtn');
    var copyBtn = document.getElementById('copyBtn');
    var modelSelect = document.getElementById('modelSelect');

    if (generateBtn) {
      generateBtn.addEventListener('click', handleGenerate);
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', handleCopy);
    }
    
    // 模型选择监听
    if (modelSelect) {
      modelSelect.addEventListener('change', function() {
        updateSelectedModel(modelSelect.value);
      });
    }

    // 快捷键：Ctrl/Cmd + Enter 生成
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    });

    // 报告类型切换时更新模板选项
    var reportTypeSelect = document.getElementById('reportTypeSelect');
    if (reportTypeSelect) {
      reportTypeSelect.addEventListener('change', updateTemplateOptions);
    }
  }

  function updateTemplateOptions() {
    var reportTypeSelect = document.getElementById('reportTypeSelect');
    var templateSelect = document.getElementById('templateSelect');
    if (!reportTypeSelect || !templateSelect) return;

    var reportTypeKey = reportTypeSelect.value;
    var reportType = REPORT_TYPES[reportTypeKey] || REPORT_TYPES.daily;
    var availableTemplates = reportType.templates || ['simple', 'detailed'];

    // 保存当前选中值
    var currentValue = templateSelect.value;

    // 清空并重新填充选项
    templateSelect.innerHTML = '';
    availableTemplates.forEach(function(key) {
      var template = TEMPLATES[key];
      if (template) {
        var option = document.createElement('option');
        option.value = key;
        option.textContent = template.name;
        templateSelect.appendChild(option);
      }
    });

    // 如果之前选中的值仍然可用，保持选中
    if (availableTemplates.indexOf(currentValue) !== -1) {
      templateSelect.value = currentValue;
    }
  }

  async function handleGenerate() {
    if (state.isGenerating) return;
    
    // 检查是否选择了模型
    if (!state.selectedModel) {
      showToast('请先选择 AI 模型', 'error');
      var modelSelect = document.getElementById('modelSelect');
      if (modelSelect) modelSelect.focus();
      return;
    }

    var workContent = document.getElementById('workContent').value.trim();
    if (!workContent) {
      showToast('请先填写工作内容', 'error');
      return;
    }

    var reportTypeKey = document.getElementById('reportTypeSelect').value;
    var templateKey = document.getElementById('templateSelect').value;
    var formatKey = document.getElementById('formatSelect').value;

    var reportType = REPORT_TYPES[reportTypeKey] || REPORT_TYPES.daily;

    state.isGenerating = true;
    updateUI('loading', null, null, reportType.name);

    try {
      var result = await callAI(workContent, reportTypeKey, templateKey, formatKey);
      state.currentOutput = result;
      updateUI('success', result, formatKey, reportType.name);
      showToast(reportType.name + '生成成功');
      
      // 保存到云端（如果已登录）
      await saveReportToCloud(workContent, reportTypeKey, templateKey, formatKey, result);
    } catch (e) {
      updateUI('error', '生成失败：' + e.message, null, reportType.name);
      showToast('生成失败，请重试', 'error');
    }

    state.isGenerating = false;
  }
  
  // 保存报告到云端
  async function saveReportToCloud(workContent, reportTypeKey, templateKey, formatKey, result) {
    // 只有已登录时才保存
    if (!window.toolsSupabase || !window.ToolsAuth) return;
    
    try {
      var isLoggedIn = await window.ToolsAuth.isLoggedIn();
      if (!isLoggedIn) return;
      
      var reportType = REPORT_TYPES[reportTypeKey] || REPORT_TYPES.daily;
      
      // 保存到数据库
      await window.toolsSupabase
        .from('tools_report_history')
        .insert({
          report_type: reportType.name,
          template: TEMPLATES[templateKey].name,
          output_format: FORMATS[formatKey].name,
          content: result,
          markdown_content: formatKey === 'markdown' ? result : null
        });
    } catch (e) {
      // 静默失败，不影响用户体验
    }
  }

  async function callAI(workContent, reportTypeKey, templateKey, formatKey) {
    // 获取当前选中模型的配置
    if (!state.selectedModel || !window.ToolsAPIConfig) {
      throw new Error('未选择模型或配置不可用');
    }
    
    var activeConfig = window.ToolsAPIConfig.getConfig(state.selectedModel.providerId);
    if (!activeConfig || !activeConfig.apiKey) {
      throw new Error('API 配置不完整');
    }
    
    var reportType = REPORT_TYPES[reportTypeKey] || REPORT_TYPES.daily;
    var template = TEMPLATES[templateKey] || TEMPLATES.simple;
    var format = FORMATS[formatKey] || FORMATS.text;

    var dateStr = reportType.dateFormat();
    var weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var weekday = weekdays[new Date().getDay()];

    var templatePrompt = template.prompt.replace(/{reportType}/g, reportType.name);

    var systemPrompt = '你是一个专业的工作报告生成助手，帮助用户将零散的工作内容整理成规范的' + reportType.name + '。\n\n';
    systemPrompt += '报告周期：' + dateStr + (reportTypeKey === 'daily' ? ' ' + weekday : '') + '\n\n';
    systemPrompt += '【模板要求】\n' + templatePrompt + '\n\n';
    systemPrompt += '【格式要求】\n' + format.instruction + '\n\n';
    systemPrompt += '【注意事项】\n';
    systemPrompt += '1. 保持专业、客观的语气\n';
    systemPrompt += '2. 不要虚构用户没有提到的工作内容\n';
    systemPrompt += '3. 可以适当润色表达，但不改变原意\n';
    systemPrompt += '4. 报告开头标注日期/周期';

    var messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '我' + reportType.period + '的工作内容：\n\n' + workContent }
    ];

    var providerInfo = window.ToolsAPIConfig.getProviderInfo(state.selectedModel.providerId);
    var apiUrl = activeConfig.baseUrl || (providerInfo ? providerInfo.endpoint : '');
    if (!apiUrl) {
      throw new Error('API 地址配置不正确');
    }
    
    // 确保 URL 以 /chat/completions 结尾
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
        messages: messages
      })
    });

    if (!response.ok) {
      var errorText = await response.text();
      throw new Error('AI 请求失败: ' + response.status);
    }

    var data = await response.json();
    return data.choices[0].message.content;
  }

  function updateUI(status, content, formatKey, reportTypeName) {
    var outputEl = document.getElementById('outputContent');
    var copyBtn = document.getElementById('copyBtn');
    var generateBtn = document.getElementById('generateBtn');
    var outputTip = document.getElementById('outputTip');

    if (status === 'loading') {
      outputEl.innerHTML = '<div class="dr-loading"><div class="dr-loading-spinner"></div><span>正在生成' + reportTypeName + '...</span></div>';
      outputEl.classList.remove('has-content');
      outputEl.contentEditable = 'false';
      if (outputTip) outputTip.style.display = 'none';
      copyBtn.disabled = true;
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<i class="ri-loader-4-line"></i><span>生成中...</span>';
    } else if (status === 'success') {
      if (formatKey === 'html') {
        outputEl.innerHTML = content;
      } else if (formatKey === 'markdown') {
        // 使用 marked 渲染 Markdown
        if (window.marked) {
          outputEl.innerHTML = marked.parse(content);
        } else {
          outputEl.textContent = content;
        }
      } else {
        outputEl.textContent = content;
      }
      outputEl.classList.add('has-content');
      outputEl.contentEditable = 'true';
      if (outputTip) outputTip.style.display = 'flex';
      copyBtn.disabled = false;
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="ri-magic-line"></i><span>生成报告</span>';
    } else if (status === 'error') {
      outputEl.innerHTML = '<div class="dr-output-empty"><i class="ri-error-warning-line"></i><p>' + escapeHtml(content) + '</p></div>';
      outputEl.classList.remove('has-content');
      outputEl.contentEditable = 'false';
      if (outputTip) outputTip.style.display = 'none';
      copyBtn.disabled = true;
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="ri-magic-line"></i><span>生成报告</span>';
    }
  }

  function handleCopy() {
    var outputEl = document.getElementById('outputContent');
    // 复制编辑后的内容（纯文本）
    var content = outputEl.innerText || outputEl.textContent || '';
    if (!content.trim()) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(function() {
        showToast('已复制到剪贴板', 'success');
      }).catch(function() {
        fallbackCopy(content);
      });
    } else {
      fallbackCopy(content);
    }
  }

  function fallbackCopy(content) {
    var textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('已复制到剪贴板', 'success');
    } catch (e) {
      showToast('复制失败，请手动复制', 'error');
    }
    document.body.removeChild(textarea);
  }

  function showToast(message, type) {
    var toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'dr-toast';
    if (type) {
      toast.classList.add('is-' + type);
    }
    toast.classList.add('is-visible');

    setTimeout(function() {
      toast.classList.remove('is-visible');
    }, 2500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // 页面加载完成后显示引导（从Supabase加载配置）
  if (typeof window.ToolsGuide !== 'undefined') {
    setTimeout(function() {
      window.ToolsGuide.show('daily-report');
    }, 300);
  }
})();
