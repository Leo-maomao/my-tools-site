/**
 * Modal 弹窗组件
 */

class Modal {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      closeOnOverlay: true,
      closeOnEscape: true,
      onOpen: null,
      onClose: null,
      ...options
    };
    
    this.isOpen = false;
    this.init();
  }
  
  init() {
    this.modal = this.element.querySelector('.modal');
    this.closeButtons = this.element.querySelectorAll('.modal-close, [data-modal-close]');
    
    this.bindEvents();
  }
  
  bindEvents() {
    // 关闭按钮
    this.closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });
    
    // 点击遮罩关闭
    if (this.options.closeOnOverlay) {
      this.element.addEventListener('click', (e) => {
        if (e.target === this.element) {
          this.close();
        }
      });
    }
    
    // ESC 关闭
    if (this.options.closeOnEscape) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }
  }
  
  open() {
    this.isOpen = true;
    
    // 防止页面收缩：先计算滚动条宽度，再设置padding补偿
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = scrollbarWidth + 'px';
    document.body.style.overflow = 'hidden';
    
    this.element.classList.add('modal-open');
    
    // 聚焦到弹窗
    this.modal.setAttribute('tabindex', '-1');
    this.modal.focus();
    
    if (this.options.onOpen) {
      this.options.onOpen();
    }
  }
  
  close() {
    this.isOpen = false;
    this.element.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    if (this.options.onClose) {
      this.options.onClose();
    }
  }
  
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
}

/**
 * 快捷方法：确认对话框
 */
function showConfirm(options = {}) {
  const {
    title = '确认',
    message = '确定执行此操作吗？',
    type = 'warning', // warning, danger, success, info
    confirmText = '确认',
    cancelText = '取消',
    onConfirm = null,
    onCancel = null
  } = options;
  
  const iconPaths = {
    warning: '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>',
    danger: '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>',
    success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
  };
  
  const confirmBtnClass = type === 'danger' ? 'btn-danger' : 'btn-primary';
  
  // 只有当 cancelText 不为空时才渲染取消按钮
  const cancelBtnHtml = cancelText 
    ? `<button class="btn btn-outline" data-action="cancel">${cancelText}</button>` 
    : '';
  
  const html = `
    <div class="modal-overlay modal-open" id="confirm-modal">
      <div class="modal modal-sm modal-confirm">
        <div class="modal-body modal-confirm-body">
          <div class="modal-confirm-icon modal-confirm-icon-${type}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${iconPaths[type]}
            </svg>
          </div>
          <h3 class="modal-confirm-title">${title}</h3>
          <p class="modal-confirm-text">${message}</p>
        </div>
        <div class="modal-footer modal-confirm-footer">
          ${cancelBtnHtml}
          <button class="btn ${confirmBtnClass}" data-action="confirm">${confirmText}</button>
        </div>
      </div>
    </div>
  `;
  
  // 防止页面收缩：先计算滚动条宽度
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.paddingRight = scrollbarWidth + 'px';
  document.body.style.overflow = 'hidden';
  
  document.body.insertAdjacentHTML('beforeend', html);
  const overlay = document.getElementById('confirm-modal');
  
  const cleanup = () => {
    overlay.classList.remove('modal-open');
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, 200);
  };
  
  overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
    if (onConfirm) onConfirm();
    cleanup();
  });
  
  // 取消按钮可能不存在（当 cancelText 为空时）
  const cancelBtn = overlay.querySelector('[data-action="cancel"]');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (onCancel) onCancel();
      cleanup();
    });
  }
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (onCancel) onCancel();
      cleanup();
    }
  });
}

// 导出
window.Modal = Modal;
window.showConfirm = showConfirm;

