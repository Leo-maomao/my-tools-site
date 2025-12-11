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
    messages: [],
    pendingImages: [],
    currentPrototypeHtml: null,
    canvas: {
      zoom: 1,
      panX: 0,
      panY: 0,
      isDragging: false,
      startX: 0,
      startY: 0
    }
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

    var zoomInBtn = document.getElementById('zoomInBtn');
    var zoomOutBtn = document.getElementById('zoomOutBtn');
    var zoomFitBtn = document.getElementById('zoomFitBtn');
    if (zoomInBtn) zoomInBtn.addEventListener('click', function() { changeZoom(0.25); });
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', function() { changeZoom(-0.25); });
    if (zoomFitBtn) zoomFitBtn.addEventListener('click', fitToViewport);

    var fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', openFullscreen);

    var fullscreenClose = document.getElementById('fullscreenClose');
    if (fullscreenClose) fullscreenClose.addEventListener('click', closeFullscreen);

    var fullscreenScale = document.getElementById('fullscreenScale');
    if (fullscreenScale) fullscreenScale.addEventListener('change', function() { applyFullscreenScale(); });

    var fullscreenModal = document.getElementById('fullscreenModal');
    if (fullscreenModal) {
      fullscreenModal.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeFullscreen();
      });
    }

    initCanvasInteraction();

    var imageBtn = document.getElementById('imageBtn');
    var imageInput = document.getElementById('imageInput');
    if (imageBtn && imageInput) {
      imageBtn.addEventListener('click', function() { imageInput.click(); });
      imageInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
          handleImageFile(e.target.files[0]);
          e.target.value = '';
        }
      });
    }

    if (userInput) {
      userInput.addEventListener('paste', handlePaste);
    }
  }

  function handlePaste(e) {
    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return;

    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        var file = items[i].getAsFile();
        if (file) handleImageFile(file);
        return;
      }
    }
  }

  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      var imageData = {
        id: Date.now().toString(),
        dataUrl: e.target.result,
        file: file
      };
      state.pendingImages.push(imageData);
      renderImagePreview();
    };
    reader.readAsDataURL(file);
  }

  function renderImagePreview() {
    var container = document.getElementById('imagePreview');
    if (!container) return;

    if (state.pendingImages.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = '';

    state.pendingImages.forEach(function(img) {
      var div = document.createElement('div');
      div.className = 'pa-image-thumb';
      div.innerHTML = '<img src="' + img.dataUrl + '" alt="预览">' +
        '<button class="pa-image-remove" data-id="' + img.id + '"><i class="ri-close-line"></i></button>';

      div.querySelector('.pa-image-remove').addEventListener('click', function() {
        state.pendingImages = state.pendingImages.filter(function(i) { return i.id !== img.id; });
        renderImagePreview();
      });

      container.appendChild(div);
    });
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
        '<span class="pa-conv-item-title" data-id="' + conv.id + '">' + escapeHtml(conv.title || '未命名对话') + '</span>' +
        '<div class="pa-conv-item-actions">' +
          '<button class="pa-conv-item-btn pa-conv-item-edit" data-id="' + conv.id + '" title="编辑标题"><i class="ri-edit-line"></i></button>' +
          '<button class="pa-conv-item-btn pa-conv-item-delete" data-id="' + conv.id + '" title="删除"><i class="ri-delete-bin-line"></i></button>' +
        '</div>';

      div.addEventListener('click', function(e) {
        if (e.target.closest('.pa-conv-item-btn')) return;
        if (e.target.closest('.pa-conv-item-title.is-editing')) return;
        selectConversation(conv.id);
      });

      var editBtn = div.querySelector('.pa-conv-item-edit');
      editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var titleSpan = div.querySelector('.pa-conv-item-title');
        startEditTitle(conv.id, titleSpan);
      });

      var deleteBtn = div.querySelector('.pa-conv-item-delete');
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteConversation(conv.id);
      });

      container.appendChild(div);
    });
  }

  function startEditTitle(conversationId, titleSpan) {
    if (titleSpan.classList.contains('is-editing')) return;

    var currentTitle = titleSpan.textContent;
    titleSpan.classList.add('is-editing');

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'pa-conv-title-input';
    input.value = currentTitle;

    titleSpan.textContent = '';
    titleSpan.appendChild(input);
    input.focus();
    input.select();

    function saveTitle() {
      var newTitle = input.value.trim() || '未命名对话';
      titleSpan.classList.remove('is-editing');
      titleSpan.textContent = newTitle;

      if (newTitle !== currentTitle) {
        updateConversationTitle(conversationId, newTitle);
      }
    }

    input.addEventListener('blur', saveTitle);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        input.value = currentTitle;
        input.blur();
      }
    });
  }

  async function updateConversationTitle(conversationId, newTitle) {
    if (!state.supabase) return;
    try {
      await state.supabase
        .from('tools_conversations')
        .update({ title: newTitle })
        .eq('id', conversationId);

      var conv = state.conversations.find(function(c) { return c.id === conversationId; });
      if (conv) conv.title = newTitle;
    } catch (e) {}
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
    var images = state.pendingImages.slice();

    if (!content && images.length === 0) return;

    input.value = '';
    state.pendingImages = [];
    renderImagePreview();
    input.disabled = true;
    document.getElementById('sendBtn').disabled = true;

    if (!state.currentConversationId) {
      await createConversation(content.substring(0, 50) || '图片对话');
    }

    var imageUrls = [];
    if (images.length > 0) {
      for (var i = 0; i < images.length; i++) {
        var url = await uploadImage(images[i].file);
        if (url) imageUrls.push(url);
      }
    }

    var userMsg = { role: 'user', content: content, images: imageUrls };
    state.messages.push(userMsg);
    renderMessages();
    await saveMessage(userMsg);

    try {
      var aiResponse = await callAI(content, imageUrls);
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

  async function uploadImage(file) {
    if (!state.supabase || !file) return null;

    var fileName = 'pa-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + file.name.split('.').pop();

    try {
      var result = await state.supabase.storage
        .from('chat-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (result.error) throw result.error;

      var urlResult = state.supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      return urlResult.data.publicUrl;
    } catch (e) {
      return null;
    }
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
        prototype_html: msg.prototype_html || null,
        images: msg.images || null
      }]);
      await state.supabase.from('tools_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', state.currentConversationId);
    } catch (e) {}
  }

  async function callAI(userContent, imageUrls) {
    var systemPrompt = buildSystemPrompt();
    var messages = [{ role: 'system', content: systemPrompt }];
    var history = state.messages.slice(-10);
    history.forEach(function(m) {
      messages.push({ role: m.role, content: m.content || '' });
    });

    if (imageUrls && imageUrls.length > 0) {
      var userMsgContent = [{ type: 'text', text: userContent || '请分析这张图片' }];
      imageUrls.forEach(function(url) {
        userMsgContent.push({ type: 'image_url', image_url: { url: url } });
      });
      messages.push({ role: 'user', content: userMsgContent });
    } else {
      messages.push({ role: 'user', content: userContent });
    }

    var modelToUse = (imageUrls && imageUrls.length > 0) ? 'qwen-vl-plus' : CONFIG.AI_MODEL;

    var response = await fetch(CONFIG.AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.AI_API_KEY
      },
      body: JSON.stringify({ model: modelToUse, messages: messages })
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

      var imagesHtml = '';
      if (msg.images && msg.images.length > 0) {
        imagesHtml = '<div class="pa-message-images">';
        msg.images.forEach(function(imgUrl) {
          imagesHtml += '<img src="' + imgUrl + '" alt="图片" class="pa-message-img" onclick="window.openImageModal(this.src)">';
        });
        imagesHtml += '</div>';
      }

      var contentHtml = msg.content ? '<div class="pa-message-text">' + escapeHtml(msg.content) + '</div>' : '';

      div.innerHTML = '<div class="pa-message-avatar"><i class="' + (msg.role === 'user' ? 'ri-user-line' : 'ri-robot-line') + '"></i></div>' +
        '<div class="pa-message-content">' + imagesHtml + contentHtml + '</div>';
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  }

  window.openImageModal = function(src) {
    var modal = document.createElement('div');
    modal.className = 'pa-image-modal';
    modal.innerHTML = '<div class="pa-image-modal-overlay"></div><img src="' + src + '" class="pa-image-modal-img">';
    modal.addEventListener('click', function() { modal.remove(); });
    document.body.appendChild(modal);
  };

  function renderPreview(html) {
    state.currentPrototypeHtml = html;
    var container = document.getElementById('previewContent');
    if (!container) return;

    var iframe = document.createElement('iframe');
    iframe.className = 'pa-preview-iframe';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

    container.innerHTML = '';
    container.appendChild(iframe);

    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;min-width:max-content;}</style></head><body>' + html + '</body></html>');
    iframeDoc.close();

    iframe.onload = function() {
      try {
        var body = iframe.contentDocument.body;
        var contentWidth = Math.max(body.scrollWidth, 300);
        var contentHeight = Math.max(body.scrollHeight, 200);
        iframe.style.width = contentWidth + 'px';
        iframe.style.height = contentHeight + 'px';
        container.style.width = contentWidth + 'px';
        container.style.height = contentHeight + 'px';

        state.canvas.zoom = 1;
        state.canvas.panX = 0;
        state.canvas.panY = 0;
        fitToViewport();
      } catch (e) {}
    };

    enableCanvasControls(true);
  }

  function enableCanvasControls(enabled) {
    var btns = ['zoomInBtn', 'zoomOutBtn', 'zoomFitBtn', 'fullscreenBtn', 'downloadBtn'];
    btns.forEach(function(id) {
      var btn = document.getElementById(id);
      if (btn) btn.disabled = !enabled;
    });
  }

  function initCanvasInteraction() {
    var viewport = document.getElementById('canvasViewport');
    var canvas = document.getElementById('previewCanvas');
    if (!viewport || !canvas) return;

    viewport.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      state.canvas.isDragging = true;
      state.canvas.startX = e.clientX - state.canvas.panX;
      state.canvas.startY = e.clientY - state.canvas.panY;
      viewport.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function(e) {
      if (!state.canvas.isDragging) return;
      state.canvas.panX = e.clientX - state.canvas.startX;
      state.canvas.panY = e.clientY - state.canvas.startY;
      applyCanvasTransform();
    });

    document.addEventListener('mouseup', function() {
      if (state.canvas.isDragging) {
        state.canvas.isDragging = false;
        viewport.style.cursor = 'grab';
      }
    });

    viewport.addEventListener('wheel', function(e) {
      if (!state.currentPrototypeHtml) return;
      e.preventDefault();
      var delta = e.deltaY > 0 ? -0.1 : 0.1;
      changeZoom(delta);
    }, { passive: false });
  }

  function changeZoom(delta) {
    var newZoom = Math.max(0.1, Math.min(3, state.canvas.zoom + delta));
    state.canvas.zoom = Math.round(newZoom * 100) / 100;
    applyCanvasTransform();
    updateZoomLevel();
  }

  function fitToViewport() {
    var viewport = document.getElementById('canvasViewport');
    var content = document.getElementById('previewContent');
    if (!viewport || !content) return;

    var vw = viewport.clientWidth - 40;
    var vh = viewport.clientHeight - 40;
    var cw = content.offsetWidth || 300;
    var ch = content.offsetHeight || 200;

    var scale = Math.min(vw / cw, vh / ch, 1);
    state.canvas.zoom = Math.round(scale * 100) / 100;
    state.canvas.panX = (viewport.clientWidth - cw * state.canvas.zoom) / 2;
    state.canvas.panY = (viewport.clientHeight - ch * state.canvas.zoom) / 2;

    applyCanvasTransform();
    updateZoomLevel();
  }

  function applyCanvasTransform() {
    var canvas = document.getElementById('previewCanvas');
    if (!canvas) return;
    canvas.style.transform = 'translate(' + state.canvas.panX + 'px, ' + state.canvas.panY + 'px) scale(' + state.canvas.zoom + ')';
  }

  function updateZoomLevel() {
    var zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
      zoomLevel.textContent = Math.round(state.canvas.zoom * 100) + '%';
    }
  }

  function openFullscreen() {
    if (!state.currentPrototypeHtml) return;

    var modal = document.getElementById('fullscreenModal');
    var content = document.getElementById('fullscreenContent');
    if (!modal || !content) return;

    var iframe = document.createElement('iframe');
    iframe.className = 'pa-fullscreen-iframe';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

    content.innerHTML = '';
    content.appendChild(iframe);

    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}</style></head><body>' + state.currentPrototypeHtml + '</body></html>');
    iframeDoc.close();

    iframe.onload = function() {
      try {
        var body = iframe.contentDocument.body;
        iframe.dataset.originalWidth = body.scrollWidth;
        iframe.dataset.originalHeight = body.scrollHeight;
        applyFullscreenScale();
      } catch (e) {}
    };

    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function applyFullscreenScale() {
    var content = document.getElementById('fullscreenContent');
    var iframe = content && content.querySelector('iframe');
    if (!iframe) return;

    var viewport = document.getElementById('fullscreenViewport');
    var scaleSelect = document.getElementById('fullscreenScale');
    var scaleValue = scaleSelect ? scaleSelect.value : '1';

    var viewportWidth = viewport.clientWidth - 40;
    var viewportHeight = viewport.clientHeight - 40;
    var originalWidth = parseInt(iframe.dataset.originalWidth) || 800;
    var originalHeight = parseInt(iframe.dataset.originalHeight) || 600;

    var scale;
    if (scaleValue === 'fit') {
      scale = Math.min(viewportWidth / originalWidth, viewportHeight / originalHeight, 1);
    } else {
      scale = parseFloat(scaleValue);
    }

    iframe.style.transform = 'scale(' + scale + ')';
    iframe.style.transformOrigin = 'top left';
    iframe.style.width = originalWidth + 'px';
    iframe.style.height = originalHeight + 'px';

    content.style.width = originalWidth * scale + 'px';
    content.style.height = originalHeight * scale + 'px';
  }

  function closeFullscreen() {
    var modal = document.getElementById('fullscreenModal');
    if (modal) modal.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  function clearPreview() {
    state.currentPrototypeHtml = null;
    state.canvas.zoom = 1;
    state.canvas.panX = 0;
    state.canvas.panY = 0;

    var container = document.getElementById('previewContent');
    if (container) {
      container.innerHTML = '<div class="pa-preview-empty"><i class="ri-layout-line"></i><p>原型将在这里显示</p></div>';
      container.style.width = '';
      container.style.height = '';
    }

    var canvas = document.getElementById('previewCanvas');
    if (canvas) canvas.style.transform = '';

    updateZoomLevel();
    enableCanvasControls(false);
  }

  async function handleDownload() {
    var container = document.getElementById('previewContent');
    var iframe = container && container.querySelector('iframe');
    if (!iframe || !window.html2canvas) return;

    try {
      var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      var body = iframeDoc.body;
      var canvas = await html2canvas(body, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false
      });
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
