// 毛毛的产品助理 - 主逻辑

(function() {
  // 配置
  var CONFIG = {
    SUPABASE_URL: 'https://aexcnubowsarpxkohqvv.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleGNudWJvd3NhcnB4a29ocXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjYyOTksImV4cCI6MjA3OTgwMjI5OX0.TCGkoBou99fui-cgcpod-b3BaSdq1mg7SFUtR2mIxms',
    AI_API_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    AI_API_KEY: 'sk-b83669be3e4b41ec8379bd80fe6c657f',
    AI_MODEL: 'qwen-plus'
  };

  // 状态
  var state = {
    supabase: null,
    currentConversationId: null,
    products: [],
    competitors: [],
    messages: []
  };

  // 初始化
  function init() {
    if (window.supabase) {
      state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    }
    loadLocalData();
    bindEvents();
    loadConversations();
  }

  // 加载本地数据
  function loadLocalData() {
    try {
      state.products = JSON.parse(localStorage.getItem('pa_products') || '[]');
      state.competitors = JSON.parse(localStorage.getItem('pa_competitors') || '[]');
    } catch (e) {
      state.products = [];
      state.competitors = [];
    }
  }

  // 保存本地数据
  function saveLocalData() {
    localStorage.setItem('pa_products', JSON.stringify(state.products));
    localStorage.setItem('pa_competitors', JSON.stringify(state.competitors));
  }

  // 绑定事件
  function bindEvents() {
    // 发送消息
    var sendBtn = document.getElementById('sendBtn');
    var userInput = document.getElementById('userInput');
    if (sendBtn) {
      sendBtn.addEventListener('click', handleSend);
    }
    if (userInput) {
      userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
    }

    // 新建对话
    var newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', handleNewChat);
    }

    // 对话选择
    var conversationSelect = document.getElementById('conversationSelect');
    if (conversationSelect) {
      conversationSelect.addEventListener('change', handleConversationChange);
    }

    // 设置弹窗
    var settingsBtn = document.getElementById('settingsBtn');
    var settingsModal = document.getElementById('settingsModal');
    var settingsClose = document.getElementById('settingsClose');
    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener('click', function() {
        settingsModal.classList.add('is-active');
        renderSettingsList();
      });
    }
    if (settingsClose && settingsModal) {
      settingsClose.addEventListener('click', function() {
        settingsModal.classList.remove('is-active');
      });
    }
    if (settingsModal) {
      settingsModal.querySelector('.pa-modal-overlay').addEventListener('click', function() {
        settingsModal.classList.remove('is-active');
      });
    }

    // 添加产品/竞品
    var addProductBtn = document.getElementById('addProductBtn');
    var addCompetitorBtn = document.getElementById('addCompetitorBtn');
    if (addProductBtn) {
      addProductBtn.addEventListener('click', function() { openAddItemModal('product'); });
    }
    if (addCompetitorBtn) {
      addCompetitorBtn.addEventListener('click', function() { openAddItemModal('competitor'); });
    }

    // 添加弹窗
    var addItemModal = document.getElementById('addItemModal');
    var addItemClose = document.getElementById('addItemClose');
    var addItemCancel = document.getElementById('addItemCancel');
    var addItemConfirm = document.getElementById('addItemConfirm');
    if (addItemClose) {
      addItemClose.addEventListener('click', function() { addItemModal.classList.remove('is-active'); });
    }
    if (addItemCancel) {
      addItemCancel.addEventListener('click', function() { addItemModal.classList.remove('is-active'); });
    }
    if (addItemConfirm) {
      addItemConfirm.addEventListener('click', handleAddItemConfirm);
    }
    if (addItemModal) {
      addItemModal.querySelector('.pa-modal-overlay').addEventListener('click', function() {
        addItemModal.classList.remove('is-active');
      });
    }

    // 下载PNG
    var downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', handleDownload);
    }
  }

  // 加载对话列表
  async function loadConversations() {
    if (!state.supabase) return;
    try {
      var { data, error } = await state.supabase
        .from('tools_conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (data && data.length > 0) {
        renderConversationSelect(data);
      }
    } catch (e) {}
  }

  // 渲染对话选择框
  function renderConversationSelect(conversations) {
    var select = document.getElementById('conversationSelect');
    if (!select) return;
    select.innerHTML = '<option value="">选择对话...</option>';
    conversations.forEach(function(conv) {
      var option = document.createElement('option');
      option.value = conv.id;
      option.textContent = conv.title || '未命名对话';
      select.appendChild(option);
    });
  }

  // 新建对话
  async function handleNewChat() {
    state.currentConversationId = null;
    state.messages = [];
    renderMessages();
    clearPreview();
    var select = document.getElementById('conversationSelect');
    if (select) select.value = '';
  }

  // 切换对话
  async function handleConversationChange(e) {
    var conversationId = e.target.value;
    if (!conversationId) {
      handleNewChat();
      return;
    }
    state.currentConversationId = conversationId;
    await loadMessages(conversationId);
  }

  // 加载消息
  async function loadMessages(conversationId) {
    if (!state.supabase) return;
    try {
      var { data, error } = await state.supabase
        .from('tools_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (data) {
        state.messages = data;
        renderMessages();
        // 显示最后一个原型
        var lastPrototype = data.filter(function(m) { return m.prototype_html; }).pop();
        if (lastPrototype) {
          renderPreview(lastPrototype.prototype_html);
        }
      }
    } catch (e) {}
  }

  // 发送消息
  async function handleSend() {
    var input = document.getElementById('userInput');
    var content = input.value.trim();
    if (!content) return;

    input.value = '';
    input.disabled = true;
    document.getElementById('sendBtn').disabled = true;

    // 如果没有当前对话，先创建
    if (!state.currentConversationId) {
      await createConversation(content.substring(0, 50));
    }

    // 添加用户消息
    var userMsg = { role: 'user', content: content };
    state.messages.push(userMsg);
    renderMessages();

    // 保存用户消息
    await saveMessage(userMsg);

    // 调用AI
    try {
      var aiResponse = await callAI(content);
      var assistantMsg = { role: 'assistant', content: aiResponse.text, prototype_html: aiResponse.html };
      state.messages.push(assistantMsg);
      renderMessages();
      await saveMessage(assistantMsg);

      if (aiResponse.html) {
        renderPreview(aiResponse.html);
        document.getElementById('downloadBtn').disabled = false;
      }
    } catch (e) {
      var errorMsg = { role: 'assistant', content: '抱歉，出现了错误：' + e.message };
      state.messages.push(errorMsg);
      renderMessages();
    }

    input.disabled = false;
    document.getElementById('sendBtn').disabled = false;
    input.focus();
  }

  // 创建对话
  async function createConversation(title) {
    if (!state.supabase) return;
    try {
      var { data, error } = await state.supabase
        .from('tools_conversations')
        .insert([{ title: title }])
        .select()
        .single();
      if (data) {
        state.currentConversationId = data.id;
        loadConversations();
      }
    } catch (e) {}
  }

  // 保存消息
  async function saveMessage(msg) {
    if (!state.supabase || !state.currentConversationId) return;
    try {
      await state.supabase
        .from('tools_messages')
        .insert([{
          conversation_id: state.currentConversationId,
          role: msg.role,
          content: msg.content,
          prototype_html: msg.prototype_html || null
        }]);
      // 更新对话时间
      await state.supabase
        .from('tools_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', state.currentConversationId);
    } catch (e) {}
  }

  // 调用AI
  async function callAI(userContent) {
    var systemPrompt = buildSystemPrompt();
    var messages = [
      { role: 'system', content: systemPrompt }
    ];
    // 添加历史消息（最近10条）
    var history = state.messages.slice(-10);
    history.forEach(function(m) {
      messages.push({ role: m.role, content: m.content });
    });
    messages.push({ role: 'user', content: userContent });

    var response = await fetch(CONFIG.AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.AI_API_KEY
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
    var aiContent = data.choices[0].message.content;

    // 解析回复，提取HTML
    var result = parseAIResponse(aiContent);
    return result;
  }

  // 构建系统提示
  function buildSystemPrompt() {
    var prompt = '你是毛毛的产品助理，帮助生成产品原型图。\n\n';
    prompt += '规则：\n';
    prompt += '1. 用户描述需求后，你需要生成对应的HTML原型代码\n';
    prompt += '2. 原型代码用 ```html 和 ``` 包裹\n';
    prompt += '3. 原型应该是完整的、可预览的HTML，包含内联CSS\n';
    prompt += '4. 使用现代简洁的设计风格，主色调蓝色(#2563eb)\n';
    prompt += '5. 先简要说明设计思路，再给出代码\n\n';

    if (state.products.length > 0) {
      prompt += '用户的产品：\n';
      state.products.forEach(function(p) {
        prompt += '- ' + p.name + ': ' + p.url + '\n';
      });
      prompt += '\n';
    }

    if (state.competitors.length > 0) {
      prompt += '竞品参考：\n';
      state.competitors.forEach(function(c) {
        prompt += '- ' + c.name + ': ' + c.url + '\n';
      });
    }

    return prompt;
  }

  // 解析AI回复
  function parseAIResponse(content) {
    var htmlMatch = content.match(/```html\s*([\s\S]*?)```/);
    var html = htmlMatch ? htmlMatch[1].trim() : null;
    var text = content.replace(/```html[\s\S]*?```/g, '').trim();
    return { text: text, html: html };
  }

  // 渲染消息列表
  function renderMessages() {
    var container = document.getElementById('messageList');
    if (!container) return;

    if (state.messages.length === 0) {
      container.innerHTML = '<div class="pa-welcome"><i class="ri-robot-line"></i><h3>毛毛的产品助理</h3><p>描述你的需求，我帮你生成原型图</p></div>';
      return;
    }

    container.innerHTML = '';
    state.messages.forEach(function(msg) {
      var div = document.createElement('div');
      div.className = 'pa-message pa-message--' + msg.role;
      div.innerHTML = '<div class="pa-message-avatar"><i class="' + (msg.role === 'user' ? 'ri-user-line' : 'ri-robot-line') + '"></i></div>' +
        '<div class="pa-message-content">' + escapeHtml(msg.content) + '</div>';
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  }

  // 渲染预览
  function renderPreview(html) {
    var container = document.getElementById('previewContent');
    if (!container) return;
    container.innerHTML = html;
  }

  // 清空预览
  function clearPreview() {
    var container = document.getElementById('previewContent');
    if (!container) return;
    container.innerHTML = '<div class="pa-preview-empty"><i class="ri-layout-line"></i><p>原型将在这里显示</p></div>';
    document.getElementById('downloadBtn').disabled = true;
  }

  // 下载PNG
  async function handleDownload() {
    var container = document.getElementById('previewContent');
    if (!container || !window.html2canvas) return;
    try {
      var canvas = await html2canvas(container, { backgroundColor: '#ffffff' });
      var link = document.createElement('a');
      link.download = 'prototype-' + Date.now() + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      alert('下载失败：' + e.message);
    }
  }

  // 打开添加弹窗
  var currentAddType = 'product';
  function openAddItemModal(type) {
    currentAddType = type;
    var modal = document.getElementById('addItemModal');
    var title = document.getElementById('addItemTitle');
    if (title) {
      title.textContent = type === 'product' ? '添加产品' : '添加竞品';
    }
    document.getElementById('itemName').value = '';
    document.getElementById('itemUrl').value = '';
    document.getElementById('itemToken').value = '';
    modal.classList.add('is-active');
  }

  // 确认添加
  function handleAddItemConfirm() {
    var name = document.getElementById('itemName').value.trim();
    var url = document.getElementById('itemUrl').value.trim();
    var token = document.getElementById('itemToken').value.trim();
    if (!name || !url) {
      alert('请填写名称和网址');
      return;
    }
    var item = { id: Date.now().toString(), name: name, url: url, token: token };
    if (currentAddType === 'product') {
      state.products.push(item);
    } else {
      state.competitors.push(item);
    }
    saveLocalData();
    renderSettingsList();
    document.getElementById('addItemModal').classList.remove('is-active');
  }

  // 渲染设置列表
  function renderSettingsList() {
    renderItemList('productList', state.products, 'product');
    renderItemList('competitorList', state.competitors, 'competitor');
  }

  function renderItemList(containerId, items, type) {
    var container = document.getElementById(containerId);
    if (!container) return;
    if (items.length === 0) {
      container.innerHTML = '<div class="pa-settings-empty">暂无' + (type === 'product' ? '产品' : '竞品') + '</div>';
      return;
    }
    container.innerHTML = '';
    items.forEach(function(item) {
      var div = document.createElement('div');
      div.className = 'pa-settings-item';
      div.innerHTML = '<div class="pa-settings-item-info"><div class="pa-settings-item-name">' + escapeHtml(item.name) + '</div><div class="pa-settings-item-url">' + escapeHtml(item.url) + '</div></div>' +
        '<div class="pa-settings-item-actions"><button class="pa-settings-item-btn pa-settings-item-btn--delete" data-id="' + item.id + '" data-type="' + type + '"><i class="ri-delete-bin-line"></i></button></div>';
      container.appendChild(div);
    });
    // 绑定删除事件
    container.querySelectorAll('.pa-settings-item-btn--delete').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var t = this.getAttribute('data-type');
        if (t === 'product') {
          state.products = state.products.filter(function(p) { return p.id !== id; });
        } else {
          state.competitors = state.competitors.filter(function(c) { return c.id !== id; });
        }
        saveLocalData();
        renderSettingsList();
      });
    });
  }

  // HTML转义
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
