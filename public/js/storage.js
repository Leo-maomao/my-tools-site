/**
 * 文件存储 - 简易网盘
 * 仅管理员可用，支持文件夹分类和搜索
 */
(function() {
  'use strict';

  // ==================== 配置 ====================
  const STORAGE_BUCKET = 'tools-files';
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // ==================== 状态 ====================
  let folders = [];
  let files = [];
  let currentFolder = ''; // 当前文件夹路径
  let searchKeyword = '';
  let editingFolderId = null;
  let deletingItem = null; // { type: 'folder' | 'file', id: string }
  let isDeleting = false; // 防止重复删除
  let previewingFile = null;
  let movingFileId = null; // 正在移动的文件ID

  // ==================== DOM 引用 ====================
  let folderTree, fileList, emptyState, searchInput, clearSearchBtn;
  let folderModal, folderNameInput, folderModalTitle;
  let previewModal, previewFileName, previewContent, previewCopyBtn;
  let deleteModal, deleteText;
  let uploadProgressModal, uploadProgressList;
  let moveModal, moveFolderSelect;
  let fileInput;

  // ==================== 初始化 ====================
  function init() {
    // 检查管理员权限
    if (!window.ToolsAuth || !window.ToolsAuth.isAdmin()) {
      showMessage('此功能仅管理员可用', 'error');
      return;
    }

    // 获取 DOM 引用
    folderTree = document.getElementById('folderTree');
    fileList = document.getElementById('fileList');
    emptyState = document.getElementById('emptyState');
    searchInput = document.getElementById('searchInput');
    clearSearchBtn = document.getElementById('clearSearchBtn');

    folderModal = document.getElementById('folderModal');
    folderNameInput = document.getElementById('folderNameInput');
    folderModalTitle = document.getElementById('folderModalTitle');

    previewModal = document.getElementById('previewModal');
    previewFileName = document.getElementById('previewFileName');
    previewContent = document.getElementById('previewContent');
    previewCopyBtn = document.getElementById('previewCopyBtn');

    deleteModal = document.getElementById('deleteModal');
    deleteText = document.getElementById('deleteText');

    uploadProgressModal = document.getElementById('uploadProgressModal');
    uploadProgressList = document.getElementById('uploadProgressList');

    moveModal = document.getElementById('moveModal');
    moveFolderSelect = document.getElementById('moveFolderSelect');

    fileInput = document.getElementById('fileInput');

    // 绑定事件
    bindEvents();

    // 初始化 UI.Select 组件
    if (moveFolderSelect && window.UI && window.UI.Select) {
      window.UI.Select.create(moveFolderSelect);
    }

    // 加载数据
    loadData();
  }

  // ==================== 事件绑定 ====================
  function bindEvents() {
    // 上传文件按钮
    document.getElementById('uploadFileBtn')?.addEventListener('click', () => fileInput.click());
    document.getElementById('emptyUploadBtn')?.addEventListener('click', () => fileInput.click());

    // 文件选择
    fileInput?.addEventListener('change', handleFileSelect);

    // 新建文件夹按钮
    document.getElementById('addFolderBtn')?.addEventListener('click', () => openFolderModal());

    // 搜索
    searchInput?.addEventListener('input', handleSearch);
    clearSearchBtn?.addEventListener('click', clearSearch);

    // 通用关闭按钮处理
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('is-visible');
      });
    });

    // 文件夹弹窗确认
    document.getElementById('folderConfirmBtn')?.addEventListener('click', handleFolderSubmit);
    folderNameInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleFolderSubmit();
    });

    // 预览弹窗下载
    document.getElementById('previewDownloadBtn')?.addEventListener('click', () => {
      if (previewingFile) downloadFile(previewingFile);
    });
    previewCopyBtn?.addEventListener('click', copyPreviewContent);

    // 删除确认
    document.getElementById('deleteConfirmBtn')?.addEventListener('click', handleDeleteConfirm);

    // 移动文件确认
    document.getElementById('moveConfirmBtn')?.addEventListener('click', handleMoveConfirm);

    // 拖拽上传
    const fileMain = document.querySelector('.file-main');
    if (fileMain) {
      fileMain.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileMain.classList.add('is-dragover');
      });
      fileMain.addEventListener('dragleave', () => {
        fileMain.classList.remove('is-dragover');
      });
      fileMain.addEventListener('drop', (e) => {
        e.preventDefault();
        fileMain.classList.remove('is-dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          uploadFiles(files);
        }
      });
    }
  }

  // ==================== 数据加载 ====================
  async function loadData() {
    const supabase = window.toolsSupabase;
    if (!supabase) {
      showMessage('数据库连接失败', 'error');
      return;
    }

    try {
      // 加载文件夹
      const { data: folderData, error: folderError } = await supabase
        .from('storage_folders')
        .select('*')
        .order('name', { ascending: true });

      if (folderError) throw folderError;
      folders = folderData || [];

      // 加载文件
      const { data: fileData, error: fileError } = await supabase
        .from('storage_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (fileError) throw fileError;
      files = fileData || [];

      // 渲染
      renderFolderTree();
      renderFileList();
    } catch (e) {
      console.error('加载数据失败:', e);
      showMessage('加载数据失败', 'error');
    }
  }

  // ==================== 渲染 ====================
  function renderFolderTree() {
    if (!folderTree) return;

    // 添加"全部文件"选项
    let html = `
      <div class="folder-item ${currentFolder === '' ? 'is-active' : ''}" 
           onclick="window.StorageApp.selectFolder('')">
        <i class="ri-folder-fill"></i>
        <span class="folder-name">全部文件</span>
        <div class="folder-trailing">
          <span class="folder-count">${files.length}</span>
        </div>
      </div>
    `;

    // 渲染文件夹
    folders.forEach(folder => {
      const fileCount = files.filter(f => f.folder_id === folder.id).length;
      html += `
        <div class="folder-item ${currentFolder === folder.id ? 'is-active' : ''}" 
             onclick="window.StorageApp.selectFolder('${folder.id}')">
          <i class="ri-folder-fill"></i>
          <span class="folder-name">${escapeHtml(folder.name)}</span>
          <div class="folder-trailing">
            <span class="folder-count">${fileCount}</span>
            <div class="folder-actions" onclick="event.stopPropagation();">
              <button title="重命名" onclick="window.StorageApp.editFolder('${folder.id}')">
                <i class="ri-edit-line"></i>
              </button>
              <button class="danger" title="删除" onclick="window.StorageApp.confirmDelete('folder', '${folder.id}')">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    folderTree.innerHTML = html;
  }

  function renderFileList() {
    if (!fileList || !emptyState) return;

    // 过滤文件
    let filteredFiles = files;

    // 按文件夹筛选
    if (currentFolder) {
      filteredFiles = filteredFiles.filter(f => f.folder_id === currentFolder);
    }

    // 搜索过滤
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filteredFiles = filteredFiles.filter(f => 
        f.name.toLowerCase().includes(keyword)
      );
    }

    if (filteredFiles.length === 0) {
      fileList.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    fileList.style.display = 'block';
    emptyState.style.display = 'none';

    fileList.innerHTML = filteredFiles.map(file => {
      const iconClass = getFileIconClass(file.type);
      const size = formatFileSize(file.size);
      const date = formatDate(file.created_at);

      return `
        <div class="file-item" onclick="window.StorageApp.previewFile('${file.id}')">
          <div class="file-icon ${iconClass}">
            <i class="${getFileIcon(file.type)}"></i>
          </div>
          <div class="file-info">
            <div class="file-name">${escapeHtml(file.name)}</div>
            <div class="file-meta">
              <span>${size}</span>
              <span>${date}</span>
            </div>
          </div>
          <div class="file-actions" onclick="event.stopPropagation();">
            <button title="移动" onclick="window.StorageApp.openMoveModal('${file.id}')">
              <i class="ri-folder-transfer-line"></i>
            </button>
            <button title="下载" onclick="window.StorageApp.downloadFile('${file.id}')">
              <i class="ri-download-line"></i>
            </button>
            <button class="danger" title="删除" onclick="window.StorageApp.confirmDelete('file', '${file.id}')">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==================== 文件夹操作 ====================
  function selectFolder(folderId) {
    currentFolder = folderId;
    renderFolderTree();
    renderFileList();
  }

  function openFolderModal(folderId = null) {
    editingFolderId = folderId;

    if (folderId) {
      const folder = folders.find(f => f.id === folderId);
      folderModalTitle.textContent = '编辑文件夹';
      folderNameInput.value = folder?.name || '';
    } else {
      folderModalTitle.textContent = '新建文件夹';
      folderNameInput.value = '';
    }

    folderModal.classList.add('is-visible');
    setTimeout(() => folderNameInput.focus(), 100);
  }

  function closeFolderModal() {
    folderModal.classList.remove('is-visible');
    editingFolderId = null;
    folderNameInput.value = '';
  }

  async function handleFolderSubmit() {
    const name = folderNameInput.value.trim();
    if (!name) {
      showMessage('请输入文件夹名称', 'error');
      return;
    }

    const supabase = window.toolsSupabase;
    if (!supabase) return;

    try {
      if (editingFolderId) {
        // 更新文件夹
        const { error } = await supabase
          .from('storage_folders')
          .update({ name })
          .eq('id', editingFolderId);

        if (error) throw error;

        const folder = folders.find(f => f.id === editingFolderId);
        if (folder) folder.name = name;

        showMessage('文件夹已更新', 'success');
      } else {
        // 创建文件夹
        const { data, error } = await supabase
          .from('storage_folders')
          .insert({ name })
          .select()
          .single();

        if (error) throw error;
        folders.push(data);
        // 创建成功不需要弹窗提示
      }

      closeFolderModal();
      renderFolderTree();
    } catch (e) {
      console.error('操作失败:', e);
      showMessage('操作失败: ' + e.message, 'error');
    }
  }

  // ==================== 文件操作 ====================
  function handleFileSelect(e) {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      uploadFiles(selectedFiles);
    }
    // 清空 input 以便重复选择同一文件
    e.target.value = '';
  }

  async function uploadFiles(filesList) {
    const supabase = window.toolsSupabase;
    if (!supabase) return;

    // 显示上传进度弹窗
    uploadProgressList.innerHTML = '';
    uploadProgressModal.classList.add('is-visible');

    const uploadPromises = [];

    for (const file of filesList) {
      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        addUploadProgress(file.name, 0, 'error', '文件过大（最大10MB）');
        continue;
      }

      const progressItem = addUploadProgress(file.name, 0, 'uploading');
      
      const promise = uploadFile(file, progressItem);
      uploadPromises.push(promise);
    }

    await Promise.all(uploadPromises);

    // 延迟关闭弹窗
    setTimeout(() => {
      uploadProgressModal.classList.remove('is-visible');
      loadData(); // 重新加载数据
    }, 1500);
  }

  async function uploadFile(file, progressItem) {
    const supabase = window.toolsSupabase;
    if (!supabase) return;

    try {
      // 生成唯一文件名
      const ext = file.name.split('.').pop();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
      const filePath = currentFolder ? `${currentFolder}/${uniqueName}` : uniqueName;

      // 上传到 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      // 保存文件记录到数据库
      const { data: fileRecord, error: dbError } = await supabase
        .from('storage_files')
        .insert({
          name: file.name,
          path: filePath,
          url: urlData.publicUrl,
          size: file.size,
          type: file.type || 'application/octet-stream',
          folder_id: currentFolder || null
        })
        .select()
        .single();

      if (dbError) throw dbError;

      updateUploadProgress(progressItem, 100, 'success', '上传成功');
      files.unshift(fileRecord);
    } catch (e) {
      console.error('上传失败:', e);
      // 显示具体错误信息
      let errorMsg = '上传失败';
      if (e.message) {
        if (e.message.includes('not found') || e.message.includes('Bucket not found')) {
          errorMsg = '存储桶未创建';
        } else if (e.message.includes('exceeded') || e.message.includes('too large')) {
          errorMsg = '文件过大';
        } else if (e.message.includes('policy') || e.message.includes('permission') || e.message.includes('403')) {
          errorMsg = '无权限上传';
        } else if (e.message.includes('duplicate') || e.message.includes('already exists')) {
          errorMsg = '文件已存在';
        } else {
          errorMsg = e.message.length > 20 ? e.message.substring(0, 20) + '...' : e.message;
        }
      }
      updateUploadProgress(progressItem, 0, 'error', errorMsg);
    }
  }

  function addUploadProgress(fileName, progress, status, statusText = '') {
    const item = document.createElement('div');
    item.className = 'upload-progress-item';
    item.innerHTML = `
      <i class="ri-file-line"></i>
      <div class="upload-progress-info">
        <div class="upload-progress-name">${escapeHtml(fileName)}</div>
        <div class="upload-progress-bar">
          <div class="upload-progress-bar-fill" style="width: ${progress}%;"></div>
        </div>
      </div>
      <span class="upload-progress-status ${status === 'success' ? 'is-success' : ''} ${status === 'error' ? 'is-error' : ''}">
        ${statusText || (status === 'uploading' ? '上传中...' : '')}
      </span>
    `;
    uploadProgressList.appendChild(item);
    return item;
  }

  function updateUploadProgress(item, progress, status, statusText) {
    const bar = item.querySelector('.upload-progress-bar-fill');
    const statusEl = item.querySelector('.upload-progress-status');
    
    bar.style.width = `${progress}%`;
    statusEl.textContent = statusText;
    statusEl.className = `upload-progress-status ${status === 'success' ? 'is-success' : ''} ${status === 'error' ? 'is-error' : ''}`;
  }

  async function downloadFile(fileIdOrObj) {
    let file;
    if (typeof fileIdOrObj === 'string') {
      file = files.find(f => f.id === fileIdOrObj);
    } else {
      file = fileIdOrObj;
    }

    if (!file) return;

    // 直接使用 URL 下载
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==================== 预览 ====================
  async function previewFile(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    previewingFile = file;
    previewFileName.textContent = file.name;

    // 根据文件类型显示不同内容
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) {
      // 图片预览
      previewContent.innerHTML = `<img src="${file.url}" alt="${escapeHtml(file.name)}" />`;
      previewCopyBtn.style.display = 'none';
    } else if (isTextFile(type, file.name)) {
      // 文本预览
      try {
        const response = await fetch(file.url);
        const text = await response.text();
        
        if (file.name.endsWith('.md')) {
          // Markdown 预览
          previewContent.innerHTML = `<div class="markdown-preview">${renderMarkdown(text)}</div>`;
        } else {
          // 纯文本预览
          previewContent.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
        }
        previewCopyBtn.style.display = 'flex';
      } catch (e) {
        previewContent.innerHTML = `<p style="text-align:center;color:var(--text-muted);">无法加载文件内容</p>`;
        previewCopyBtn.style.display = 'none';
      }
    } else {
      // 其他文件
      previewContent.innerHTML = `
        <div style="text-align:center;padding:40px;">
          <i class="${getFileIcon(type)}" style="font-size:64px;color:var(--text-muted);"></i>
          <p style="margin-top:16px;color:var(--text-secondary);">此文件类型不支持预览</p>
          <p style="color:var(--text-muted);font-size:12px;">${file.type}</p>
        </div>
      `;
      previewCopyBtn.style.display = 'none';
    }

    previewModal.classList.add('is-visible');
  }

  function closePreviewModal() {
    previewModal.classList.remove('is-visible');
    previewingFile = null;
  }

  async function copyPreviewContent() {
    if (!previewingFile) return;

    try {
      const response = await fetch(previewingFile.url);
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      showMessage('内容已复制', 'success');
    } catch (e) {
      showMessage('复制失败', 'error');
    }
  }

  // ==================== 删除 ====================
  function confirmDelete(type, id) {
    deletingItem = { type, id };

    if (type === 'folder') {
      const folder = folders.find(f => f.id === id);
      const fileCount = files.filter(f => f.folder_id === id).length;
      deleteText.textContent = fileCount > 0 
        ? `确定删除文件夹「${folder?.name}」及其 ${fileCount} 个文件吗？`
        : `确定删除文件夹「${folder?.name}」吗？`;
    } else {
      const file = files.find(f => f.id === id);
      deleteText.textContent = `确定删除文件「${file?.name}」吗？`;
    }

    deleteModal.classList.add('is-visible');
  }

  function closeDeleteModal() {
    deleteModal.classList.remove('is-visible');
    deletingItem = null;
  }

  async function handleDeleteConfirm() {
    if (!deletingItem || isDeleting) return;

    const supabase = window.toolsSupabase;
    if (!supabase) return;

    isDeleting = true;

    try {
      if (deletingItem.type === 'folder') {
        // 删除文件夹下的所有文件
        const folderFiles = files.filter(f => f.folder_id === deletingItem.id);
        for (const file of folderFiles) {
          await supabase.storage.from(STORAGE_BUCKET).remove([file.path]);
          await supabase.from('storage_files').delete().eq('id', file.id);
        }

        // 删除文件夹
        await supabase.from('storage_folders').delete().eq('id', deletingItem.id);
        
        folders = folders.filter(f => f.id !== deletingItem.id);
        files = files.filter(f => f.folder_id !== deletingItem.id);
        
        if (currentFolder === deletingItem.id) {
          currentFolder = '';
        }
      } else {
        // 删除单个文件
        const file = files.find(f => f.id === deletingItem.id);
        if (file) {
          await supabase.storage.from(STORAGE_BUCKET).remove([file.path]);
          await supabase.from('storage_files').delete().eq('id', file.id);
          files = files.filter(f => f.id !== deletingItem.id);
        }
      }

      showMessage('删除成功', 'success');
      closeDeleteModal();
      renderFolderTree();
      renderFileList();
    } catch (e) {
      console.error('删除失败:', e);
      showMessage('删除失败: ' + e.message, 'error');
    } finally {
      isDeleting = false;
    }
  }

  // ==================== 移动文件 ====================
  function openMoveModal(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    movingFileId = fileId;

    // 填充文件夹选择下拉框
    let options = '<option value="">根目录</option>';
    folders.forEach(folder => {
      // 不显示当前所在的文件夹
      if (folder.id !== file.folder_id) {
        options += `<option value="${folder.id}">${escapeHtml(folder.name)}</option>`;
      }
    });
    moveFolderSelect.innerHTML = options;

    // 刷新 UI.Select 组件
    if (window.UI && window.UI.Select) {
      window.UI.Select.refresh(moveFolderSelect);
    }

    moveModal.classList.add('is-visible');
  }

  function closeMoveModal() {
    moveModal.classList.remove('is-visible');
    movingFileId = null;
  }

  async function handleMoveConfirm() {
    if (!movingFileId) return;

    const supabase = window.toolsSupabase;
    if (!supabase) return;

    const targetFolderId = moveFolderSelect.value || null;

    try {
      const { error } = await supabase
        .from('storage_files')
        .update({ folder_id: targetFolderId })
        .eq('id', movingFileId);

      if (error) throw error;

      // 更新本地数据
      const file = files.find(f => f.id === movingFileId);
      if (file) {
        file.folder_id = targetFolderId;
      }

      closeMoveModal();
      renderFolderTree();
      renderFileList();
      showMessage('文件已移动', 'success');
    } catch (e) {
      console.error('移动失败:', e);
      showMessage('移动失败: ' + e.message, 'error');
    }
  }

  // ==================== 搜索 ====================
  function handleSearch(e) {
    searchKeyword = e.target.value.trim();
    clearSearchBtn.style.display = searchKeyword ? 'flex' : 'none';
    renderFileList();
  }

  function clearSearch() {
    searchKeyword = '';
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderFileList();
  }

  // ==================== 工具函数 ====================
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function isTextFile(mimeType, fileName) {
    const textTypes = ['text/', 'application/json', 'application/javascript', 'application/xml'];
    const textExts = ['.md', '.txt', '.json', '.js', '.css', '.html', '.xml', '.yaml', '.yml', '.toml', '.ini', '.sh', '.py', '.ts', '.tsx', '.jsx', '.vue', '.svelte'];
    
    if (textTypes.some(t => mimeType.includes(t))) return true;
    if (textExts.some(ext => fileName.toLowerCase().endsWith(ext))) return true;
    
    return false;
  }

  function getFileIconClass(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('text/') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('xml')) return 'code';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
    return 'other';
  }

  function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return 'ri-image-line';
    if (mimeType.includes('pdf')) return 'ri-file-pdf-line';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'ri-file-word-line';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'ri-file-excel-line';
    if (mimeType.includes('javascript') || mimeType.includes('typescript')) return 'ri-javascript-line';
    if (mimeType.includes('json')) return 'ri-braces-line';
    if (mimeType.includes('html')) return 'ri-html5-line';
    if (mimeType.includes('css')) return 'ri-css3-line';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'ri-file-zip-line';
    if (mimeType.startsWith('text/') || mimeType.includes('markdown')) return 'ri-file-text-line';
    return 'ri-file-line';
  }

  function renderMarkdown(text) {
    // 简单的 Markdown 渲染
    return text
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Lists
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  function showMessage(msg, type = 'info') {
    if (window.showMessage) {
      window.showMessage(msg, type);
    } else {
      alert(msg);
    }
  }

  // ==================== 暴露到全局 ====================
  window.StorageApp = {
    selectFolder,
    editFolder: openFolderModal,
    previewFile,
    downloadFile,
    confirmDelete,
    openMoveModal
  };

  // ==================== 启动 ====================
  window.addEventListener('toolContentLoaded', function(e) {
    if (e.detail === 'storage') {
      init();
    }
  });

})();

