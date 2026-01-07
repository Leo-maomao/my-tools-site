/**
 * Dropdown 下拉菜单组件
 */

class Dropdown {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      closeOnClick: true,
      closeOnOutsideClick: true,
      selectable: element.hasAttribute('data-selectable'), // 是否支持选中后更新触发器
      ...options
    };
    
    this.isOpen = false;
    this.init();
  }
  
  init() {
    this.trigger = this.element.querySelector('.dropdown-trigger');
    this.menu = this.element.querySelector('.dropdown-menu');
    this.valueDisplay = this.element.querySelector('.dropdown-value');
    
    this.bindEvents();
  }
  
  bindEvents() {
    // 点击触发器
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    
    // 点击菜单项
    this.menu.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // 阻止 # 链接跳转
        if (item.getAttribute('href') === '#' || item.getAttribute('href') === 'javascript:void(0)') {
          e.preventDefault();
        }
        if (!item.classList.contains('dropdown-item-disabled')) {
          // 选中后更新触发器文字
          if (this.options.selectable && this.valueDisplay) {
            // 移除其他选项的选中状态
            this.menu.querySelectorAll('.dropdown-item').forEach(i => {
              i.classList.remove('dropdown-item-active');
            });
            // 添加当前选项的选中状态
            item.classList.add('dropdown-item-active');
            // 更新触发器显示的文字
            this.valueDisplay.textContent = item.textContent.trim();
          }
          if (this.options.closeOnClick) {
            this.close();
          }
        }
      });
    });
    
    // 点击外部关闭
    if (this.options.closeOnOutsideClick) {
      document.addEventListener('click', (e) => {
        if (!this.element.contains(e.target)) {
          this.close();
        }
      });
    }
    
    // ESC 关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
        this.trigger.focus();
      }
    });
    
    // 键盘导航
    this.trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.open();
        this.focusFirstItem();
      }
    });
    
    this.menu.addEventListener('keydown', (e) => {
      const items = Array.from(this.menu.querySelectorAll('.dropdown-item:not(.dropdown-item-disabled)'));
      const currentIndex = items.indexOf(document.activeElement);
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < items.length - 1) {
            items[currentIndex + 1].focus();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            items[currentIndex - 1].focus();
          }
          break;
        case 'Home':
          e.preventDefault();
          items[0]?.focus();
          break;
        case 'End':
          e.preventDefault();
          items[items.length - 1]?.focus();
          break;
      }
    });
  }
  
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  
  open() {
    this.isOpen = true;
    this.element.classList.add('dropdown-open');
    this.trigger.setAttribute('aria-expanded', 'true');
  }
  
  close() {
    this.isOpen = false;
    this.element.classList.remove('dropdown-open');
    this.trigger.setAttribute('aria-expanded', 'false');
  }
  
  focusFirstItem() {
    const firstItem = this.menu.querySelector('.dropdown-item:not(.dropdown-item-disabled)');
    firstItem?.focus();
  }
}

// 自动初始化
function initDropdowns() {
  document.querySelectorAll('.dropdown').forEach(el => {
    if (!el._dropdownInstance) {
      el._dropdownInstance = new Dropdown(el);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDropdowns);
} else {
  initDropdowns();
}

