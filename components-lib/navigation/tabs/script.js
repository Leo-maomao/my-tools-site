/**
 * Tabs 标签页组件
 */

class Tabs {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      activeIndex: 0,
      onChange: null,
      ...options
    };
    
    this.init();
  }
  
  init() {
    this.nav = this.element.querySelector('.tabs-nav');
    this.items = this.element.querySelectorAll('.tabs-item');
    this.panels = this.element.querySelectorAll('.tabs-panel');
    
    this.bindEvents();
    
    // 如果没有激活项，激活第一个
    if (!this.element.querySelector('.tabs-item-active')) {
      this.activate(this.options.activeIndex);
    }
  }
  
  bindEvents() {
    this.items.forEach((item, index) => {
      item.addEventListener('click', () => {
        if (!item.disabled && !item.classList.contains('tabs-item-disabled')) {
          this.activate(index);
        }
      });
      
      // 键盘导航
      item.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const direction = e.key === 'ArrowRight' ? 1 : -1;
          this.navigateTo(index + direction);
        }
      });
    });
  }
  
  activate(index) {
    if (index < 0 || index >= this.items.length) return;
    
    const item = this.items[index];
    if (item.disabled || item.classList.contains('tabs-item-disabled')) return;
    
    // 更新标签状态
    this.items.forEach((tab, i) => {
      tab.classList.toggle('tabs-item-active', i === index);
      tab.setAttribute('aria-selected', i === index);
    });
    
    // 更新面板状态
    this.panels.forEach((panel, i) => {
      panel.classList.toggle('tabs-panel-active', i === index);
    });
    
    if (this.options.onChange) {
      this.options.onChange(index);
    }
  }
  
  navigateTo(index) {
    // 循环导航
    if (index < 0) index = this.items.length - 1;
    if (index >= this.items.length) index = 0;
    
    // 跳过禁用项
    const item = this.items[index];
    if (item.disabled || item.classList.contains('tabs-item-disabled')) {
      this.navigateTo(index + (index > this.getActiveIndex() ? 1 : -1));
      return;
    }
    
    this.activate(index);
    item.focus();
  }
  
  getActiveIndex() {
    return Array.from(this.items).findIndex(item => 
      item.classList.contains('tabs-item-active')
    );
  }
}

// 自动初始化
document.querySelectorAll('.tabs').forEach(el => {
  if (!el.dataset.tabsInit) {
    new Tabs(el);
    el.dataset.tabsInit = 'true';
  }
});

// 导出
window.Tabs = Tabs;

