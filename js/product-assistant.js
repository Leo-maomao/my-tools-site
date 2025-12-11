// 毛毛的产品助理 - 主逻辑

(function() {
  var CONFIG = {
    SUPABASE_URL: 'https://aexcnubowsarpxkohqvv.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleGNudWJvd3NhcnB4a29ocXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjYyOTksImV4cCI6MjA3OTgwMjI5OX0.TCGkoBou99fui-cgcpod-b3BaSdq1mg7SFUtR2mIxms',
    AI_API_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    AI_API_KEY: 'sk-b83669be3e4b41ec8379bd80fe6c657f',
    AI_MODEL: 'qwen-plus'
  };

  var state = {
    supabase: null,
    currentConversationId: null,
    conversations: [],
    products: [],
    competitors: [],
    messages: []
  };

  function init() {
    if (window.supabase) {
      state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    }
    loadLocalData();
    bindEvents();
    loadConversations();
  }

  function loadLocalData() {
    try {
      state.products = JSON.parse(localStorage.getItem('pa_products') || '[]');
      state.competitors = JSON.parse(localStorage.getItem('pa_competitors') || '[]');
    } catch (e) {
      state.products = [];
      state.competitors = [];
    }
  }

  function saveLocalData() {
    localStorage.setItem('pa_products', JSON.stringify(state.products));
    localStorage.setItem('pa_competitors', JSON.stringify(state.competitors));
  }

  function bindEvents() {
    var sendBtn = document.getElementById('sendBtn');
    var userInput = document.getElementById('userInput');
    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (userInput) {
      userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
    }

    var newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) newChatBtn.addEventListener('click', handleNewChat);

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

    var addProductBtn = document.getElementById('addProductBtn');
    var addCompetitorBtn = document.getElementById('addCompetitorBtn');
    if (addProductBtn) addProductBtn.addEventListener('click', function() { openAddItemModal('product'); });
    if (addCompetitorBtn) addCompetitorBtn.addEventListener('click', function() { openAddItemModal('competitor'); });

    var addItemModal = document.getElementById('addItemModal');
    var addItemClose = document.getElementById('addItemClose');
    var addItemCancel = document.getElementById('addItemCancel');
    var addItemConfirm = document.getElementById('addItemConfirm');
    if (addItemClose) addItemClose.addEventListener('click', function() { addItemModal.classList.remove('is-active'); });
    if (addItemCancel) addItemCancel.addEventListener('click', function() { addItemModal.classList.remove('is-active'); });
    if (addItemConfirm) addItemConfirm.addEventListener('click', handleAddItemConfirm);
    if (addItemModal) {
      addItemModal.querySelector('.pa-modal-overlay').addEventListener('click', function() {
        addItemModal.classList.remove('is-active');
      });
    }

    var downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', handleDownload);
  }

  async function loadConversations() {
    if (!state.supabase) {
      renderConversationList([]);
      return;
    }
    try {
      var result = await state.supabase
        .from('tools_conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      state.conversations = result.data || [];
      renderConversationList(state.conversations);
    } catch (e) {
      renderConversationList([]);
    }
  }

  function renderConversationList(conversations) {
    var container = document.getElementById('conversationList');
    if (!container) return;

    if (!conversations || conversations.length === 0) {
      container.innerHTML = '<div class="pa-conv-empty"><i class="ri-chat-3-line"></i><span>暂无对话记录</span></div>';
      return;
    }

    container.innerHTML = '';
    conversations.forEach(function(conv) {
      var div = document.createElement('div');
      div.className = 'pa-conv-item' + (conv.id === state.currentConversationId ? ' is-active' : '');
      div.innerHTML = '<i class="ri-message-3-line"></i>' +
        '<span class="pa-conv-item-title">' + escapeHtml(conv.title || '未命名对话') + '</span>' +
        '<button class="pa-conv-item-delete" data-id="' + conv.id + '" title="删除"><i class="ri-delete-bin-line"></i></button>';

      div.addEventListener('click', function(e) {
        if (e.target.closest('.pa-conv-item-delete')) return;
        selectConversation(conv.id);
      });

      var deleteBtn = div.querySelector('.pa-conv-item-delete');
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteConversation(conv.id);
      });

      container.appendChild(div);
    });
  }

  async function selectConversation(conversationId) {
    state.currentConversationId = conversationId;
    renderConversationList(state.conversations);
    await loadMessages(conversationId);
  }

  async function deleteConversation(conversationId) {
    if (!confirm('确定删除这个对话吗？')) return;
    if (!state.supabase) return;

    try {
      await state.supabase.from('tools_messages').delete().eq('conversation_id', conversationId);
      await state.supabase.from('tools_conversations').delete().eq('id', conversationId);

      if (state.currentConversationId === conversationId) {
        state.currentConversationId = null;
        state.messages = [];
        renderMessages();
        clearPreview();
      }
      await loadConversations();
    } catch (e) {}
  }

  function handleNewChat() {
    state.currentConversationId = null;
    state.messages = [];
    renderMessages();
    clearPreview();
    renderConversationList(state.conversations);
  }

  async function loadMessages(conversationId) {
    if (!state.supabase) return;
    try {
      var result = await state.supabase
        .from('tools_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (result.data) {
        state.messages = result.data;
        renderMessages();
        var lastPrototype = result.data.filter(function(m) { return m.prototype_html; }).pop();
        if (lastPrototype) {
          renderPreview(lastPrototype.prototype_html);
        } else {
          clearPreview();
        }
      }
    } catch (e) {}
  }

  async function handleSend() {
    var input = document.getElementById('userInput');
    var content = input.value.trim();
    if (!content) return;

    input.value = '';
    input.disabled = true;
    document.getElementById('sendBtn').disabled = true;

    if (!state.currentConversationId) {
      await createConversation(content.substring(0, 50));
    }

    var userMsg = { role: 'user', content: content };
    state.messages.push(userMsg);
    renderMessages();
    await saveMessage(userMsg);

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

  async function createConversation(title) {
    if (!state.supabase) return;
    try {
      var result = await state.supabase
        .from('tools_conversations')
        .insert([{ title: title }])
        .select()
        .single();
      if (result.data) {
        state.currentConversationId = result.data.id;
        await loadConversations();
      }
    } catch (e) {}
  }

  async function saveMessage(msg) {
    if (!state.supabase || !state.currentConversationId) return;
    try {
      await state.supabase.from('tools_messages').insert([{
        conversation_id: state.currentConversationId,
        role: msg.role,
        content: msg.content,
        prototype_html: msg.prototype_html || null
      }]);
      await state.supabase.from('tools_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', state.currentConversationId);
    } catch (e) {}
  }

  async function callAI(userContent) {
    var systemPrompt = buildSystemPrompt();
    var messages = [{ role: 'system', content: systemPrompt }];
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
      body: JSON.stringify({ model: CONFIG.AI_MODEL, messages: messages })
    });

    if (!response.ok) throw new Error('AI 请求失败');
    var data = await response.json();
    return parseAIResponse(data.choices[0].message.content);
  }

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
      state.products.forEach(function(p) { prompt += '- ' + p.name + ': ' + p.url + '\n'; });
      prompt += '\n';
    }
    if (state.competitors.length > 0) {
      prompt += '竞品参考：\n';
      state.competitors.forEach(function(c) { prompt += '- ' + c.name + ': ' + c.url + '\n'; });
    }
    return prompt;
  }

  function parseAIResponse(content) {
    var htmlMatch = content.match(/```html\s*([\s\S]*?)```/);
    var html = htmlMatch ? htmlMatch[1].trim() : null;
    var text = content.replace(/```html[\s\S]*?```/g, '').trim();
    return { text: text, html: html };
  }

  function renderMessages() {
    var container = document.getElementById('messageList');
    if (!container) return;

    if (state.messages.length === 0) {
      container.innerHTML = '<div class="pa-welcome"><i class="ri-robot-line"></i><h3>毛毛的产品助理</h3><p>描述你的需求，我帮你生成原型图</p><div class="pa-welcome-tips"><div class="pa-tip"><i class="ri-lightbulb-line"></i><span>例如：帮我设计一个登录页面，包含手机号和验证码登录</span></div></div></div>';
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

  function renderPreview(html) {
    var container = document.getElementById('previewContent');
    if (!container) return;
    container.innerHTML = html;
  }

  function clearPreview() {
    var container = document.getElementById('previewContent');
    if (!container) return;
    container.innerHTML = '<div class="pa-preview-empty"><i class="ri-layout-line"></i><p>原型将在这里显示</p></div>';
    var downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.disabled = true;
  }

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

  var currentAddType = 'product';
  var currentEditId = null;

  function openAddItemModal(type) {
    currentAddType = type;
    currentEditId = null;
    var modal = document.getElementById('addItemModal');
    var title = document.getElementById('addItemTitle');
    if (title) title.textContent = type === 'product' ? '添加产品' : '添加竞品';
    document.getElementById('itemName').value = '';
    document.getElementById('itemUrl').value = '';
    document.getElementById('itemToken').value = '';
    modal.classList.add('is-active');
  }

  function openEditItemModal(type, item) {
    currentAddType = type;
    currentEditId = item.id;
    var modal = document.getElementById('addItemModal');
    var title = document.getElementById('addItemTitle');
    if (title) title.textContent = type === 'product' ? '编辑产品' : '编辑竞品';
    document.getElementById('itemName').value = item.name || '';
    document.getElementById('itemUrl').value = item.url || '';
    document.getElementById('itemToken').value = item.token || '';
    modal.classList.add('is-active');
  }

  function handleAddItemConfirm() {
    var name = document.getElementById('itemName').value.trim();
    var url = document.getElementById('itemUrl').value.trim();
    var token = document.getElementById('itemToken').value.trim();
    if (!name || !url) {
      alert('请填写名称和网址');
      return;
    }

    if (currentEditId) {
      var list = currentAddType === 'product' ? state.products : state.competitors;
      var item = list.find(function(i) { return i.id === currentEditId; });
      if (item) {
        item.name = name;
        item.url = url;
        item.token = token;
      }
    } else {
      var item = { id: Date.now().toString(), name: name, url: url, token: token };
      if (currentAddType === 'product') {
        state.products.push(item);
      } else {
        state.competitors.push(item);
      }
    }
    saveLocalData();
    renderSettingsList();
    document.getElementById('addItemModal').classList.remove('is-active');
  }

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
        '<div class="pa-settings-item-actions"><button class="pa-settings-item-btn pa-settings-item-btn--edit" data-id="' + item.id + '" data-type="' + type + '" title="编辑"><i class="ri-edit-line"></i></button><button class="pa-settings-item-btn pa-settings-item-btn--delete" data-id="' + item.id + '" data-type="' + type + '" title="删除"><i class="ri-delete-bin-line"></i></button></div>';
      container.appendChild(div);
    });
    container.querySelectorAll('.pa-settings-item-btn--edit').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var t = this.getAttribute('data-type');
        var list = t === 'product' ? state.products : state.competitors;
        var item = list.find(function(i) { return i.id === id; });
        if (item) openEditItemModal(t, item);
      });
    });
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
