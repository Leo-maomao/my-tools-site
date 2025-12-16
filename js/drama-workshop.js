/**
 * 短剧工坊 - 毛毛的工具箱
 * Part 1: 基础框架（状态管理、Tab切换、Toast）
 */

// ============ 状态管理 ============
const state = {
  currentTab: 'script',      // script | characters
  currentStep: 1,            // 1-5
  maxCompletedStep: 0,       // 最高已完成步骤
  characters: [],            // 角色列表
  selectedCharacters: [],    // 选中的角色ID
  episodes: [],              // 剧集大纲
  currentEpisode: 0,         // 当前编辑的集数（0-based）
  episodeScripts: {},        // 每集的剧本 {0: '...', 1: '...'}
  shots: [],                 // 分镜列表
  frames: [],                // 分镜图（首尾帧）
  aspectRatio: '9:16',       // 画面比例
  editingCharacterId: null,
  tempImages: []
};

// ============ 本地存储 ============
const STORAGE_KEY = 'drama_workshop_characters';

function saveCharactersToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.characters));
  } catch (e) {
    console.warn('保存角色库失败', e);
  }
}

function loadCharactersFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      state.characters = JSON.parse(data);
    }
  } catch (e) {
    console.warn('加载角色库失败', e);
  }
}

// ============ DOM 工具 ============
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ============ Toast 提示（顶部居中） ============
function showToast(message, type = 'info') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = 'dw-toast is-visible';
  if (type === 'success') toast.classList.add('is-success');
  if (type === 'error') toast.classList.add('is-error');

  setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2500);
}

// ============ 生成ID ============
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============ Tab 切换 ============
function initTabs() {
  const tabs = $$('.dw-tab');
  const tabContents = $$('.dw-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      state.currentTab = targetTab;

      // 更新Tab样式
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');

      // 切换内容
      tabContents.forEach(content => {
        content.classList.toggle('is-active', content.id === targetTab + 'Tab');
      });

      // 如果切换到剧本创作，刷新角色选择
      if (targetTab === 'script') {
        renderCharacterSelect();
      }
    });
  });
}

// ============ 步骤切换（前进导航，会更新完成状态） ============
function goToStep(step) {
  // 保存当前剧本（如果在步骤2）
  if (state.currentStep === 2 && $('#scriptContent')) {
    state.episodeScripts[state.currentEpisode] = $('#scriptContent').value;
  }

  // 更新最高完成步骤
  if (step > state.maxCompletedStep) {
    state.maxCompletedStep = step;
  }

  state.currentStep = step;

  // 回到页面顶部
  document.querySelector('.dw-main').scrollTop = 0;
  window.scrollTo(0, 0);

  // 更新步骤指示器
  $$('.dw-step').forEach((el, idx) => {
    el.classList.remove('is-active', 'is-completed');
    if (idx + 1 === step) {
      el.classList.add('is-active');
    } else if (idx + 1 < state.maxCompletedStep || idx + 1 < step) {
      el.classList.add('is-completed');
    }
  });

  // 隐藏所有面板
  $('#step1Panel').classList.add('is-hidden');
  $('#outlinePanel').classList.add('is-hidden');
  $('#step2Panel').classList.add('is-hidden');
  $('#step3Panel').classList.add('is-hidden');
  $('#step4Panel').classList.add('is-hidden');
  $('#step5Panel').classList.add('is-hidden');

  // 显示对应面板
  if (step === 1) {
    // 如果有大纲则显示大纲面板，否则显示构思面板
    if (state.episodes.length > 0) {
      $('#outlinePanel').classList.remove('is-hidden');
      renderEpisodeList();
    } else {
      $('#step1Panel').classList.remove('is-hidden');
    }
  } else if (step === 2) {
    $('#step2Panel').classList.remove('is-hidden');
    renderEpisodeSelector();
  } else if (step === 3) {
    $('#step3Panel').classList.remove('is-hidden');
    renderShotsList();
  } else if (step === 4) {
    $('#step4Panel').classList.remove('is-hidden');
    renderFramesList();
  } else if (step === 5) {
    $('#step5Panel').classList.remove('is-hidden');
    renderVideoCards();
  }
}

// 显示大纲面板（AI生成后）
function showOutlinePanel() {
  $('#step1Panel').classList.add('is-hidden');
  $('#outlinePanel').classList.remove('is-hidden');
  renderEpisodeList();
}

// 返回构思面板（重新构思会清空数据）
function showIdeaPanel() {
  // 清空已有数据
  state.episodes = [];
  state.episodeScripts = {};
  state.currentEpisode = 0;
  state.shots = [];
  state.frames = [];

  $('#outlinePanel').classList.add('is-hidden');
  $('#step1Panel').classList.remove('is-hidden');

  // 重置步骤指示器
  state.currentStep = 1;
  $$('.dw-step').forEach((el, idx) => {
    el.classList.remove('is-active', 'is-completed');
    if (idx === 0) el.classList.add('is-active');
  });
}

// 步骤点击事件
function initSteps() {
  $$('.dw-step').forEach((el, idx) => {
    el.addEventListener('click', () => {
      const targetStep = idx + 1;
      // 可以点击已完成的步骤（包括历史最高完成步骤内的所有步骤）
      if (targetStep <= state.maxCompletedStep || targetStep <= state.currentStep) {
        navigateToStep(targetStep);
      }
    });
  });
}

// 导航到指定步骤（点击步骤指示器，保持数据不丢失）
function navigateToStep(step) {
  // 保存当前剧本（如果在步骤2）
  if (state.currentStep === 2 && $('#scriptContent')) {
    state.episodeScripts[state.currentEpisode] = $('#scriptContent').value;
  }

  // 切换到目标步骤（不改变 maxCompletedStep）
  state.currentStep = step;

  // 回到页面顶部
  document.querySelector('.dw-main').scrollTop = 0;
  window.scrollTo(0, 0);

  // 更新步骤指示器
  $$('.dw-step').forEach((el, idx) => {
    el.classList.remove('is-active', 'is-completed');
    if (idx + 1 === step) {
      el.classList.add('is-active');
    } else if (idx + 1 <= state.maxCompletedStep && idx + 1 !== step) {
      el.classList.add('is-completed');
    }
  });

  // 隐藏所有面板
  $('#step1Panel').classList.add('is-hidden');
  $('#outlinePanel').classList.add('is-hidden');
  $('#step2Panel').classList.add('is-hidden');
  $('#step3Panel').classList.add('is-hidden');
  $('#step4Panel').classList.add('is-hidden');
  $('#step5Panel').classList.add('is-hidden');

  // 显示对应面板
  if (step === 1) {
    // 如果有大纲则显示大纲面板，否则显示构思面板
    if (state.episodes.length > 0) {
      $('#outlinePanel').classList.remove('is-hidden');
      renderEpisodeList();
    } else {
      $('#step1Panel').classList.remove('is-hidden');
    }
  } else if (step === 2) {
    $('#step2Panel').classList.remove('is-hidden');
    renderEpisodeSelector();
  } else if (step === 3) {
    $('#step3Panel').classList.remove('is-hidden');
    renderShotsList();
  } else if (step === 4) {
    $('#step4Panel').classList.remove('is-hidden');
    renderFramesList();
  } else if (step === 5) {
    $('#step5Panel').classList.remove('is-hidden');
    renderVideoCards();
  }
}

// ============ 初始化入口 ============
function init() {
  // 从本地存储加载角色库
  loadCharactersFromStorage();

  initTabs();
  initSteps();
  initCharacterModule();
  initScriptModule();
  initVideoModule();
  initImagePreviewModal();

  // 初始渲染
  renderCharacterGrid();
  updateCharacterCount();

  // 初始显示步骤1
  $('#step1Panel').classList.remove('is-hidden');
}

document.addEventListener('DOMContentLoaded', init);

/**
 * Part 2: 角色管理（多图上传）
 */

// ============ 角色模块初始化 ============
function initCharacterModule() {
  // 添加角色按钮
  $('#addCharacterBtn').addEventListener('click', () => openCharacterModal());

  // 弹窗关闭
  $('#closeModalBtn').addEventListener('click', closeCharacterModal);
  $('#cancelModalBtn').addEventListener('click', closeCharacterModal);
  $('.dw-modal-backdrop').addEventListener('click', closeCharacterModal);

  // 保存角色
  $('#saveCharacterBtn').addEventListener('click', saveCharacter);

  // 多图上传
  const uploadAddBtn = $('#uploadAddBtn');
  const fileInput = $('#characterImages');

  uploadAddBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleMultiImageUpload);

  // 拖拽上传
  uploadAddBtn.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadAddBtn.classList.add('is-dragover');
  });
  uploadAddBtn.addEventListener('dragleave', () => {
    uploadAddBtn.classList.remove('is-dragover');
  });
  uploadAddBtn.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadAddBtn.classList.remove('is-dragover');
    handleDroppedImages(e.dataTransfer.files);
  });
}

// ============ 弹窗操作 ============
function openCharacterModal(characterId = null) {
  state.editingCharacterId = characterId;
  state.tempImages = [];

  if (characterId) {
    // 编辑模式
    const char = state.characters.find(c => c.id === characterId);
    if (char) {
      $('#modalTitle').textContent = '编辑角色';
      $('#characterName').value = char.name;
      $('#characterGender').value = char.gender || 'male';
      $('#characterDesc').value = char.desc || '';
      state.tempImages = [...char.images];
    }
  } else {
    // 新增模式
    $('#modalTitle').textContent = '添加角色';
    $('#characterName').value = '';
    $('#characterGender').value = 'male';
    $('#characterDesc').value = '';
  }

  renderUploadPreviews();
  $('#characterModal').classList.add('is-visible');
}

function closeCharacterModal() {
  $('#characterModal').classList.remove('is-visible');
  state.editingCharacterId = null;
  state.tempImages = [];
}

// ============ 多图上传处理 ============
function handleMultiImageUpload(e) {
  const files = Array.from(e.target.files);
  processImageFiles(files);
  e.target.value = '';
}

function handleDroppedImages(fileList) {
  const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  processImageFiles(files);
}

function processImageFiles(files) {
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      state.tempImages.push(e.target.result);
      renderUploadPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function removeUploadImage(index) {
  state.tempImages.splice(index, 1);
  renderUploadPreviews();
}

function renderUploadPreviews() {
  const container = $('#uploadPreviews');
  container.innerHTML = state.tempImages.map((img, idx) => `
    <div class="dw-upload-item">
      <img src="${img}" alt="图片${idx + 1}">
      <button class="dw-upload-item-remove" onclick="removeUploadImage(${idx})">
        <i class="ri-close-line"></i>
      </button>
    </div>
  `).join('');
}

// ============ 角色CRUD ============
function saveCharacter() {
  const name = $('#characterName').value.trim();
  const gender = $('#characterGender').value;
  const desc = $('#characterDesc').value.trim();

  if (!name) {
    showToast('请输入角色名称', 'error');
    return;
  }

  if (state.tempImages.length === 0) {
    showToast('请至少上传一张参考图片', 'error');
    return;
  }

  if (state.editingCharacterId) {
    // 编辑
    const idx = state.characters.findIndex(c => c.id === state.editingCharacterId);
    if (idx !== -1) {
      state.characters[idx] = {
        ...state.characters[idx],
        name, gender, desc,
        images: [...state.tempImages]
      };
    }
    showToast('角色已更新', 'success');
  } else {
    // 新增
    state.characters.push({
      id: generateId(),
      name, gender, desc,
      images: [...state.tempImages]
    });
    showToast('角色已添加', 'success');
  }

  saveCharactersToStorage();
  renderCharacterGrid();
  updateCharacterCount();
  closeCharacterModal();
}

function deleteCharacter(id) {
  if (!confirm('确定删除该角色吗？')) return;

  state.characters = state.characters.filter(c => c.id !== id);
  state.selectedCharacters = state.selectedCharacters.filter(cid => cid !== id);
  saveCharactersToStorage();
  renderCharacterGrid();
  updateCharacterCount();
  showToast('角色已删除', 'success');
}

// ============ 角色渲染 ============
function renderCharacterGrid() {
  const grid = $('#characterGrid');
  const empty = $('#characterEmpty');

  if (state.characters.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('is-hidden');
    return;
  }

  empty.classList.add('is-hidden');
  const genderIcon = { male: '♂', female: '♀', other: '' };

  grid.innerHTML = state.characters.map(char => `
    <div class="dw-character-card" data-id="${char.id}">
      <div class="dw-character-cover">
        <img src="${char.images[0]}" alt="${char.name}">
        ${char.images.length > 1 ? `<span class="dw-character-badge">${char.images.length}张图</span>` : ''}
      </div>
      <div class="dw-character-info">
        <div class="dw-character-name">
          ${char.name}
          <span class="dw-character-gender">${genderIcon[char.gender] || ''}</span>
        </div>
        <div class="dw-character-desc">${char.desc || '暂无描述'}</div>
      </div>
      <div class="dw-character-actions">
        <button class="dw-btn dw-btn--sm" onclick="openCharacterModal('${char.id}')">
          <i class="ri-edit-line"></i>
        </button>
        <button class="dw-btn dw-btn--sm dw-btn--danger" onclick="deleteCharacter('${char.id}')">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function updateCharacterCount() {
  $('#characterCount').textContent = `${state.characters.length} 个角色`;
}

/**
 * Part 3: 剧本扩写（AI调用）
 */

// ============ 剧本模块初始化 ============
function initScriptModule() {
  // 步骤1：生成大纲
  $('#generateOutlineBtn').addEventListener('click', generateOutline);

  // 步骤1.5：大纲面板
  $('#backToIdeaBtn').addEventListener('click', showIdeaPanel);
  $('#toEpisodeBtn').addEventListener('click', () => goToStep(2));

  // 步骤2：分集剧本
  $('#backToOutlineBtn').addEventListener('click', () => goToStep(1));
  $('#generateEpisodeBtn').addEventListener('click', generateEpisodeScript);
  $('#regenerateScriptBtn').addEventListener('click', generateEpisodeScript);
  $('#toShotsBtn').addEventListener('click', analyzeShots);
  $('#prevEpisodeBtn').addEventListener('click', () => changeEpisode(-1));
  $('#nextEpisodeBtn').addEventListener('click', () => changeEpisode(1));

  // 剧本内容变化时实时更新按钮状态
  $('#scriptContent').addEventListener('input', updateScriptButtons);

  // 步骤3：分镜
  $('#backToScriptBtn').addEventListener('click', () => goToStep(2));
  $('#toFramesBtn').addEventListener('click', () => goToStep(4));

  // 步骤4：分镜图
  $('#backToShotsBtn').addEventListener('click', () => goToStep(3));
  $('#toVideoBtn').addEventListener('click', () => goToStep(5));
  $('#generateAllFramesBtn').addEventListener('click', generateAllFrames);

  // 步骤5：视频
  $('#backToFramesBtn').addEventListener('click', () => goToStep(4));

  // @提及功能
  initMentionFeature();
}

// ============ @提及角色功能 ============
function initMentionFeature() {
  const textarea = $('#storyIdea');
  const dropdown = $('#mentionDropdown');
  let mentionStart = -1;
  let activeIndex = 0;

  textarea.addEventListener('input', (e) => {
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;

    // 查找最近的@符号
    const beforeCursor = text.substring(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const afterAt = beforeCursor.substring(atIndex + 1);
      // 检查@后面没有空格（正在输入中）
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        mentionStart = atIndex;
        const query = afterAt.toLowerCase();
        showMentionDropdown(query, cursorPos);
        return;
      }
    }

    hideMentionDropdown();
  });

  textarea.addEventListener('keydown', (e) => {
    if (!dropdown.classList.contains('is-visible')) return;

    const items = dropdown.querySelectorAll('.dw-mention-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const activeItem = items[activeIndex];
      if (activeItem) {
        insertMention(activeItem.dataset.name);
      }
    } else if (e.key === 'Escape') {
      hideMentionDropdown();
    }
  });

  textarea.addEventListener('blur', () => {
    setTimeout(hideMentionDropdown, 150);
  });

  function updateActiveItem(items) {
    items.forEach((item, idx) => {
      item.classList.toggle('is-active', idx === activeIndex);
    });
  }

  function showMentionDropdown(query, cursorPos) {
    const filtered = state.characters.filter(c =>
      c.name.toLowerCase().includes(query)
    );

    if (filtered.length === 0 && state.characters.length === 0) {
      dropdown.innerHTML = '<div class="dw-mention-empty">请先添加角色</div>';
    } else if (filtered.length === 0) {
      dropdown.innerHTML = '<div class="dw-mention-empty">无匹配角色</div>';
    } else {
      dropdown.innerHTML = filtered.map((char, idx) => `
        <div class="dw-mention-item ${idx === 0 ? 'is-active' : ''}"
             data-name="${char.name}"
             onclick="insertMention('${char.name}')">
          <img src="${char.images[0]}" alt="${char.name}">
          <div class="dw-mention-item-info">
            <span class="dw-mention-item-name">${char.name}</span>
            <span class="dw-mention-item-desc">${char.desc || '暂无描述'}</span>
          </div>
        </div>
      `).join('');
    }

    activeIndex = 0;
    dropdown.classList.add('is-visible');

    // 定位下拉菜单到光标位置
    const coords = getCaretCoordinates(textarea, cursorPos);
    dropdown.style.top = (coords.top + 24) + 'px';
    dropdown.style.left = Math.min(coords.left, textarea.offsetWidth - 220) + 'px';
  }

  // 获取光标在textarea中的坐标
  function getCaretCoordinates(element, position) {
    const div = document.createElement('div');
    const style = getComputedStyle(element);

    ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'padding', 'border', 'width'].forEach(prop => {
      div.style[prop] = style[prop];
    });
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';

    const text = element.value.substring(0, position);
    div.textContent = text;

    const span = document.createElement('span');
    span.textContent = '|';
    div.appendChild(span);

    document.body.appendChild(div);
    const coords = { top: span.offsetTop, left: span.offsetLeft };
    document.body.removeChild(div);

    return coords;
  }

  window.insertMention = function(name) {
    const textarea = $('#storyIdea');
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    const beforeCursor = text.substring(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const before = text.substring(0, atIndex);
      const after = text.substring(cursorPos);
      textarea.value = before + '@' + name + ' ' + after;
      const newPos = atIndex + name.length + 2;
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    }

    hideMentionDropdown();
  };

  function hideMentionDropdown() {
    dropdown.classList.remove('is-visible');
    mentionStart = -1;
  }
}

// 从文本中提取@提及的角色
function extractMentionedCharacters(text) {
  const mentions = text.match(/@(\S+)/g) || [];
  const names = mentions.map(m => m.substring(1));
  return state.characters.filter(c => names.includes(c.name));
}

// ============ AI 生成大纲 ============
async function generateOutline() {
  const idea = $('#storyIdea').value.trim();
  const style = $('input[name="scriptStyle"]:checked').value;
  let episodeCount = parseInt($('#episodeCount').value) || 5;
  if (episodeCount < 1) episodeCount = 1;
  if (episodeCount > 20) episodeCount = 20;

  if (!idea) {
    showToast('请输入故事描述', 'error');
    return;
  }

  const styleMap = {
    comedy: '搞笑幽默', romance: '甜蜜爱情', drama: '虐心催泪',
    suspense: '悬疑反转', workplace: '职场风云', family: '家庭伦理',
    revenge: '逆袭爽文', ancient: '古风仙侠'
  };

  const btn = $('#generateOutlineBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i><span>生成中...</span>';

  try {
    const response = await fetch('https://ai-api.leo-maomao.workers.dev/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: `你是专业的短剧编剧。根据故事创意生成${episodeCount}集的剧集大纲。

风格：${styleMap[style]}

输出JSON数组，每集包含：
- title: 本集标题（5-10字）
- summary: 本集剧情概要（30-50字）

只返回JSON数组，不要其他内容。`
          },
          { role: 'user', content: idea }
        ]
      })
    });

    if (!response.ok) throw new Error('API请求失败');

    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('解析失败');

    state.episodes = JSON.parse(jsonMatch[0]);
    state.episodeScripts = {};
    state.currentEpisode = 0;

    showOutlinePanel();
    showToast(`成功生成 ${state.episodes.length} 集大纲`, 'success');

  } catch (err) {
    showToast('生成失败，请重试', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ri-magic-line"></i><span>AI 生成大纲</span>';
  }
}

// ============ 渲染剧集大纲列表 ============
function renderEpisodeList() {
  const list = $('#episodeList');
  $('#outlineCount').textContent = `${state.episodes.length} 集`;

  list.innerHTML = state.episodes.map((ep, idx) => `
    <div class="dw-episode-item">
      <div class="dw-episode-num">${idx + 1}</div>
      <div class="dw-episode-content">
        <div class="dw-episode-title">${ep.title}</div>
        <div class="dw-episode-summary-text">${ep.summary}</div>
      </div>
    </div>
  `).join('');
}

// ============ 分集选择器 ============
function renderEpisodeSelector() {
  const ep = state.episodes[state.currentEpisode];
  if (!ep) return;

  $('#currentEpisodeLabel').textContent = `第 ${state.currentEpisode + 1} 集`;
  $('#prevEpisodeBtn').disabled = state.currentEpisode === 0;
  $('#nextEpisodeBtn').disabled = state.currentEpisode >= state.episodes.length - 1;

  $('#episodeSummary').innerHTML = `<strong>${ep.title}</strong>：${ep.summary}`;

  // 显示已有剧本或清空
  const script = state.episodeScripts[state.currentEpisode] || '';
  $('#scriptContent').value = script;

  // 更新按钮状态（基于当前textarea内容）
  updateScriptButtons();
}

// 更新剧本按钮状态
function updateScriptButtons() {
  const scriptContent = $('#scriptContent').value.trim();
  const hasScript = !!scriptContent;

  // 有内容：隐藏生成按钮，显示拆解按钮
  // 无内容：显示生成按钮，隐藏拆解按钮
  $('#generateEpisodeBtn').style.display = hasScript ? 'none' : '';
  $('#toShotsBtn').disabled = !hasScript;
  $('#toShotsBtn').style.display = hasScript ? '' : 'none';
}

function changeEpisode(delta) {
  // 保存当前剧本
  state.episodeScripts[state.currentEpisode] = $('#scriptContent').value;

  state.currentEpisode += delta;
  renderEpisodeSelector();
}

// ============ 生成分集剧本 ============
async function generateEpisodeScript() {
  const ep = state.episodes[state.currentEpisode];
  if (!ep) return;

  const btn = $('#generateEpisodeBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i><span>生成中...</span>';

  // 禁止切换集数
  $('#prevEpisodeBtn').disabled = true;
  $('#nextEpisodeBtn').disabled = true;

  try {
    const response = await fetch('https://ai-api.leo-maomao.workers.dev/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: `你是专业的短剧编剧。根据剧集概要，写出完整的分集剧本。

要求：
1. 剧本500-800字
2. 包含场景描述、角色对话、动作描写
3. 适合拍摄成2-3分钟的短视频
4. 格式清晰，便于后续拆解分镜

直接输出剧本内容，不要加标题或说明。`
          },
          { role: 'user', content: `第${state.currentEpisode + 1}集：${ep.title}\n概要：${ep.summary}` }
        ]
      })
    });

    if (!response.ok) throw new Error('API请求失败');

    const data = await response.json();
    const script = data.choices[0].message.content;

    $('#scriptContent').value = script;
    state.episodeScripts[state.currentEpisode] = script;
    showToast('剧本生成完成', 'success');
    renderEpisodeSelector(); // 更新按钮状态

  } catch (err) {
    showToast('生成失败，请重试', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="ri-magic-line"></i><span>生成本集剧本</span>';
  } finally {
    // 恢复切换集数
    renderEpisodeSelector();
  }
}

// ============ AI 分镜拆解 ============
async function analyzeShots() {
  const script = $('#scriptContent').value.trim();

  if (!script) {
    showToast('剧本内容为空', 'error');
    return;
  }

  const selectedChars = state.characters
    .filter(c => state.selectedCharacters.includes(c.id))
    .map(c => c.name)
    .join('、');

  const btn = $('#toShotsBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i><span>拆解中...</span>';

  try {
    const response = await fetch('https://ai-api.leo-maomao.workers.dev/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: `你是专业的影视分镜师。将剧本拆解为AI视频生成的分镜列表。

角色：${selectedChars}

输出JSON数组，每个分镜包含：
- scene: 场景画面描述（用于视频生成提示词，50字以内）
- characters: 出现的角色数组
- shotType: 镜头类型（全景/中景/近景/特写）
- duration: 时长建议（3-6秒）

只返回JSON数组，不要其他内容。`
          },
          {
            role: 'user',
            content: script
          }
        ]
      })
    });

    if (!response.ok) throw new Error('API请求失败');

    const data = await response.json();
    const content = data.choices[0].message.content;

    // 解析JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('解析失败');

    state.shots = JSON.parse(jsonMatch[0]).map((shot, idx) => ({
      id: generateId(),
      index: idx + 1,
      ...shot,
      videoStatus: 'pending',
      videoUrl: null
    }));

    // 初始化分镜图状态
    state.frames = state.shots.map(shot => ({
      shotId: shot.id,
      startFrame: null,
      endFrame: null,
      startStatus: 'pending',
      endStatus: 'pending'
    }));

    renderShotsList();
    goToStep(3);
    showToast(`成功拆解 ${state.shots.length} 个分镜`, 'success');

  } catch (err) {
    showToast('分镜拆解失败，请重试', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ri-film-line"></i><span>拆解分镜</span>';
  }
}

// ============ 分镜列表渲染 ============
function renderShotsList() {
  const list = $('#shotsList');
  $('#shotCount').textContent = `${state.shots.length} 个分镜`;

  if (state.shots.length === 0) {
    list.innerHTML = '<div class="dw-empty"><i class="ri-film-line"></i><p>暂无分镜</p></div>';
    return;
  }

  list.innerHTML = state.shots.map(shot => `
    <div class="dw-shot-card" data-id="${shot.id}">
      <div class="dw-shot-header">
        <span class="dw-shot-num">
          <i class="ri-film-line"></i>
          分镜 ${shot.index}
        </span>
        <span class="dw-shot-duration">${shot.duration}秒</span>
      </div>
      <textarea class="dw-shot-desc-edit" data-shot-id="${shot.id}" onchange="updateShotScene('${shot.id}', this.value)">${shot.scene}</textarea>
      <div class="dw-shot-meta">
        <span class="dw-shot-tag"><i class="ri-camera-line"></i>${shot.shotType}</span>
        ${(shot.characters || []).map(c => `<span class="dw-shot-tag"><i class="ri-user-line"></i>${c}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// 更新分镜场景描述
function updateShotScene(shotId, newScene) {
  const shot = state.shots.find(s => s.id === shotId);
  if (shot) {
    shot.scene = newScene;
  }
}

/**
 * Part 4: 视频生成
 */

// ============ 视频模块初始化 ============
function initVideoModule() {
  $('#generateAllVideosBtn').addEventListener('click', generateAllVideos);
  $('#mergeVideosBtn').addEventListener('click', mergeAllVideos);
  $('#downloadAllBtn').addEventListener('click', downloadAllVideos);
}

// ============ 分镜图渲染 ============
function renderFramesList() {
  const list = $('#framesList');
  const ratio = state.aspectRatio;
  const ratioClass = ratio === '16:9' ? 'ratio-16-9' : ratio === '1:1' ? 'ratio-1-1' : '';

  const doneCount = state.frames.filter(f => f.startFrame).length;
  $('#frameCount').textContent = `${doneCount}/${state.frames.length} 已生成`;
  $('#toVideoBtn').disabled = doneCount < state.frames.length;

  list.innerHTML = state.shots.map((shot, idx) => {
    const frame = state.frames[idx] || {};
    const isLast = idx === state.shots.length - 1;
    const nextFrame = state.frames[idx + 1];
    // endMode: 'empty' | 'ref' | 'custom'
    const endMode = frame.endMode || 'empty';

    return `
      <div class="dw-frame-card" data-id="${shot.id}">
        <div class="dw-frame-info">
          <div class="dw-frame-title">
            <i class="ri-film-line"></i>
            分镜 ${shot.index}
          </div>
          <div class="dw-frame-desc">${shot.scene}</div>
          <div class="dw-frame-meta">
            <span class="dw-shot-tag"><i class="ri-camera-line"></i>${shot.shotType}</span>
            <span class="dw-shot-tag"><i class="ri-time-line"></i>${shot.duration}秒</span>
          </div>
        </div>
        <div class="dw-frame-images">
          <div class="dw-frame-slot">
            <span class="dw-frame-slot-label">首帧图</span>
            <div class="dw-frame-preview ${ratioClass} ${frame.startFrame ? 'has-image' : ''}"
                 onclick="generateFrame('${shot.id}', 'start')">
              ${frame.startStatus === 'generating' ? `
                <div class="dw-frame-loading">
                  <div class="dw-video-spinner"></div>
                </div>
              ` : frame.startFrame ? `
                <img src="${frame.startFrame}" alt="首帧">
                <div class="dw-frame-preview-actions">
                  <button onclick="event.stopPropagation(); previewImage('${frame.startFrame}')">
                    <i class="ri-eye-line"></i>
                  </button>
                  <button onclick="event.stopPropagation(); generateFrame('${shot.id}', 'start')">
                    <i class="ri-refresh-line"></i>
                  </button>
                </div>
              ` : `
                <i class="ri-add-line"></i>
                <span>生成</span>
              `}
            </div>
          </div>
          <div class="dw-frame-link">
            <i class="ri-arrow-right-line"></i>
          </div>
          <div class="dw-frame-slot">
            <span class="dw-frame-slot-label is-optional">尾帧图（可选）</span>
            ${renderEndFrameSlot(shot, frame, idx, ratioClass, nextFrame, isLast)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 渲染尾帧插槽（三种模式：空白/引用/自定义）
function renderEndFrameSlot(shot, frame, idx, ratioClass, nextFrame, isLast) {
  const endMode = frame.endMode || 'empty';
  const canRef = !isLast && nextFrame && nextFrame.startFrame;

  // 如果正在生成
  if (frame.endStatus === 'generating') {
    return `
      <div class="dw-frame-preview ${ratioClass}">
        <div class="dw-frame-loading">
          <div class="dw-video-spinner"></div>
        </div>
      </div>
    `;
  }

  // 如果有自定义尾帧
  if (frame.endFrame && endMode === 'custom') {
    return `
      <div class="dw-frame-preview ${ratioClass} has-image">
        <img src="${frame.endFrame}" alt="尾帧" onclick="previewImage('${frame.endFrame}')">
        <div class="dw-frame-preview-actions">
          <button onclick="previewImage('${frame.endFrame}')" title="查看大图">
            <i class="ri-eye-line"></i>
          </button>
          <button onclick="generateFrame('${shot.id}', 'end')" title="重新生成">
            <i class="ri-refresh-line"></i>
          </button>
          <button class="is-danger" onclick="clearEndFrame('${shot.id}')" title="清除">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>
    `;
  }

  // 如果是引用模式且下一帧有首帧
  if (endMode === 'ref' && canRef) {
    return `
      <div class="dw-frame-preview ${ratioClass} has-image is-ref">
        <img src="${nextFrame.startFrame}" alt="引用下一首帧" onclick="previewImage('${nextFrame.startFrame}')">
        <span class="dw-frame-ref-badge">引用下一首帧</span>
        <div class="dw-frame-preview-actions">
          <button onclick="previewImage('${nextFrame.startFrame}')" title="查看大图">
            <i class="ri-eye-line"></i>
          </button>
          <button class="is-danger" onclick="clearEndFrame('${shot.id}')" title="取消引用">
            <i class="ri-close-line"></i>
          </button>
        </div>
      </div>
    `;
  }

  // 空白模式：显示三种选项（引用按钮始终显示，无对象时置灰）
  return `
    <div class="dw-end-frame-options">
      <button class="dw-end-frame-btn" onclick="generateFrame('${shot.id}', 'end')">
        <i class="ri-add-circle-line"></i>
        <span>生成</span>
      </button>
      <button class="dw-end-frame-btn dw-end-frame-btn--ref" onclick="setEndFrameRef('${shot.id}')" ${canRef ? '' : 'disabled'}>
        <i class="ri-link"></i>
        <span>引用</span>
      </button>
      <button class="dw-end-frame-btn dw-end-frame-btn--empty" disabled>
        <i class="ri-subtract-line"></i>
        <span>空白</span>
      </button>
    </div>
  `;
}

// 设置尾帧为引用模式
function setEndFrameRef(shotId) {
  const idx = state.shots.findIndex(s => s.id === shotId);
  if (idx === -1) return;
  state.frames[idx].endMode = 'ref';
  state.frames[idx].endFrame = null;
  renderFramesList();
}

// 清除尾帧
function clearEndFrame(shotId) {
  const idx = state.shots.findIndex(s => s.id === shotId);
  if (idx === -1) return;
  state.frames[idx].endMode = 'empty';
  state.frames[idx].endFrame = null;
  state.frames[idx].endStatus = 'pending';
  renderFramesList();
}

// ============ 生成单个分镜图（模拟） ============
async function generateFrame(shotId, type) {
  const idx = state.shots.findIndex(s => s.id === shotId);
  if (idx === -1) return;

  const frame = state.frames[idx];
  const statusKey = type === 'start' ? 'startStatus' : 'endStatus';
  const frameKey = type === 'start' ? 'startFrame' : 'endFrame';

  frame[statusKey] = 'generating';
  renderFramesList();

  // TODO: 接入图片生成API
  showToast(`生成${type === 'start' ? '首' : '尾'}帧图中（模拟）...`, 'info');
  await new Promise(r => setTimeout(r, 2000));

  // 模拟成功
  frame[statusKey] = 'done';
  frame[frameKey] = 'https://picsum.photos/400/600?random=' + Date.now();

  // 尾帧生成后设置为 custom 模式
  if (type === 'end') {
    frame.endMode = 'custom';
  }

  renderFramesList();
  showToast('图片生成完成', 'success');
}

// 一键生成所有首帧
async function generateAllFrames() {
  for (let i = 0; i < state.shots.length; i++) {
    if (!state.frames[i].startFrame) {
      await generateFrame(state.shots[i].id, 'start');
    }
  }
  showToast('所有首帧图生成完成', 'success');
}

// 图片预览
function previewImage(src) {
  $('#previewImage').src = src;
  $('#imagePreviewModal').classList.add('is-visible');
}

// 关闭图片预览
function initImagePreviewModal() {
  $('#closeImagePreviewBtn').addEventListener('click', () => {
    $('#imagePreviewModal').classList.remove('is-visible');
  });
  $('#imagePreviewModal .dw-modal-backdrop').addEventListener('click', () => {
    $('#imagePreviewModal').classList.remove('is-visible');
  });
}

// ============ 视频卡片渲染 ============
function renderVideoCards() {
  const grid = $('#videoGrid');
  const doneCount = state.shots.filter(s => s.videoStatus === 'done').length;
  const allDone = doneCount === state.shots.length && state.shots.length > 0;
  $('#videoCount').textContent = `${doneCount}/${state.shots.length} 已生成`;
  $('#downloadAllBtn').disabled = doneCount === 0;
  $('#mergeVideosBtn').disabled = !allDone;

  if (state.shots.length === 0) {
    grid.innerHTML = '<div class="dw-empty"><i class="ri-video-line"></i><p>暂无分镜</p></div>';
    return;
  }

  const statusText = {
    pending: '待生成',
    generating: '生成中',
    done: '已完成',
    error: '失败'
  };

  grid.innerHTML = state.shots.map(shot => `
    <div class="dw-video-card" data-id="${shot.id}">
      <div class="dw-video-preview">
        ${shot.videoStatus === 'done' && shot.videoUrl ? `
          <video src="${shot.videoUrl}" controls></video>
        ` : shot.videoStatus === 'generating' ? `
          <div class="dw-video-loading">
            <div class="dw-video-spinner"></div>
            <span>正在生成...</span>
          </div>
        ` : `
          <div class="dw-video-placeholder">
            <i class="ri-film-line"></i>
            <span>点击生成</span>
          </div>
        `}
        <span class="dw-video-status dw-video-status--${shot.videoStatus}">${statusText[shot.videoStatus]}</span>
      </div>
      <div class="dw-video-info">
        <div class="dw-video-title">分镜 ${shot.index} · ${shot.shotType}</div>
        <div class="dw-video-desc">${shot.scene}</div>
      </div>
      <div class="dw-video-actions">
        <button class="dw-btn dw-btn--sm dw-btn--primary"
                onclick="generateSingleVideo('${shot.id}')"
                ${shot.videoStatus === 'generating' ? 'disabled' : ''}>
          <i class="ri-play-circle-line"></i>
          <span>${shot.videoStatus === 'done' ? '重新生成' : '生成'}</span>
        </button>
        ${shot.videoStatus === 'done' ? `
          <button class="dw-btn dw-btn--sm dw-btn--success" onclick="downloadVideo('${shot.id}')">
            <i class="ri-download-line"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// ============ 视频生成（模拟，后续接阿里API） ============
async function generateSingleVideo(shotId) {
  const shot = state.shots.find(s => s.id === shotId);
  if (!shot) return;

  shot.videoStatus = 'generating';
  renderVideoCards();

  // TODO: 接入阿里百炼视频生成API
  // 目前模拟生成过程
  showToast('视频生成中（模拟）...', 'info');

  await new Promise(r => setTimeout(r, 3000));

  // 模拟成功
  shot.videoStatus = 'done';
  shot.videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'; // 示例视频
  renderVideoCards();
  showToast(`分镜 ${shot.index} 生成完成`, 'success');
}

async function generateAllVideos() {
  const pending = state.shots.filter(s => s.videoStatus !== 'done');

  if (pending.length === 0) {
    showToast('所有视频已生成', 'info');
    return;
  }

  showToast(`开始生成 ${pending.length} 个视频...`, 'info');

  for (const shot of pending) {
    await generateSingleVideo(shot.id);
    await new Promise(r => setTimeout(r, 500));
  }

  showToast('全部视频生成完成！', 'success');
}

// ============ 视频下载 ============
function downloadVideo(shotId) {
  const shot = state.shots.find(s => s.id === shotId);
  if (!shot || !shot.videoUrl) return;

  const a = document.createElement('a');
  a.href = shot.videoUrl;
  a.download = `分镜${shot.index}_${shot.shotType}.mp4`;
  a.click();
}

function downloadAllVideos() {
  const done = state.shots.filter(s => s.videoStatus === 'done' && s.videoUrl);

  if (done.length === 0) {
    showToast('没有可下载的视频', 'error');
    return;
  }

  done.forEach((shot, idx) => {
    setTimeout(() => downloadVideo(shot.id), idx * 500);
  });

  showToast(`正在下载 ${done.length} 个视频`, 'success');
}

// ============ 合成完整视频 ============
async function mergeAllVideos() {
  const done = state.shots.filter(s => s.videoStatus === 'done' && s.videoUrl);

  if (done.length !== state.shots.length) {
    showToast('请先生成所有分镜视频', 'error');
    return;
  }

  const btn = $('#mergeVideosBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i><span>合成中...</span>';

  // TODO: 接入视频合成API
  showToast('视频合成中（模拟）...', 'info');
  await new Promise(r => setTimeout(r, 3000));

  // 模拟合成完成
  showToast('视频合成完成！', 'success');

  // 下载合成后的视频（模拟）
  const a = document.createElement('a');
  a.href = 'https://www.w3schools.com/html/mov_bbb.mp4';
  a.download = `第${state.currentEpisode + 1}集_完整视频.mp4`;
  a.click();

  btn.disabled = false;
  btn.innerHTML = '<i class="ri-movie-2-line"></i><span>合成完整视频</span>';
}
