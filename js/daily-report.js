// 报告小助手 - 主逻辑

(function() {
  var CONFIG = {
    // AI API 代理
    AI_API_URL: 'https://ai-api.leo-maomao.workers.dev/report',
    AI_MODEL: 'qwen-plus',
    // Supabase 配置
    SUPABASE_URL: 'https://aexcnubowsarpxkohqvv.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleGNudWJvd3NhcnB4a29ocXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjYyOTksImV4cCI6MjA3OTgwMjI5OX0.TCGkoBou99fui-cgcpod-b3BaSdq1mg7SFUtR2mIxms'
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
    currentOutput: ''
  };

  function init() {
    bindEvents();
    updateTemplateOptions();
  }

  function bindEvents() {
    var generateBtn = document.getElementById('generateBtn');
    var copyBtn = document.getElementById('copyBtn');

    if (generateBtn) {
      generateBtn.addEventListener('click', handleGenerate);
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', handleCopy);
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

    var response = await fetch(CONFIG.AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CONFIG.AI_MODEL,
        messages: messages
      })
    });

    if (!response.ok) {
      throw new Error('AI 请求失败');
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
})();
