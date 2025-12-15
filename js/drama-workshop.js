/**
 * 短剧工坊 - 毛毛的工具箱
 */

// ============ 状态管理 ============
const state = {
  currentStep: 1,
  characters: [],  // 角色列表
  shots: [],       // 分镜列表
  editingCharacterId: null
};

// ============ DOM 元素 ============
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// 步骤相关
const stepElements = $$('.dw-step');
const step1Panel = $('#step1Panel');
const step2Panel = $('#step2Panel');
const step3Panel = $('#step3Panel');

// 步骤1：角色库
const addCharacterBtn = $('#addCharacterBtn');
const characterList = $('#characterList');
const characterEmpty = $('#characterEmpty');
const toStep2Btn = $('#toStep2Btn');

// 步骤2：剧本分镜
const scriptContent = $('#scriptContent');
const analyzeScriptBtn = $('#analyzeScriptBtn');
const shotsList = $('#shotsList');
const shotsEmpty = $('#shotsEmpty');
const shotCount = $('#shotCount');
const backToStep1Btn = $('#backToStep1Btn');
const toStep3Btn = $('#toStep3Btn');

// 步骤3：视频生成
const videoGrid = $('#videoGrid');
const backToStep2Btn = $('#backToStep2Btn');
const generateAllBtn = $('#generateAllBtn');
const downloadAllBtn = $('#downloadAllBtn');

// 弹窗相关
const characterModal = $('#characterModal');
const modalTitle = $('#modalTitle');
const characterName = $('#characterName');
const characterDesc = $('#characterDesc');
const characterImage = $('#characterImage');
const uploadArea = $('#uploadArea');
const uploadPlaceholder = $('#uploadPlaceholder');
const uploadPreview = $('#uploadPreview');
const previewImage = $('#previewImage');
const removeImageBtn = $('#removeImageBtn');
const closeModalBtn = $('#closeModalBtn');
const cancelModalBtn = $('#cancelModalBtn');
const saveCharacterBtn = $('#saveCharacterBtn');

// Toast
const toast = $('#toast');

// ============ 工具函数 ============
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = 'dw-toast is-visible';
  if (type === 'success') toast.classList.add('is-success');
  if (type === 'error') toast.classList.add('is-error');

  setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2500);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============ 步骤切换 ============
function goToStep(step) {
  state.currentStep = step;

  // 更新步骤指示器
  stepElements.forEach((el, idx) => {
    el.classList.remove('is-active', 'is-completed');
    if (idx + 1 === step) {
      el.classList.add('is-active');
    } else if (idx + 1 < step) {
      el.classList.add('is-completed');
    }
  });

  // 切换面板
  step1Panel.classList.toggle('is-hidden', step !== 1);
  step2Panel.classList.toggle('is-hidden', step !== 2);
  step3Panel.classList.toggle('is-hidden', step !== 3);

  // 如果进入步骤3，初始化视频卡片
  if (step === 3) {
    renderVideoCards();
  }
}

// ============ 角色管理 ============
function openCharacterModal(characterId = null) {
  state.editingCharacterId = characterId;

  if (characterId) {
    // 编辑模式
    const char = state.characters.find(c => c.id === characterId);
    if (char) {
      modalTitle.textContent = '编辑角色';
      characterName.value = char.name;
      characterDesc.value = char.desc || '';
      previewImage.src = char.image;
      uploadPlaceholder.style.display = 'none';
      uploadPreview.style.display = 'block';
    }
  } else {
    // 新增模式
    modalTitle.textContent = '添加角色';
    characterName.value = '';
    characterDesc.value = '';
    previewImage.src = '';
    uploadPlaceholder.style.display = 'flex';
    uploadPreview.style.display = 'none';
  }

  characterModal.classList.add('is-visible');
}

function closeCharacterModal() {
  characterModal.classList.remove('is-visible');
  state.editingCharacterId = null;
}

function saveCharacter() {
  const name = characterName.value.trim();
  const desc = characterDesc.value.trim();
  const image = previewImage.src;

  if (!name) {
    showToast('请输入角色名称', 'error');
    return;
  }

  if (!image || image === window.location.href) {
    showToast('请上传角色图片', 'error');
    return;
  }

  if (state.editingCharacterId) {
    // 编辑
    const idx = state.characters.findIndex(c => c.id === state.editingCharacterId);
    if (idx !== -1) {
      state.characters[idx] = { ...state.characters[idx], name, desc, image };
    }
    showToast('角色已更新', 'success');
  } else {
    // 新增
    state.characters.push({
      id: generateId(),
      name,
      desc,
      image
    });
    showToast('角色已添加', 'success');
  }

  renderCharacterList();
  closeCharacterModal();
  updateStep1Buttons();
}

function deleteCharacter(id) {
  if (!confirm('确定删除该角色吗？')) return;

  state.characters = state.characters.filter(c => c.id !== id);
  renderCharacterList();
  updateStep1Buttons();
  showToast('角色已删除', 'success');
}

function renderCharacterList() {
  if (state.characters.length === 0) {
    characterList.innerHTML = '';
    characterEmpty.classList.remove('is-hidden');
    return;
  }

  characterEmpty.classList.add('is-hidden');
  characterList.innerHTML = state.characters.map(char => `
    <div class="dw-character-card" data-id="${char.id}">
      <img class="dw-character-image" src="${char.image}" alt="${char.name}">
      <div class="dw-character-info">
        <div class="dw-character-name">${char.name}</div>
        <div class="dw-character-desc">${char.desc || '暂无描述'}</div>
      </div>
      <div class="dw-character-actions">
        <button class="dw-btn dw-btn--small" onclick="openCharacterModal('${char.id}')">
          <i class="ri-edit-line"></i>
        </button>
        <button class="dw-btn dw-btn--small dw-btn--danger" onclick="deleteCharacter('${char.id}')">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function updateStep1Buttons() {
  toStep2Btn.disabled = state.characters.length === 0;
}

// ============ 图片上传 ============
function handleImageUpload(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('请上传图片文件', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    uploadPlaceholder.style.display = 'none';
    uploadPreview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ============ 剧本分镜 ============
async function analyzeScript() {
  const script = scriptContent.value.trim();

  if (!script) {
    showToast('请先输入剧本内容', 'error');
    return;
  }

  if (script.length < 20) {
    showToast('剧本内容太短，请补充更多细节', 'error');
    return;
  }

  // 获取角色名列表
  const characterNames = state.characters.map(c => c.name).join('、');

  analyzeScriptBtn.disabled = true;
  analyzeScriptBtn.innerHTML = '<i class="ri-loader-4-line"></i><span>AI 分析中...</span>';

  try {
    const response = await fetch('https://ai-api.leo-maomao.workers.dev/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `你是一位专业的影视分镜师。请将用户提供的剧本拆解为适合AI视频生成的分镜列表。

角色列表：${characterNames || '无预设角色'}

输出要求：
1. 每个分镜包含：场景描述、主要角色、镜头类型、时长建议
2. 返回 JSON 数组格式
3. 每个分镜时长建议3-6秒
4. 镜头类型包括：全景、中景、近景、特写、跟镜头、俯拍、仰拍

返回格式：
[
  {
    "scene": "场景画面描述（用于视频生成提示词）",
    "characters": ["角色1", "角色2"],
    "shotType": "镜头类型",
    "duration": 5
  }
]

只返回JSON，不要其他内容。`
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
    if (!jsonMatch) throw new Error('解析分镜失败');

    state.shots = JSON.parse(jsonMatch[0]).map((shot, idx) => ({
      id: generateId(),
      index: idx + 1,
      ...shot,
      videoStatus: 'pending',
      videoUrl: null
    }));

    renderShotsList();
    showToast(`成功拆解 ${state.shots.length} 个分镜`, 'success');

  } catch (err) {
    showToast('分镜分析失败，请重试', 'error');
  } finally {
    analyzeScriptBtn.disabled = false;
    analyzeScriptBtn.innerHTML = '<i class="ri-magic-line"></i><span>AI 分析分镜</span>';
  }
}

function renderShotsList() {
  if (state.shots.length === 0) {
    shotsList.innerHTML = `
      <div class="dw-empty" id="shotsEmpty">
        <i class="ri-film-line"></i>
        <p>暂无分镜</p>
        <span>输入剧本后点击「AI 分析分镜」</span>
      </div>
    `;
    shotCount.textContent = '0 个分镜';
    toStep3Btn.disabled = true;
    return;
  }

  shotCount.textContent = `${state.shots.length} 个分镜`;
  toStep3Btn.disabled = false;

  shotsList.innerHTML = state.shots.map(shot => `
    <div class="dw-shot-card" data-id="${shot.id}">
      <div class="dw-shot-header">
        <span class="dw-shot-num">
          <i class="ri-film-line"></i>
          分镜 ${shot.index}
        </span>
        <span class="dw-shot-duration">${shot.duration}秒</span>
      </div>
      <div class="dw-shot-desc">${shot.scene}</div>
      <div class="dw-shot-meta">
        <span class="dw-shot-tag"><i class="ri-camera-line"></i>${shot.shotType}</span>
        ${shot.characters.map(c => `<span class="dw-shot-tag"><i class="ri-user-line"></i>${c}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// ============ 视频生成 ============
function renderVideoCards() {
  if (state.shots.length === 0) {
    videoGrid.innerHTML = '<div class="dw-empty"><i class="ri-video-line"></i><p>暂无分镜</p></div>';
    return;
  }

  videoGrid.innerHTML = state.shots.map(shot => {
    const statusClass = `dw-video-status--${shot.videoStatus}`;
    const statusText = {
      pending: '待生成',
      generating: '生成中',
      done: '已完成',
      error: '失败'
    }[shot.videoStatus];

    return `
      <div class="dw-video-card" data-id="${shot.id}">
        <div class="dw-video-preview">
          ${shot.videoStatus === 'done' && shot.videoUrl ? `
            <video src="${shot.videoUrl}" controls></video>
          ` : shot.videoStatus === 'generating' ? `
            <div class="dw-video-loading">
              <div class="dw-video-loading-spinner"></div>
              <span>正在生成...</span>
            </div>
          ` : `
            <div class="dw-video-placeholder">
              <i class="ri-film-line"></i>
              <span>点击生成视频</span>
            </div>
          `}
          <span class="dw-video-status ${statusClass}">${statusText}</span>
        </div>
        <div class="dw-video-info">
          <div class="dw-video-title">分镜 ${shot.index} · ${shot.shotType}</div>
          <div class="dw-video-desc">${shot.scene}</div>
        </div>
        <div class="dw-video-actions">
          <button class="dw-btn dw-btn--small dw-btn--primary"
                  onclick="generateSingleVideo('${shot.id}')"
                  ${shot.videoStatus === 'generating' ? 'disabled' : ''}>
            <i class="ri-play-circle-line"></i>
            <span>${shot.videoStatus === 'done' ? '重新生成' : '生成'}</span>
          </button>
          ${shot.videoStatus === 'done' ? `
            <button class="dw-btn dw-btn--small dw-btn--success" onclick="downloadVideo('${shot.id}')">
              <i class="ri-download-line"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  updateDownloadAllBtn();
}

async function generateSingleVideo(shotId) {
  const shot = state.shots.find(s => s.id === shotId);
  if (!shot) return;

  shot.videoStatus = 'generating';
  renderVideoCards();

  // 模拟视频生成（实际项目需接入可灵等API）
  // 这里用延迟模拟
  showToast('视频生成功能需接入可灵API', 'info');

  setTimeout(() => {
    // 模拟生成完成
    shot.videoStatus = 'done';
    // 使用一个示例视频URL（实际应为生成的视频）
    shot.videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
    renderVideoCards();
    showToast(`分镜 ${shot.index} 生成完成`, 'success');
  }, 3000);
}

async function generateAllVideos() {
  const pendingShots = state.shots.filter(s => s.videoStatus !== 'done');

  if (pendingShots.length === 0) {
    showToast('所有视频已生成', 'info');
    return;
  }

  showToast(`开始生成 ${pendingShots.length} 个视频...`, 'info');

  // 逐个生成
  for (const shot of pendingShots) {
    await generateSingleVideo(shot.id);
    // 间隔一下
    await new Promise(r => setTimeout(r, 500));
  }
}

function downloadVideo(shotId) {
  const shot = state.shots.find(s => s.id === shotId);
  if (!shot || !shot.videoUrl) return;

  const a = document.createElement('a');
  a.href = shot.videoUrl;
  a.download = `分镜${shot.index}_${shot.shotType}.mp4`;
  a.click();
}

function downloadAllVideos() {
  const doneShots = state.shots.filter(s => s.videoStatus === 'done' && s.videoUrl);

  if (doneShots.length === 0) {
    showToast('没有可下载的视频', 'error');
    return;
  }

  doneShots.forEach((shot, idx) => {
    setTimeout(() => downloadVideo(shot.id), idx * 500);
  });

  showToast(`正在下载 ${doneShots.length} 个视频`, 'success');
}

function updateDownloadAllBtn() {
  const doneCount = state.shots.filter(s => s.videoStatus === 'done').length;
  downloadAllBtn.disabled = doneCount === 0;
}

// ============ 事件绑定 ============
function initEvents() {
  // 步骤点击
  stepElements.forEach((el, idx) => {
    el.addEventListener('click', () => {
      const targetStep = idx + 1;
      // 只能点击已完成的步骤或当前步骤
      if (targetStep <= state.currentStep ||
          (targetStep === 2 && state.characters.length > 0) ||
          (targetStep === 3 && state.shots.length > 0)) {
        goToStep(targetStep);
      }
    });
  });

  // 步骤导航按钮
  toStep2Btn.addEventListener('click', () => goToStep(2));
  backToStep1Btn.addEventListener('click', () => goToStep(1));
  toStep3Btn.addEventListener('click', () => goToStep(3));
  backToStep2Btn.addEventListener('click', () => goToStep(2));

  // 角色管理
  addCharacterBtn.addEventListener('click', () => openCharacterModal());
  closeModalBtn.addEventListener('click', closeCharacterModal);
  cancelModalBtn.addEventListener('click', closeCharacterModal);
  saveCharacterBtn.addEventListener('click', saveCharacter);

  // 点击遮罩关闭弹窗
  characterModal.querySelector('.dw-modal-backdrop').addEventListener('click', closeCharacterModal);

  // 图片上传
  uploadArea.addEventListener('click', () => characterImage.click());
  characterImage.addEventListener('change', (e) => {
    if (e.target.files[0]) handleImageUpload(e.target.files[0]);
  });

  // 拖拽上传
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('is-dragover');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('is-dragover');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('is-dragover');
    if (e.dataTransfer.files[0]) handleImageUpload(e.dataTransfer.files[0]);
  });

  // 移除图片
  removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    previewImage.src = '';
    uploadPlaceholder.style.display = 'flex';
    uploadPreview.style.display = 'none';
  });

  // 剧本分析
  analyzeScriptBtn.addEventListener('click', analyzeScript);

  // 视频生成
  generateAllBtn.addEventListener('click', generateAllVideos);
  downloadAllBtn.addEventListener('click', downloadAllVideos);
}

// ============ 初始化 ============
function init() {
  initEvents();
  renderCharacterList();
  updateStep1Buttons();
}

document.addEventListener('DOMContentLoaded', init);
