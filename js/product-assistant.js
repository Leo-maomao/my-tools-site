// 产品助理 - 简化版（纯对话 + PRD分析）
(function() {
  'use strict';

  var CONFIG = {
    AI_API_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    AI_API_KEY: 'sk-b83669be3e4b41ec8379bd80fe6c657f',
    AI_MODEL: 'qwen-plus',
    AI_MODEL_VISION: 'qwen-vl-plus',
    STORAGE_KEY: 'pa_conversations',
    SUPABASE_URL: 'https://aexcnubowsarpxkohqvv.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleGNudWJvd3NhcnB4a29ocXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjYyOTksImV4cCI6MjA3OTgwMjI5OX0.TCGkoBou99fui-cgcpod-b3BaSdq1mg7SFUtR2mIxms'
  };

  var state = {
    conversations: [],
    currentId: null,
    pendingFiles: [],
    pendingImages: [],
    pendingQuote: null,  // 引用的消息
    supabase: null,
    isSending: false  // 发送锁
  };

  var els = {};

  function init() {
    if (window.supabase) {
      state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    }

    els = {
      conversationList: document.getElementById('conversationList'),
      messageList: document.getElementById('messageList'),
      userInput: document.getElementById('userInput'),
      sendBtn: document.getElementById('sendBtn'),
      newChatBtn: document.getElementById('newChatBtn'),
      fileBtn: document.getElementById('fileBtn'),
      fileInput: document.getElementById('fileInput'),
      filePreview: document.getElementById('filePreview'),
      imageBtn: document.getElementById('imageBtn'),
      imageInput: document.getElementById('imageInput'),
      imagePreview: document.getElementById('imagePreview'),
      quotePreview: document.getElementById('quotePreview')
    };

    loadConversations();
    bindEvents();
    renderConversationList();

    if (state.conversations.length === 0) {
      createNewChat();
    } else {
      loadConversation(state.conversations[0].id);
    }
  }

  function bindEvents() {
    els.sendBtn.addEventListener('click', sendMessage);
    els.newChatBtn.addEventListener('click', createNewChat);
    els.fileBtn.addEventListener('click', function() { els.fileInput.click(); });
    els.fileInput.addEventListener('change', handleFileSelect);
    els.imageBtn.addEventListener('click', function() { els.imageInput.click(); });
    els.imageInput.addEventListener('change', handleImageSelect);

    els.userInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // 粘贴图片
    els.userInput.addEventListener('paste', handlePaste);

    // 拖拽上传
    els.userInput.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('is-dragover');
    });
    els.userInput.addEventListener('dragleave', function() {
      this.classList.remove('is-dragover');
    });
    els.userInput.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('is-dragover');
      var files = e.dataTransfer.files;
      for (var i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          handleImageFile(files[i]);
        } else if (files[i].name.endsWith('.html')) {
          state.pendingFiles.push(files[i]);
        }
      }
      renderFilePreview();
    });
  }

  function handlePaste(e) {
    var clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. 优先处理直接粘贴的图片文件
    var items = clipboardData.items;
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        var file = items[i].getAsFile();
        if (file) handleImageFile(file);
        return;
      }
    }

    // 2. 处理HTML内容中的图片（复制网页内容）
    var html = clipboardData.getData('text/html');
    if (html) {
      var imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi);
      if (imgMatches && imgMatches.length > 0) {
        e.preventDefault();
        imgMatches.forEach(function(imgTag) {
          var srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
          if (srcMatch && srcMatch[1]) {
            var imgUrl = srcMatch[1];
            // 如果是data:开头或http开头的图片URL
            if (imgUrl.startsWith('data:') || imgUrl.startsWith('http')) {
              fetchImageAsFile(imgUrl);
            }
          }
        });
        // 同时保留文本内容
        var text = clipboardData.getData('text/plain');
        if (text) {
          var input = els.userInput;
          var start = input.selectionStart;
          var end = input.selectionEnd;
          input.value = input.value.substring(0, start) + text + input.value.substring(end);
          input.selectionStart = input.selectionEnd = start + text.length;
        }
        return;
      }
    }
  }

  async function fetchImageAsFile(url) {
    try {
      // 如果是base64，直接处理
      if (url.startsWith('data:')) {
        var res = await fetch(url);
        var blob = await res.blob();
        var file = new File([blob], 'pasted-image.png', { type: blob.type });
        handleImageFile(file);
        return;
      }
      // 如果是http URL，尝试fetch
      var response = await fetch(url);
      var blob = await response.blob();
      var fileName = 'pasted-image.' + (blob.type.split('/')[1] || 'png');
      var file = new File([blob], fileName, { type: blob.type });
      handleImageFile(file);
    } catch (e) {
      // 如果fetch失败，直接使用URL
      state.pendingImages.push({ id: Date.now().toString(), dataUrl: url, file: null, url: url });
      renderImagePreview();
    }
  }

  function handleImageSelect(e) {
    var files = e.target.files;
    for (var i = 0; i < files.length; i++) {
      handleImageFile(files[i]);
    }
    e.target.value = '';
  }

  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      state.pendingImages.push({ id: Date.now().toString(), dataUrl: e.target.result, file: file });
      renderImagePreview();
    };
    reader.readAsDataURL(file);
  }

  function renderImagePreview() {
    if (state.pendingImages.length === 0) {
      els.imagePreview.innerHTML = '';
      els.imagePreview.style.display = 'none';
      return;
    }
    els.imagePreview.style.display = 'flex';
    els.imagePreview.innerHTML = '';
    state.pendingImages.forEach(function(img) {
      var div = document.createElement('div');
      div.className = 'pa-image-thumb';
      div.innerHTML = '<img src="' + img.dataUrl + '" alt="预览"><button class="pa-image-remove" data-id="' + img.id + '"><i class="ri-close-line"></i></button>';
      div.querySelector('.pa-image-remove').addEventListener('click', function() {
        state.pendingImages = state.pendingImages.filter(function(i) { return i.id !== img.id; });
        renderImagePreview();
      });
      els.imagePreview.appendChild(div);
    });
  }

  function handleFileSelect(e) {
    handleFiles(e.target.files);
    e.target.value = '';
  }

  function handleFiles(files) {
    for (var i = 0; i < files.length; i++) {
      if (files[i].name.endsWith('.html')) {
        state.pendingFiles.push(files[i]);
      }
    }
    renderFilePreview();
  }

  function renderFilePreview() {
    if (state.pendingFiles.length === 0) {
      els.filePreview.innerHTML = '';
      els.filePreview.style.display = 'none';
      return;
    }

    els.filePreview.style.display = 'flex';
    els.filePreview.innerHTML = state.pendingFiles.map(function(file, index) {
      return '<div class="pa-file-tag">' +
        '<i class="ri-file-code-line"></i>' +
        '<span>' + escapeHtml(file.name) + '</span>' +
        '<button class="pa-file-remove" data-index="' + index + '"><i class="ri-close-line"></i></button>' +
        '</div>';
    }).join('');

    els.filePreview.querySelectorAll('.pa-file-remove').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-index'));
        state.pendingFiles.splice(idx, 1);
        renderFilePreview();
      });
    });
  }

  function renderQuotePreview() {
    if (!state.pendingQuote || !els.quotePreview) {
      if (els.quotePreview) {
        els.quotePreview.innerHTML = '';
        els.quotePreview.style.display = 'none';
      }
      return;
    }

    var quote = state.pendingQuote;
    var previewText = quote.content.substring(0, 80) + (quote.content.length > 80 ? '...' : '');
    var extraInfo = '';
    if (quote.images.length > 0) extraInfo += ' [图片]';
    if (quote.files && quote.files.length > 0) extraInfo += ' [' + quote.files.join(', ') + ']';

    els.quotePreview.style.display = 'flex';
    els.quotePreview.innerHTML = '<div class="pa-quote-content">' +
      '<i class="ri-chat-quote-line"></i>' +
      '<span>' + escapeHtml(previewText) + extraInfo + '</span>' +
      '</div>' +
      '<button class="pa-quote-remove"><i class="ri-close-line"></i></button>';

    els.quotePreview.querySelector('.pa-quote-remove').addEventListener('click', function() {
      state.pendingQuote = null;
      renderQuotePreview();
    });
  }

  async function sendMessage() {
    // 防止重复发送
    if (state.isSending) return;

    var text = els.userInput.value.trim();
    var hasFiles = state.pendingFiles.length > 0;
    var hasImages = state.pendingImages.length > 0;
    var hasQuote = state.pendingQuote !== null;

    if (!text && !hasFiles && !hasImages && !hasQuote) return;

    state.isSending = true;

    var conv = getCurrentConversation();
    if (!conv) return;

    // 上传图片
    var imageUrls = [];
    if (hasImages) {
      for (var i = 0; i < state.pendingImages.length; i++) {
        var url = await uploadImage(state.pendingImages[i]);
        if (url) imageUrls.push(url);
      }
    }

    var userMsg = { role: 'user', content: text };
    if (hasFiles) userMsg.files = state.pendingFiles.map(function(f) { return f.name; });
    if (imageUrls.length > 0) userMsg.images = imageUrls;
    // 添加引用信息
    if (hasQuote) {
      userMsg.quote = {
        content: state.pendingQuote.content.substring(0, 200),
        hasImages: state.pendingQuote.images.length > 0,
        files: state.pendingQuote.files,
        fileContents: state.pendingQuote.fileContents  // 保存文件内容
      };
    }

    // 先解析文件内容（用于保存和分析）
    var filesToProcess = state.pendingFiles.slice();
    var parsedFiles = null;
    if (filesToProcess.length > 0) {
      parsedFiles = await parseFiles(filesToProcess);
      // 保存解析后的文件内容到消息中，便于二次引用
      userMsg.fileContents = parsedFiles;
      console.log('保存文件内容:', parsedFiles);
    }

    conv.messages.push(userMsg);
    renderMessages();
    saveConversations();

    els.userInput.value = '';
    var imagesToProcess = imageUrls.slice();
    var quoteForAI = hasQuote ? state.pendingQuote : null;
    state.pendingFiles = [];
    state.pendingImages = [];
    state.pendingQuote = null;
    renderFilePreview();
    renderImagePreview();
    renderQuotePreview();

    showLoading();

    try {
      var aiContent;

      // 如果引用了带图片的消息，只添加http开头的图片URL
      if (quoteForAI && quoteForAI.images && quoteForAI.images.length > 0) {
        var httpImages = quoteForAI.images.filter(function(url) {
          return url && url.startsWith('http');
        });
        imagesToProcess = imagesToProcess.concat(httpImages);
      }

      // 如果引用了带文件的消息，使用保存的文件内容
      if (quoteForAI && quoteForAI.fileContents && quoteForAI.fileContents.length > 0) {
        console.log('引用文件内容:', quoteForAI.fileContents);
        parsedFiles = (parsedFiles || []).concat(quoteForAI.fileContents);
      } else if (quoteForAI && quoteForAI.files && quoteForAI.files.length > 0) {
        console.warn('引用的消息有文件但没有fileContents，可能是旧消息');
      }

      // 构建带引用的提示文本
      var promptText = text;
      if (quoteForAI && quoteForAI.content) {
        promptText = '[引用内容: ' + quoteForAI.content.substring(0, 500) + ']\n\n' + (text || '请分析以上引用内容');
      }

      // 文件优先级最高
      if (parsedFiles && parsedFiles.length > 0) {
        // 如果同时有图片，把图片信息也加到提示中
        if (imagesToProcess.length > 0) {
          promptText += '\n\n（附带图片' + imagesToProcess.length + '张，请一并分析）';
        }
        aiContent = await callAIForReview(parsedFiles, promptText);
      } else if (imagesToProcess.length > 0) {
        aiContent = await callAIWithImages(promptText, imagesToProcess);
      } else {
        // 纯文本对话，直接调用
        aiContent = await callAISimple(promptText);
      }

      conv.messages.push({ role: 'assistant', content: aiContent });

      if (conv.messages.length === 2) {
        conv.title = text.substring(0, 20) || (filesToProcess.length > 0 ? 'PRD分析' : (imagesToProcess.length > 0 ? '图片分析' : '新对话'));
      }

    } catch (e) {
      conv.messages.push({ role: 'assistant', content: '抱歉，请求失败：' + e.message, isError: true });
    }

    hideLoading();
    renderMessages();
    renderConversationList();
    saveConversations();
    state.isSending = false;
  }

  async function uploadImage(img) {
    // 如果已经是URL，直接返回
    if (img.url) return img.url;

    var file = img.file || img;
    if (!state.supabase || !file) {
      return img.dataUrl || await fileToDataUrl(file);
    }

    // 检查文件类型，只支持 png/jpg/jpeg/webp
    var ext = (file.name || '').split('.').pop().toLowerCase();
    var supportedTypes = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
    if (!supportedTypes.includes(ext)) {
      // 不支持的格式（如SVG），转为PNG
      try {
        file = await convertToPng(img.dataUrl || await fileToDataUrl(file));
        ext = 'png';
      } catch (e) {
        console.warn('图片转换失败:', e);
        return img.dataUrl;
      }
    }

    var fileName = 'pa-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '.' + ext;
    try {
      var result = await state.supabase.storage.from('chat-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (result.error) throw result.error;
      var urlResult = state.supabase.storage.from('chat-images').getPublicUrl(fileName);
      return urlResult.data.publicUrl;
    } catch (e) {
      console.warn('Supabase上传失败，使用base64:', e);
      return await fileToDataUrl(file);
    }
  }

  function convertToPng(dataUrl) {
    return new Promise(function(resolve, reject) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = img.width || 800;
        canvas.height = img.height || 600;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(function(blob) {
          if (blob) {
            resolve(new File([blob], 'image.png', { type: 'image/png' }));
          } else {
            reject(new Error('转换失败'));
          }
        }, 'image/png');
      };
      img.onerror = function() { reject(new Error('图片加载失败')); };
      img.src = dataUrl;
    });
  }

  function fileToDataUrl(file) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function(e) { resolve(e.target.result); };
      reader.onerror = function() { resolve(null); };
      reader.readAsDataURL(file);
    });
  }

  async function callAIWithImages(text, imageUrls) {
    // 过滤有效的图片URL - 只使用http(s)开头的URL
    var validUrls = imageUrls.filter(function(url) {
      return url && url.startsWith('http');
    });

    // 如果没有有效的http图片URL，退回到纯文本对话
    if (validUrls.length === 0) {
      console.warn('没有有效的http图片URL，使用纯文本对话');
      return await callAISimple(text || '请分析');
    }

    var systemPrompt = '你是毛毛的产品助理，可以帮助分析界面截图、竞品分析等。请用中文回答，简洁专业。';
    var userContent = [{ type: 'text', text: text || '请分析这张图片' }];
    validUrls.forEach(function(url) {
      userContent.push({ type: 'image_url', image_url: { url: url } });
    });

    try {
      var response = await fetch(CONFIG.AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CONFIG.AI_API_KEY },
        body: JSON.stringify({
          model: CONFIG.AI_MODEL_VISION,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }]
        })
      });
      if (!response.ok) {
        var errData = await response.text();
        console.error('AI图片请求失败:', errData);
        // 如果图片请求失败，退回到纯文本
        return await callAISimple(text);
      }
      var data = await response.json();
      return data.choices[0].message.content;
    } catch (e) {
      console.error('callAIWithImages错误:', e);
      return await callAISimple(text);
    }
  }

  async function parseFiles(files) {
    var results = [];
    for (var i = 0; i < files.length; i++) {
      var content = await readFile(files[i]);
      var parsed = parseHtml(content);
      parsed.fileName = files[i].name;
      results.push(parsed);
    }
    return results;
  }

  function readFile(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) { resolve(e.target.result); };
      reader.onerror = function() { reject(new Error('读取失败')); };
      reader.readAsText(file);
    });
  }

  function parseHtml(html) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');
    var result = { title: doc.title || '未命名', texts: [], annotations: [] };

    doc.querySelectorAll('[class*="text"]').forEach(function(el) {
      var t = el.textContent.trim();
      if (t) result.texts.push(t);
    });
    doc.querySelectorAll('[class*="sticky"], [class*="annotation"]').forEach(function(el) {
      var t = el.textContent.trim();
      if (t) result.annotations.push(t);
    });
    return result;
  }

  async function callAIForReview(parsedContent, userText) {
    var systemPrompt = '你是专业产品经理，帮助Review PRD。分析维度：\n' +
      '1. 状态完整性：初始状态、加载状态、空状态、错误状态、成功状态、边界状态\n' +
      '2. 交互完整性：点击、悬停、禁用、选中等状态\n' +
      '3. 流程完整性：主流程、异常流程、边界流程\n' +
      '4. 数据校验：输入限制、格式校验、必填校验\n' +
      '5. 文案规范：术语一致、表述清晰\n\n' +
      '请用中文回答，结构清晰：\n' +
      '1. 先列出【做得好的地方】\n' +
      '2. 再列出【需要补充的问题】，每个问题标注：\n' +
      '   - 优先级（高/中/低）\n' +
      '   - 位置（在哪个页面/模块）\n' +
      '   - 建议文案（如果有的话）\n' +
      '3. 最后列出【需要确认的问题】';

    var userContent = userText ? (userText + '\n\n') : '';
    userContent += '请分析以下PRD：\n\n';
    parsedContent.forEach(function(page) {
      userContent += '【' + page.fileName + '】\n';
      if (page.texts.length > 0) userContent += page.texts.join('\n') + '\n';
      if (page.annotations.length > 0) userContent += '批注：\n' + page.annotations.join('\n') + '\n';
      userContent += '\n';
    });

    return await callAI(systemPrompt, userContent);
  }

  async function callAIForChat(messages) {
    var systemPrompt = '你是毛毛的产品助理，可以帮助：\n' +
      '1. 回答产品设计、需求分析、用户体验等问题\n' +
      '2. 分析PRD文档（用户上传HTML文件时）\n' +
      '3. 提供产品方案建议\n\n' +
      '请用中文回答，简洁专业。';

    var chatMessages = messages.slice(-10).map(function(m) {
      var content = m.content || '';
      // 如果有引用，加到内容前面
      if (m.quote && m.quote.content) {
        content = '[引用: ' + m.quote.content.substring(0, 100) + ']\n' + content;
      }
      return { role: m.role, content: content };
    }).filter(function(m) { return m.content; });

    var response = await fetch(CONFIG.AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.AI_API_KEY
      },
      body: JSON.stringify({
        model: CONFIG.AI_MODEL,
        messages: [{ role: 'system', content: systemPrompt }].concat(chatMessages)
      })
    });

    if (!response.ok) throw new Error('请求失败');
    var data = await response.json();
    return data.choices[0].message.content;
  }

  async function callAISimple(userText) {
    if (!userText || userText.trim() === '') {
      throw new Error('消息内容为空');
    }
    var systemPrompt = '你是毛毛的产品助理，可以帮助回答产品设计、需求分析、用户体验等问题。请用中文回答，简洁专业。';
    try {
      var response = await fetch(CONFIG.AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CONFIG.AI_API_KEY },
        body: JSON.stringify({
          model: CONFIG.AI_MODEL,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userText }]
        })
      });
      if (!response.ok) {
        var errText = await response.text();
        console.error('API错误:', errText);
        throw new Error('请求失败');
      }
      var data = await response.json();
      return data.choices[0].message.content;
    } catch (e) {
      console.error('callAISimple错误:', e);
      throw e;
    }
  }

  async function callAI(systemPrompt, userContent) {
    var response = await fetch(CONFIG.AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.AI_API_KEY
      },
      body: JSON.stringify({
        model: CONFIG.AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ]
      })
    });

    if (!response.ok) throw new Error('请求失败');
    var data = await response.json();
    return data.choices[0].message.content;
  }

  function createNewChat() {
    var conv = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      createdAt: new Date().toISOString()
    };
    state.conversations.unshift(conv);
    state.currentId = conv.id;
    saveConversations();
    renderConversationList();
    renderMessages();
  }

  function loadConversation(id) {
    state.currentId = id;
    renderConversationList();
    renderMessages();
  }

  function getCurrentConversation() {
    return state.conversations.find(function(c) { return c.id === state.currentId; });
  }

  function renderConversationList() {
    if (!els.conversationList) return;

    if (state.conversations.length === 0) {
      els.conversationList.innerHTML = '<div class="pa-empty">暂无对话</div>';
      return;
    }

    els.conversationList.innerHTML = state.conversations.map(function(conv) {
      var isActive = conv.id === state.currentId ? 'is-active' : '';
      return '<div class="pa-conv-item ' + isActive + '" data-id="' + conv.id + '">' +
        '<span class="pa-conv-title" data-id="' + conv.id + '">' + escapeHtml(conv.title) + '</span>' +
        '<div class="pa-conv-actions">' +
        '<button class="pa-conv-edit" data-id="' + conv.id + '" title="编辑"><i class="ri-edit-line"></i></button>' +
        '<button class="pa-conv-delete" data-id="' + conv.id + '" title="删除"><i class="ri-delete-bin-line"></i></button>' +
        '</div></div>';
    }).join('');

    els.conversationList.querySelectorAll('.pa-conv-item').forEach(function(item) {
      item.addEventListener('click', function(e) {
        if (e.target.closest('.pa-conv-delete') || e.target.closest('.pa-conv-edit')) return;
        if (e.target.closest('.pa-conv-title.is-editing')) return;
        loadConversation(this.getAttribute('data-id'));
      });
    });

    els.conversationList.querySelectorAll('.pa-conv-edit').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = this.getAttribute('data-id');
        var titleSpan = els.conversationList.querySelector('.pa-conv-title[data-id="' + id + '"]');
        if (titleSpan) startEditTitle(id, titleSpan);
      });
    });

    els.conversationList.querySelectorAll('.pa-conv-delete').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteConversation(this.getAttribute('data-id'));
      });
    });
  }

  function startEditTitle(convId, titleSpan) {
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
        var conv = state.conversations.find(function(c) { return c.id === convId; });
        if (conv) { conv.title = newTitle; saveConversations(); }
      }
    }
    input.addEventListener('blur', saveTitle);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      else if (e.key === 'Escape') { input.value = currentTitle; input.blur(); }
    });
  }

  function deleteConversation(id) {
    state.conversations = state.conversations.filter(function(c) { return c.id !== id; });
    if (state.currentId === id) {
      state.currentId = state.conversations.length > 0 ? state.conversations[0].id : null;
    }
    saveConversations();
    renderConversationList();
    renderMessages();

    if (state.conversations.length === 0) {
      createNewChat();
    }
  }

  function renderMessages() {
    var conv = getCurrentConversation();
    if (!conv || conv.messages.length === 0) {
      els.messageList.innerHTML = '<div class="pa-welcome">' +
        '<i class="ri-robot-line"></i>' +
        '<h3>毛毛的产品助理</h3>' +
        '<p>我可以帮你分析PRD、回答产品问题</p>' +
        '<div class="pa-welcome-tips">' +
        '<div class="pa-tip"><i class="ri-file-upload-line"></i><span>上传 Axure HTML 文件，帮你 Review PRD</span></div>' +
        '<div class="pa-tip"><i class="ri-chat-3-line"></i><span>直接提问产品相关问题</span></div>' +
        '</div></div>';
      return;
    }

    els.messageList.innerHTML = conv.messages.map(function(msg, index) {
      var isUser = msg.role === 'user';
      var className = isUser ? 'pa-message pa-message--user' : 'pa-message pa-message--ai';
      if (msg.isError) className += ' pa-message--error';

      // 引用块
      var quoteHtml = '';
      if (msg.quote) {
        var quoteText = msg.quote.content.substring(0, 100) + (msg.quote.content.length > 100 ? '...' : '');
        var quoteExtra = '';
        if (msg.quote.hasImages) quoteExtra += ' [图片]';
        if (msg.quote.files && msg.quote.files.length > 0) quoteExtra += ' [' + msg.quote.files.join(', ') + ']';
        quoteHtml = '<div class="pa-quote-block">' + escapeHtml(quoteText) + quoteExtra + '</div>';
      }

      var filesHtml = '';
      if (msg.files && msg.files.length > 0) {
        filesHtml = '<div class="pa-message-files">' +
          msg.files.map(function(f) {
            return '<span class="pa-file-tag"><i class="ri-file-code-line"></i>' + escapeHtml(f) + '</span>';
          }).join('') + '</div>';
      }

      var imagesHtml = '';
      if (msg.images && msg.images.length > 0) {
        imagesHtml = '<div class="pa-message-images">' +
          msg.images.map(function(url) {
            return '<img src="' + url + '" alt="图片" class="pa-message-img" onclick="window.openImageModal(this.src)">';
          }).join('') + '</div>';
      }

      var contentHtml = isUser ? escapeHtml(msg.content) : formatAIResponse(msg.content);

      var actionsHtml = '<div class="pa-message-actions">' +
        '<button class="pa-msg-btn" data-action="copy" title="复制"><i class="ri-file-copy-line"></i></button>' +
        '<button class="pa-msg-btn" data-action="quote" title="引用"><i class="ri-chat-quote-line"></i></button>' +
        '</div>';

      return '<div class="' + className + '" data-msg-index="' + index + '">' +
        '<div class="pa-message-avatar">' +
        (isUser ? '<i class="ri-user-line"></i>' : '<i class="ri-robot-line"></i>') +
        '</div>' +
        '<div class="pa-message-body">' +
        '<div class="pa-message-content">' + quoteHtml + imagesHtml + filesHtml + contentHtml + '</div>' +
        actionsHtml +
        '</div></div>';
    }).join('');

    // 延迟滚动确保DOM渲染完成
    setTimeout(function() {
      els.messageList.scrollTop = els.messageList.scrollHeight;
    }, 50);
    bindMessageActions();
  }

  function bindMessageActions() {
    els.messageList.querySelectorAll('.pa-msg-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var action = this.getAttribute('data-action');
        var msgEl = this.closest('.pa-message');
        var index = parseInt(msgEl.getAttribute('data-msg-index'));
        var conv = getCurrentConversation();
        if (!conv || !conv.messages[index]) return;
        var msg = conv.messages[index];

        if (action === 'copy') {
          navigator.clipboard.writeText(msg.content || '').then(function() {
            btn.innerHTML = '<i class="ri-check-line"></i>';
            setTimeout(function() { btn.innerHTML = '<i class="ri-file-copy-line"></i>'; }, 1500);
          });
        } else if (action === 'quote') {
          // 设置引用消息（微信风格）
          state.pendingQuote = {
            content: msg.content || '',
            images: msg.images || [],
            files: msg.files || [],
            fileContents: msg.fileContents || [],  // 保存文件内容
            role: msg.role
          };
          renderQuotePreview();
          els.userInput.focus();
        }
      });
    });
  }

  function formatAIResponse(content) {
    if (!content) return '';

    var html = [];
    var lines = content.split('\n');
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      // 跳过空行
      if (!line.trim()) { i++; continue; }

      // 一级标题：### 开头
      if (/^###\s+/.test(line)) {
        var title = line.replace(/^###\s*/, '').trim();
        html.push('<h2 class="pa-ai-h1">' + cleanText(title) + '</h2>');
        i++; continue;
      }

      // 二级标题：单独一行的 **粗体**
      if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
        var title = line.trim().replace(/^\*\*|\*\*$/g, '');
        html.push('<h3 class="pa-ai-h2">' + cleanText(title) + '</h3>');
        i++; continue;
      }

      // 分隔线
      if (/^---+$/.test(line.trim())) {
        html.push('<hr class="pa-ai-hr">');
        i++; continue;
      }

      // 表格：转成卡片列表
      if (line.trim().startsWith('|') && i + 1 < lines.length && /^\|[-:|]+\|$/.test(lines[i + 1].trim())) {
        var headerLine = line;
        var headers = headerLine.split('|').map(function(c) { return c.trim(); }).filter(Boolean);
        i += 2; // 跳过表头和分隔行
        var rows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          var cells = lines[i].split('|').map(function(c) { return c.trim(); }).filter(Boolean);
          rows.push(cells);
          i++;
        }
        html.push(parseTable(headers, rows));
        continue;
      }

      // 编号列表项：1. 2. 等开头（带正文描述）
      if (/^\d+\.\s/.test(line.trim())) {
        var numberedItems = [];
        while (i < lines.length) {
          var currentLine = lines[i];
          // 匹配编号项
          if (/^\d+\.\s/.test(currentLine.trim())) {
            var mainText = currentLine.replace(/^\d+\.\s*/, '').trim();
            var descLines = [];
            i++;
            // 收集后续的描述行（缩进的 - 或普通缩进行）
            while (i < lines.length) {
              var nextLine = lines[i];
              // 缩进的列表项或普通缩进行作为描述
              if (/^\s+[-*]\s/.test(nextLine) || /^\s{2,}\S/.test(nextLine)) {
                var desc = nextLine.replace(/^\s+[-*]\s*/, '').replace(/^\s+/, '').trim();
                desc = desc.replace(/^[-–—]\s*/, '');
                if (desc) descLines.push(desc);
                i++;
              } else {
                break;
              }
            }
            numberedItems.push({ text: mainText, desc: descLines.join(' ') });
          }
          // 跳过空行，继续收集编号项
          else if (!currentLine.trim()) {
            i++;
          }
          // 遇到非编号非空行，结束收集
          else {
            break;
          }
        }
        html.push(parseNumberedList(numberedItems));
        continue;
      }

      // 普通列表项：- 开头（无缩进）
      if (/^[-*]\s/.test(line.trim())) {
        var listItems = [];
        while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
          var item = lines[i].replace(/^[-*]\s/, '').trim();
          item = item.replace(/^[-–—]\s*/, '');
          listItems.push(item);
          i++;
        }
        html.push(parseList(listItems));
        continue;
      }

      // 普通段落
      html.push('<p class="pa-ai-p">' + formatText(line) + '</p>');
      i++;
    }

    return html.join('');

    // 清理文本：去掉 emoji 和多余符号
    function cleanText(text) {
      return text.replace(/[✅❌⚠️💡🔧📌✔️❓❗🎯📍➡️▶️●○◆◇→•🔴🟠🟡🟢🔵⭐📋📝🚀💥⚡🎉✨🔥💪👉👆📢🛠⏰📊📈📉🏷]\s*/g, '').trim();
    }

    // 格式化文本：处理粗体、代码、标签
    function formatText(text) {
      text = cleanText(text);
      // 先转义 HTML，防止渲染意外内容
      text = escapeHtml(text);
      // 再处理 markdown 格式
      text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
      return text;
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
    }

    // 表格转卡片
    function parseTable(headers, rows) {
      if (rows.length === 0) return '';

      // 找出各列的索引
      var descIdx = findHeaderIndex(headers, ['问题描述', '描述', '问题', '内容']);
      var priorityIdx = findHeaderIndex(headers, ['优先级', '级别', '重要性']);
      var locationIdx = findHeaderIndex(headers, ['位置', '页面', '模块', '所在位置']);
      var suggestionIdx = findHeaderIndex(headers, ['建议文案', '建议', '解决方案', '说明']);

      var cardsHtml = '<div class="pa-ai-cards">';
      rows.forEach(function(row) {
        var desc = row[descIdx] || row[0] || '';
        var priority = priorityIdx >= 0 ? row[priorityIdx] : '';
        var location = locationIdx >= 0 ? row[locationIdx] : '';
        var suggestion = suggestionIdx >= 0 ? row[suggestionIdx] : '';

        // 优先级样式
        var priorityClass = '';
        if (priority.indexOf('高') >= 0) priorityClass = 'high';
        else if (priority.indexOf('低') >= 0) priorityClass = 'low';
        else if (priority) priorityClass = 'medium';

        cardsHtml += '<div class="pa-ai-card' + (priorityClass ? ' pa-ai-card--' + priorityClass : '') + '">';

        // 标签行：优先级 + 位置
        if (priority || location) {
          cardsHtml += '<div class="pa-ai-card-tags">';
          if (priority) cardsHtml += '<span class="pa-ai-tag-priority ' + priorityClass + '">' + cleanText(priority) + '</span>';
          if (location) cardsHtml += '<span class="pa-ai-tag-location">' + cleanText(location) + '</span>';
          cardsHtml += '</div>';
        }

        // 问题描述
        if (desc) {
          cardsHtml += '<div class="pa-ai-card-desc">' + formatText(desc) + '</div>';
        }

        // 建议
        if (suggestion) {
          cardsHtml += '<div class="pa-ai-card-suggestion">' + formatText(suggestion) + '</div>';
        }

        cardsHtml += '</div>';
      });
      cardsHtml += '</div>';
      return cardsHtml;
    }

    function findHeaderIndex(headers, keywords) {
      for (var i = 0; i < headers.length; i++) {
        for (var j = 0; j < keywords.length; j++) {
          if (headers[i].indexOf(keywords[j]) >= 0) return i;
        }
      }
      return -1;
    }

    // 编号列表处理（带描述）
    function parseNumberedList(items) {
      if (items.length === 0) return '';

      // 检测重复标签
      var tagRegex = /【([^】]+)】/;
      var firstTag = null;
      var allSameTag = items.length > 1 && items.every(function(item) {
        var match = item.text.match(tagRegex);
        if (!match) return false;
        if (firstTag === null) firstTag = match[1];
        return match[1] === firstTag;
      });

      var listHtml = '<ol class="pa-ai-numbered">';
      items.forEach(function(item) {
        var text = item.text;
        if (allSameTag && firstTag) {
          text = text.replace(/【[^】]+】\s*/, '');
        }
        listHtml += '<li><div class="pa-ai-item-main">' + formatText(text) + '</div>';
        // 描述作为正文
        if (item.desc) {
          listHtml += '<div class="pa-ai-item-desc">' + formatText(item.desc) + '</div>';
        }
        listHtml += '</li>';
      });
      listHtml += '</ol>';
      return listHtml;
    }

    // 普通列表处理
    function parseList(items) {
      if (items.length === 0) return '';

      var tagRegex = /【([^】]+)】/;
      var firstTag = null;
      var allSameTag = items.length > 1 && items.every(function(item) {
        var match = item.match(tagRegex);
        if (!match) return false;
        if (firstTag === null) firstTag = match[1];
        return match[1] === firstTag;
      });

      var listHtml = '<ul class="pa-ai-list">';
      items.forEach(function(item) {
        var text = item;
        if (allSameTag && firstTag) {
          text = text.replace(/【[^】]+】\s*/, '');
        }
        listHtml += '<li>' + formatText(text) + '</li>';
      });
      listHtml += '</ul>';
      return listHtml;
    }
  }

  function showLoading() {
    var loadingHtml = '<div class="pa-message pa-message--ai pa-message--loading">' +
      '<div class="pa-message-avatar"><i class="ri-robot-line"></i></div>' +
      '<div class="pa-message-content"><i class="ri-loader-4-line ri-spin"></i> 正在思考...</div>' +
      '</div>';
    els.messageList.insertAdjacentHTML('beforeend', loadingHtml);
    els.messageList.scrollTop = els.messageList.scrollHeight;
  }

  function hideLoading() {
    var loading = els.messageList.querySelector('.pa-message--loading');
    if (loading) loading.remove();
  }

  function loadConversations() {
    try {
      state.conversations = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
    } catch (e) {
      state.conversations = [];
    }
  }

  function saveConversations() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.conversations.slice(0, 50)));
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 图片弹窗
  window.openImageModal = function(src) {
    var modal = document.createElement('div');
    modal.className = 'pa-image-modal';
    modal.innerHTML = '<div class="pa-image-modal-overlay"></div><img src="' + src + '" class="pa-image-modal-img">';
    modal.addEventListener('click', function() { modal.remove(); });
    document.body.appendChild(modal);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
