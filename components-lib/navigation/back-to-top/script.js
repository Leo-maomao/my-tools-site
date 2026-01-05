/**
 * Back to Top 回到顶部组件
 */

class BackToTop {
  constructor(options = {}) {
    this.options = {
      threshold: 300,           // 滚动多少显示
      duration: 300,            // 滚动动画时长
      target: window,           // 滚动目标
      ...options
    };
    
    this.button = null;
    this.init();
  }
  
  init() {
    this.createButton();
    this.bindEvents();
  }
  
  createButton() {
    this.button = document.createElement('button');
    this.button.className = 'back-to-top';
    this.button.setAttribute('aria-label', '回到顶部');
    this.button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    `;
    
    document.body.appendChild(this.button);
  }
  
  bindEvents() {
    // 点击回到顶部
    this.button.addEventListener('click', () => {
      this.scrollToTop();
    });
    
    // 监听滚动
    const target = this.options.target === window ? window : document.querySelector(this.options.target);
    
    target.addEventListener('scroll', () => {
      this.toggleVisibility();
    }, { passive: true });
    
    // 初始检查
    this.toggleVisibility();
  }
  
  toggleVisibility() {
    const scrollTop = this.options.target === window 
      ? window.pageYOffset || document.documentElement.scrollTop
      : document.querySelector(this.options.target).scrollTop;
    
    if (scrollTop > this.options.threshold) {
      this.button.classList.add('back-to-top-visible');
    } else {
      this.button.classList.remove('back-to-top-visible');
    }
  }
  
  scrollToTop() {
    const target = this.options.target === window ? window : document.querySelector(this.options.target);
    
    target.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  
  destroy() {
    if (this.button) {
      this.button.remove();
    }
  }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  new BackToTop();
});

// 导出
window.BackToTop = BackToTop;

