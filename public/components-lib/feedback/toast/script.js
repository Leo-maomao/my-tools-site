/**
 * Toast 轻提示组件
 */

const Toast = {
  container: null,
  position: 'top-right',
  duration: 3000,
  
  // 初始化容器
  init(position = 'top-right') {
    this.position = position;
    
    // 检查是否已存在容器
    this.container = document.querySelector(`.toast-container.toast-${position}`);
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = `toast-container toast-${position}`;
      document.body.appendChild(this.container);
    }
    
    return this;
  },
  
  // 显示 Toast
  show(options = {}) {
    const {
      type = 'info',
      title = '',
      message = '',
      duration = this.duration,
      closable = true
    } = typeof options === 'string' ? { message: options } : options;
    
    if (!this.container) {
      this.init();
    }
    
    const icons = {
      success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
      error: '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>',
      warning: '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>',
      info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}${title ? '' : ' toast-simple'}`;
    
    toast.innerHTML = `
      <div class="toast-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${icons[type]}
        </svg>
      </div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      ${closable ? `
        <button class="toast-close" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      ` : ''}
    `;
    
    this.container.appendChild(toast);
    
    // 关闭按钮事件
    if (closable) {
      toast.querySelector('.toast-close').addEventListener('click', () => {
        this.remove(toast);
      });
    }
    
    // 自动关闭
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }
    
    return toast;
  },
  
  // 移除 Toast
  remove(toast) {
    if (!toast || toast.classList.contains('toast-removing')) return;
    
    toast.classList.add('toast-removing');
    setTimeout(() => {
      toast.remove();
    }, 300);
  },
  
  // 快捷方法
  success(message, title = '') {
    return this.show({ type: 'success', title, message });
  },
  
  error(message, title = '') {
    return this.show({ type: 'error', title, message });
  },
  
  warning(message, title = '') {
    return this.show({ type: 'warning', title, message });
  },
  
  info(message, title = '') {
    return this.show({ type: 'info', title, message });
  }
};

// 导出
window.Toast = Toast;

