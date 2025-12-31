/**
 * To Do List - 任务管理
 * 结构：状态列 > 分类 > 任务
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'tools_todo_data';
  const EXPIRE_DAYS = 30;

  // ==================== 状态 ====================
  let categories = [];  // { id, name, order }
  let tasks = [];       // { id, content, status, categoryId, order, createdAt, completedAt }
  let isCloudMode = false;
  let isInitialized = false;

  // 编辑状态
  let editingCategoryId = null;
  let addingTaskToCategoryId = null;
  let addingTaskToStatus = null;
  let editingTaskId = null;
  let deletingType = null;
  let deletingId = null;

  // DOM 引用
  let categoryModal, categoryNameInput;
  let taskModal, taskContentInput;
  let deleteConfirmModal, deleteConfirmText;

  // ==================== 初始化 ====================
  function init() {
    // 获取 DOM 引用
    categoryModal = document.getElementById('categoryModal');
    categoryNameInput = document.getElementById('categoryNameInput');
    taskModal = document.getElementById('taskModal');
    taskContentInput = document.getElementById('taskContentInput');
    deleteConfirmModal = document.getElementById('deleteConfirmModal');
    deleteConfirmText = document.getElementById('deleteConfirmText');

    bindEvents();
    
    // 初始化 UI.Select 组件
    const categorySelect = document.getElementById('taskCategorySelect');
    if (categorySelect && window.UI && window.UI.Select) {
      window.UI.Select.create(categorySelect);
    }

    if (!isInitialized) {
      isInitialized = true;
      loadData();
    } else {
      renderAll();
    }
  }

  // ==================== 事件绑定 ====================
  function bindEvents() {
    // 添加任务按钮（页面右上角）
    document.getElementById('addTaskBtn')?.addEventListener('click', () => openTaskModalFromHeader());

    // 添加分类按钮（页面右上角）
    document.getElementById('addCategoryBtn')?.addEventListener('click', () => openCategoryModal());

    // 清理已完成（页面右上角）
    document.getElementById('clearCompletedBtn')?.addEventListener('click', clearCompletedTasks);

    // 通用关闭按钮
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        document.getElementById(modalId)?.classList.remove('is-visible');
      });
    });

    // 分类弹窗确认
    document.getElementById('categoryConfirmBtn')?.addEventListener('click', handleCategorySubmit);
    categoryNameInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleCategorySubmit();
    });

    // 任务弹窗确认
    document.getElementById('taskConfirmBtn')?.addEventListener('click', handleTaskSubmit);

    // 删除确认
    document.getElementById('deleteConfirmBtn')?.addEventListener('click', handleDeleteConfirm);
  }

  // ==================== 数据加载 ====================
  async function loadData() {
    const isAdmin = window.ToolsAuth?.isAdmin();
    isCloudMode = isAdmin;

    if (isCloudMode) {
      await loadFromCloud();
    } else {
      loadFromLocal();
    }

    cleanExpiredTasks();
    renderAll();
  }

  function loadFromLocal() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        categories = parsed.categories || [];
        tasks = parsed.tasks || [];
      }
    } catch (e) {
      console.error('加载本地数据失败:', e);
    }
  }

  function saveToLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        categories,
        tasks,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.error('保存本地数据失败:', e);
    }
  }

  async function loadFromCloud() {
    try {
      const supabase = window.toolsSupabase;
      if (!supabase) {
        loadFromLocal();
        return;
      }

      const { data: catData } = await supabase
        .from('todo_categories')
        .select('*')
        .order('sort_order');

      categories = (catData || []).map(c => ({
        id: c.id,
        name: c.name,
        order: c.sort_order
      }));

      const { data: taskData } = await supabase
        .from('todo_tasks')
        .select('*')
        .order('sort_order');

      tasks = (taskData || []).map(t => ({
        id: t.id,
        content: t.content,
        status: t.status || 'pending',
        categoryId: t.category_id,
        order: t.sort_order,
        createdAt: t.created_at,
        completedAt: t.completed_at
      }));
    } catch (e) {
      console.error('加载云端数据失败:', e);
      loadFromLocal();
    }
  }

  function cleanExpiredTasks() {
    const now = Date.now();
    const expireMs = EXPIRE_DAYS * 24 * 60 * 60 * 1000;

    tasks = tasks.filter(task => {
      if (task.status !== 'completed' || !task.completedAt) return true;
      return (now - new Date(task.completedAt).getTime()) < expireMs;
    });

    if (!isCloudMode) saveToLocal();
  }

  // ==================== 渲染 ====================
  function renderAll() {
    renderColumn('pending', 'pendingBody', 'pendingCount');
    renderColumn('in_progress', 'inProgressBody', 'inProgressCount');
    renderColumn('completed', 'completedBody', 'completedCount');
  }

  function renderColumn(status, bodyId, countId) {
    const body = document.getElementById(bodyId);
    const countEl = document.getElementById(countId);
    if (!body) return;

    const statusTasks = tasks.filter(t => t.status === status);
    countEl.textContent = statusTasks.length;

    // 未分类的任务
    const uncategorizedTasks = statusTasks.filter(t => !t.categoryId);
    // 有分类的任务
    const categorizedHtml = categories.map(cat => {
      const catTasks = statusTasks.filter(t => t.categoryId === cat.id);
      return renderCategorySection(cat, catTasks, status);
    }).join('');

    // 先显示未分类任务，再显示分类任务
    let html = '';
    if (uncategorizedTasks.length > 0) {
      html += renderUncategorizedSection(uncategorizedTasks, status);
    }
    html += categorizedHtml;

    if (!html) {
      body.innerHTML = '<div class="column-empty">暂无任务</div>';
      return;
    }

    body.innerHTML = html;

    // 绑定分类事件
    body.querySelectorAll('.category-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('.category-actions')) return;
        const section = header.closest('.category-section');
        section.classList.toggle('is-collapsed');
      });
    });

    // 绑定任务事件
    bindTaskEvents(body);
  }

  function renderUncategorizedSection(uncatTasks, status) {
    const tasksHtml = uncatTasks.map(task => renderTaskCard(task)).join('');
    return `
      <div class="category-section uncategorized" data-category-id="">
        <div class="category-header">
          <div class="category-info">
            <span class="category-toggle"><i class="ri-arrow-down-s-line"></i></span>
            <span class="category-name">未分类</span>
            <span class="category-task-count">(${uncatTasks.length})</span>
          </div>
        </div>
        <div class="category-tasks">${tasksHtml}</div>
      </div>
    `;
  }

  function renderCategorySection(category, catTasks, status) {
    const tasksHtml = catTasks.length > 0
      ? catTasks.map(task => renderTaskCard(task)).join('')
      : '<div class="category-empty">暂无任务</div>';

    return `
      <div class="category-section" data-category-id="${category.id}">
        <div class="category-header">
          <div class="category-info">
            <span class="category-toggle"><i class="ri-arrow-down-s-line"></i></span>
            <span class="category-name">${escapeHtml(category.name)}</span>
            <span class="category-task-count">(${catTasks.length})</span>
          </div>
          <div class="category-actions">
            <button onclick="window.TodoApp.editCategory('${category.id}')" title="编辑">
              <i class="ri-edit-line"></i>
            </button>
            <button class="danger" onclick="window.TodoApp.confirmDeleteCategory('${category.id}')" title="删除">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
        <div class="category-content">
          ${tasksHtml}
        </div>
      </div>
    `;
  }

  function renderTaskCard(task) {
    const statusOrder = ['pending', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    const canGoBack = currentIndex > 0;
    const canGoForward = currentIndex < statusOrder.length - 1;

    return `
      <div class="task-card" data-task-id="${task.id}" draggable="true">
        <div class="task-content">${escapeHtml(task.content)}</div>
        <div class="task-actions">
          ${canGoBack ? `<button onclick="window.TodoApp.moveTaskStatus('${task.id}', '${statusOrder[currentIndex - 1]}')" title="回退状态"><i class="ri-arrow-left-s-line"></i></button>` : ''}
          ${canGoForward ? `<button onclick="window.TodoApp.moveTaskStatus('${task.id}', '${statusOrder[currentIndex + 1]}')" title="推进状态"><i class="ri-arrow-right-s-line"></i></button>` : ''}
          <button onclick="window.TodoApp.editTask('${task.id}')" title="编辑"><i class="ri-edit-line"></i></button>
          <button class="danger" onclick="window.TodoApp.confirmDeleteTask('${task.id}')" title="删除"><i class="ri-delete-bin-line"></i></button>
        </div>
      </div>
    `;
  }

  function bindTaskEvents(container) {
    container.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragend', handleDragEnd);
    });

    container.querySelectorAll('.category-content').forEach(content => {
      content.addEventListener('dragover', handleDragOver);
      content.addEventListener('dragleave', handleDragLeave);
      content.addEventListener('drop', handleDrop);
    });
  }

  // ==================== 分类操作 ====================
  function openCategoryModal(categoryId = null) {
    editingCategoryId = categoryId;
    const cat = categoryId ? categories.find(c => c.id === categoryId) : null;

    document.getElementById('categoryModalTitle').textContent = cat ? '编辑分类' : '添加分类';
    categoryNameInput.value = cat ? cat.name : '';
    categoryModal.classList.add('is-visible');
    categoryNameInput.focus();
  }

  async function handleCategorySubmit() {
    const name = categoryNameInput.value.trim();
    if (!name) {
      showMessage('请输入分类名称', 'error');
      return;
    }

    if (editingCategoryId) {
      await updateCategory(editingCategoryId, name);
    } else {
      await addCategory(name);
    }

    categoryModal.classList.remove('is-visible');
    renderAll();
  }

  async function addCategory(name) {
    const newCat = {
      id: generateId(),
      name,
      order: categories.length
    };

    if (isCloudMode) {
      const supabase = window.toolsSupabase;
      if (supabase) {
        const { data, error } = await supabase
          .from('todo_categories')
          .insert({ name, sort_order: newCat.order })
          .select()
          .single();

        if (!error && data) {
          newCat.id = data.id;
        }
      }
    }

    categories.push(newCat);
    if (!isCloudMode) saveToLocal();
    showMessage('分类已添加', 'success');
  }

  async function updateCategory(categoryId, name) {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;

    cat.name = name;

    if (isCloudMode) {
      const supabase = window.toolsSupabase;
      if (supabase) {
        await supabase.from('todo_categories').update({ name }).eq('id', categoryId);
      }
    } else {
      saveToLocal();
    }

    showMessage('分类已更新', 'success');
  }

  function editCategory(categoryId) {
    openCategoryModal(categoryId);
  }

  function confirmDeleteCategory(categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    const taskCount = tasks.filter(t => t.categoryId === categoryId).length;

    deletingType = 'category';
    deletingId = categoryId;
    deleteConfirmText.textContent = taskCount > 0
      ? `确定删除分类"${cat?.name}"及其 ${taskCount} 个任务吗？`
      : `确定删除分类"${cat?.name}"吗？`;
    deleteConfirmModal.classList.add('is-visible');
  }

  async function deleteCategory(categoryId) {
    if (isCloudMode) {
      const supabase = window.toolsSupabase;
      if (supabase) {
        await supabase.from('todo_tasks').delete().eq('category_id', categoryId);
        await supabase.from('todo_categories').delete().eq('id', categoryId);
      }
    }

    tasks = tasks.filter(t => t.categoryId !== categoryId);
    categories = categories.filter(c => c.id !== categoryId);

    if (!isCloudMode) saveToLocal();
    showMessage('分类已删除', 'success');
    renderAll();
  }

  // ==================== 任务操作 ====================
  function openTaskModalFromHeader() {
    addingTaskToStatus = 'pending';  // 新任务默认待处理
    addingTaskToCategoryId = null;
    editingTaskId = null;

    // 填充分类下拉框（分类可选）
    const categorySelect = document.getElementById('taskCategorySelect');
    categorySelect.innerHTML = '<option value="">无分类</option>' +
      categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    
    // 刷新 UI.Select 组件
    if (window.UI && window.UI.Select) {
      window.UI.Select.refresh(categorySelect);
    }

    document.getElementById('taskCategoryGroup').style.display = 'block';
    document.getElementById('taskModalTitle').textContent = '添加任务';
    taskContentInput.value = '';
    taskModal.classList.add('is-visible');
    taskContentInput.focus();
  }

  function openTaskModal(status, categoryId, taskId = null) {
    addingTaskToStatus = status;
    addingTaskToCategoryId = categoryId;
    editingTaskId = taskId;

    const task = taskId ? tasks.find(t => t.id === taskId) : null;

    // 编辑任务时显示分类选择
    const showCategorySelect = taskId || !categoryId;
    document.getElementById('taskCategoryGroup').style.display = showCategorySelect ? 'block' : 'none';

    if (showCategorySelect) {
      const categorySelect = document.getElementById('taskCategorySelect');
      const taskCategoryId = task ? task.categoryId : categoryId;
      categorySelect.innerHTML = '<option value="">无分类</option>' +
        categories.map(c => `<option value="${c.id}"${taskCategoryId === c.id ? ' selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
      
      // 刷新 UI.Select 组件
      if (window.UI && window.UI.Select) {
        window.UI.Select.refresh(categorySelect);
      }
    }

    document.getElementById('taskModalTitle').textContent = task ? '编辑任务' : '添加任务';
    taskContentInput.value = task ? task.content : '';
    taskModal.classList.add('is-visible');
    taskContentInput.focus();
  }

  async function handleTaskSubmit() {
    const content = taskContentInput.value.trim();
    if (!content) {
      showMessage('请输入任务内容', 'error');
      return;
    }

    // 分类是可选的
    let categoryId = addingTaskToCategoryId;
    if (!categoryId) {
      categoryId = document.getElementById('taskCategorySelect').value || null;
    }

    if (editingTaskId) {
      await updateTask(editingTaskId, content, categoryId);
    } else {
      await addTask(addingTaskToStatus, categoryId, content);
    }

    taskModal.classList.remove('is-visible');
    renderAll();
  }

  async function moveTaskStatus(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    task.status = newStatus;
    task.completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    if (isCloudMode) {
      const supabase = window.toolsSupabase;
      if (supabase) {
        await supabase
          .from('todo_tasks')
          .update({
            status: newStatus,
            is_completed: newStatus === 'completed',
            completed_at: task.completedAt
          })
          .eq('id', taskId);
      }
    } else {
      saveToLocal();
    }

    renderAll();
  }

  async function addTask(status, categoryId, content) {
    const catTasks = tasks.filter(t => t.categoryId === categoryId && t.status === status);
    const newTask = {
      id: generateId(),
      content,
      status,
      categoryId,
      order: catTasks.length,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    if (isCloudMode) {
      const supabase = window.toolsSupabase;
      if (supabase) {
        const { data, error } = await supabase
          .from('todo_tasks')
          .insert({
            content,
            status,
            category_id: categoryId,
            sort_order: newTask.order,
            is_completed: status === 'completed'
          })
          .select()
          .single();

        if (!error && data) {
          newTask.id = data.id;
          newTask.createdAt = data.created_at;
        }
      }
    }

    tasks.push(newTask);
    if (!isCloudMode) saveToLocal();
    showMessage('任务已添加', 'success');
  }

  async function updateTask(taskId, content, categoryId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.content = content;
    task.categoryId = categoryId || null;

    if (isCloudMode) {
      const supabase = window.toolsSupabase;
      if (supabase) {
        await supabase.from('todo_tasks').update({ 
          content,
          category_id: categoryId || null
        }).eq('id', taskId);
      }
    } else {
      saveToLocal();
    }

    showMessage('任务已更新', 'success');
  }

  function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      openTaskModal(task.status, task.categoryId, taskId);
    }
  }

  function confirmDeleteTask(taskId) {
    deletingType = 'task';
    deletingId = taskId;
    deleteConfirmText.textContent = '确定要删除这个任务吗？';
    deleteConfirmModal.classList.add('is-visible');
  }

  async function deleteTask(taskId) {
    if (isCloudMode) {
      const supabase = window.toolsSupabase;
      if (supabase) {
        await supabase.from('todo_tasks').delete().eq('id', taskId);
      }
    }

    tasks = tasks.filter(t => t.id !== taskId);
    if (!isCloudMode) saveToLocal();
    showMessage('任务已删除', 'success');
    renderAll();
  }

  async function handleDeleteConfirm() {
    if (deletingType === 'category') {
      await deleteCategory(deletingId);
    } else if (deletingType === 'task') {
      await deleteTask(deletingId);
    }
    deleteConfirmModal.classList.remove('is-visible');
    deletingType = null;
    deletingId = null;
  }

  // ==================== 清理已完成 ====================
  async function clearCompletedTasks() {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length === 0) {
      showMessage('没有已完成的任务', 'info');
      return;
    }

    if (!confirm(`确定清理 ${completedTasks.length} 个已完成的任务吗？`)) return;

    if (isCloudMode) {
      const supabase = window.toolsSupabase;
      if (supabase) {
        await supabase.from('todo_tasks').delete().eq('status', 'completed');
      }
    }

    tasks = tasks.filter(t => t.status !== 'completed');
    if (!isCloudMode) saveToLocal();

    showMessage(`已清理 ${completedTasks.length} 个任务`, 'success');
    renderAll();
  }

  // ==================== 拖拽功能 ====================
  let draggedTask = null;

  function handleDragStart(e) {
    draggedTask = e.target;
    e.target.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd(e) {
    e.target.classList.remove('is-dragging');
    draggedTask = null;
    document.querySelectorAll('.kanban-column').forEach(col => {
      col.classList.remove('is-dragging-over');
    });
  }

  function handleDragOver(e) {
    e.preventDefault();
    const column = e.target.closest('.kanban-column');
    if (column) column.classList.add('is-dragging-over');
  }

  function handleDragLeave(e) {
    const column = e.target.closest('.kanban-column');
    if (column && !column.contains(e.relatedTarget)) {
      column.classList.remove('is-dragging-over');
    }
  }

  async function handleDrop(e) {
    e.preventDefault();
    if (!draggedTask) return;

    const content = e.target.closest('.category-content');
    const column = e.target.closest('.kanban-column');
    if (!content || !column) return;

    const taskId = draggedTask.dataset.taskId;
    const newStatus = column.dataset.status;
    const newCategoryId = content.closest('.category-section')?.dataset.categoryId;

    await moveTask(taskId, newStatus, newCategoryId);
  }

  async function moveTask(taskId, newStatus, newCategoryId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const statusChanged = task.status !== newStatus;
    const categoryChanged = task.categoryId !== newCategoryId;

    if (!statusChanged && !categoryChanged) return;

    task.status = newStatus;
    if (newCategoryId) task.categoryId = newCategoryId;
    task.completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    if (isCloudMode) {
      const supabase = window.toolsSupabase;
      if (supabase) {
        await supabase
          .from('todo_tasks')
          .update({
            status: newStatus,
            category_id: newCategoryId || task.categoryId,
            is_completed: newStatus === 'completed',
            completed_at: task.completedAt
          })
          .eq('id', taskId);
      }
    } else {
      saveToLocal();
    }

    renderAll();
  }

  // ==================== 工具函数 ====================
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showMessage(msg, type = 'info') {
    if (window.showMessage) {
      window.showMessage(msg, type);
    }
  }

  // ==================== 暴露到全局 ====================
  window.TodoApp = {
    openTaskModal,
    editTask,
    confirmDeleteTask,
    editCategory,
    confirmDeleteCategory,
    moveTaskStatus
  };

  // ==================== 启动 ====================
  window.addEventListener('toolContentLoaded', (e) => {
    if (e.detail === 'todo') {
      init();
    }
  });

})();
