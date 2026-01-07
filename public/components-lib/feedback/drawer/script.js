/**
 * Drawer 抽屉组件
 */

class Drawer {
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
    this.drawer = this.element.querySelector('.drawer');
    this.closeButtons = this.element.querySelectorAll('.drawer-close, [data-drawer-close]');
    
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
      this.escHandler = (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      };
      document.addEventListener('keydown', this.escHandler);
    }
  }
  
  open() {
    this.isOpen = true;
    
    // 防止页面收缩
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = scrollbarWidth + 'px';
    document.body.style.overflow = 'hidden';
    
    this.element.classList.add('drawer-open');
    
    // 聚焦到抽屉
    this.drawer.setAttribute('tabindex', '-1');
    this.drawer.focus();
    
    if (this.options.onOpen) {
      this.options.onOpen();
    }
  }
  
  close() {
    this.isOpen = false;
    this.element.classList.remove('drawer-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    if (this.options.onClose) {
      this.options.onClose();
    }
  }
  
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  
  destroy() {
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
    }
  }
}

/**
 * 快捷方法：创建并打开抽屉
 */
Drawer.open = function(options = {}) {
  const {
    title = '',
    content = '',
    position = 'right', // right, left, top, bottom
    size = '', // sm, lg, xl, full
    footer = null,
    onClose = null
  } = options;
  
  const sizeClass = size ? `drawer-${size}` : '';
  
  let footerHtml = '';
  if (footer) {
    footerHtml = `
      <footer class="drawer-footer">
        ${footer}
      </footer>
    `;
  }
  
  const html = `
    <div class="drawer-overlay drawer-open" id="temp-drawer">
      <aside class="drawer drawer-${position} ${sizeClass}">
        <header class="drawer-header">
          <h3 class="drawer-title">${title}</h3>
          <button class="drawer-close" type="button" aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </header>
        <div class="drawer-body">
          ${content}
        </div>
        ${footerHtml}
      </aside>
    </div>
  `;
  
  // 防止页面收缩
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.paddingRight = scrollbarWidth + 'px';
  document.body.style.overflow = 'hidden';
  
  document.body.insertAdjacentHTML('beforeend', html);
  
  const overlay = document.getElementById('temp-drawer');
  
  const cleanup = () => {
    overlay.classList.remove('drawer-open');
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, 300);
    if (onClose) onClose();
  };
  
  overlay.querySelector('.drawer-close').addEventListener('click', cleanup);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup();
  });
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      cleanup();
      document.removeEventListener('keydown', escHandler);
    }
  });
  
  return { close: cleanup };
};

// 导出
window.Drawer = Drawer;

