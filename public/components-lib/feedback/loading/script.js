/**
 * Loading 加载组件
 */

const Loading = {
  overlay: null,
  
  // 显示全屏 Loading
  show(text = '加载中...') {
    if (this.overlay) return;
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'loading-overlay';
    this.overlay.innerHTML = `
      <div class="loading loading-lg">
        <div class="loading-spinner"></div>
        ${text ? `<span class="loading-text">${text}</span>` : ''}
      </div>
    `;
    
    document.body.appendChild(this.overlay);
    document.body.style.overflow = 'hidden';
  },
  
  // 隐藏全屏 Loading
  hide() {
    if (!this.overlay) return;
    
    this.overlay.remove();
    this.overlay = null;
    document.body.style.overflow = '';
  },
  
  // 区域 Loading
  wrap(element, text = '加载中...') {
    if (!element) return;
    
    // 确保元素有相对定位
    const position = getComputedStyle(element).position;
    if (position === 'static') {
      element.style.position = 'relative';
    }
    
    // 创建遮罩
    const mask = document.createElement('div');
    mask.className = 'loading-mask';
    mask.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        ${text ? `<span class="loading-text">${text}</span>` : ''}
      </div>
    `;
    
    element.appendChild(mask);
    element._loadingMask = mask;
    
    return {
      hide: () => {
        if (element._loadingMask) {
          element._loadingMask.remove();
          delete element._loadingMask;
        }
      }
    };
  },
  
  // 移除区域 Loading
  unwrap(element) {
    if (!element || !element._loadingMask) return;
    
    element._loadingMask.remove();
    delete element._loadingMask;
  }
};

// 导出
window.Loading = Loading;

