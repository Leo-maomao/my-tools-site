/**
 * Tooltip 文字提示组件
 * 支持通过 data-tooltip 属性快速创建
 */

class Tooltip {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      content: '',
      position: 'top', // top, bottom, left, right
      theme: 'dark', // dark, light
      delay: 0,
      ...options
    };
    
    this.init();
  }
  
  init() {
    this.createTooltip();
    this.bindEvents();
  }
  
  createTooltip() {
    this.tooltipEl = document.createElement('span');
    this.tooltipEl.className = 'tooltip-content';
    this.tooltipEl.textContent = this.options.content;
    
    this.wrapper = document.createElement('span');
    this.wrapper.className = `tooltip tooltip-${this.options.position}`;
    if (this.options.theme === 'light') {
      this.wrapper.classList.add('tooltip-light');
    }
    
    this.element.parentNode.insertBefore(this.wrapper, this.element);
    this.wrapper.appendChild(this.element);
    this.wrapper.appendChild(this.tooltipEl);
  }
  
  bindEvents() {
    this.wrapper.addEventListener('mouseenter', () => {
      if (this.options.delay > 0) {
        this.showTimer = setTimeout(() => this.show(), this.options.delay);
      } else {
        this.show();
      }
    });
    
    this.wrapper.addEventListener('mouseleave', () => {
      if (this.showTimer) {
        clearTimeout(this.showTimer);
      }
      this.hide();
    });
  }
  
  show() {
    this.wrapper.classList.add('tooltip-visible');
  }
  
  hide() {
    this.wrapper.classList.remove('tooltip-visible');
  }
  
  setContent(content) {
    this.tooltipEl.textContent = content;
  }
  
  destroy() {
    this.wrapper.parentNode.insertBefore(this.element, this.wrapper);
    this.wrapper.remove();
  }
}

/**
 * 自动初始化带 data-tooltip 属性的元素
 */
function initDataTooltips() {
  document.querySelectorAll('[data-tooltip]').forEach(el => {
    if (el.dataset.tooltipInit) return;
    
    const content = el.dataset.tooltip;
    const position = el.dataset.tooltipPosition || 'top';
    const theme = el.dataset.tooltipTheme || 'dark';
    
    new Tooltip(el, { content, position, theme });
    el.dataset.tooltipInit = 'true';
  });
}

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', initDataTooltips);

// 导出
window.Tooltip = Tooltip;
window.initDataTooltips = initDataTooltips;

