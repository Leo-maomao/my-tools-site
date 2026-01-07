/**
 * Select 下拉选择组件
 * 
 * 使用方式：
 * const select = new Select(element, options);
 */

class Select {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      placeholder: '请选择',
      searchable: false,
      multiple: false,
      onChange: null,
      ...options
    };
    
    this.isOpen = false;
    this.selectedValues = [];
    
    this.init();
  }
  
  init() {
    this.trigger = this.element.querySelector('.select-trigger');
    this.dropdown = this.element.querySelector('.select-dropdown');
    this.valueDisplay = this.element.querySelector('.select-value');
    this.optionElements = this.element.querySelectorAll('.select-option');
    
    this.bindEvents();
  }
  
  bindEvents() {
    // 点击触发器
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    
    // 点击选项
    this.optionElements.forEach(option => {
      if (!option.classList.contains('select-option-disabled')) {
        option.addEventListener('click', () => {
          this.selectOption(option);
        });
      }
    });
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target)) {
        this.close();
      }
    });
    
    // 键盘导航
    this.trigger.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.toggle();
          break;
        case 'Escape':
          this.close();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!this.isOpen) this.open();
          this.focusNextOption();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.focusPrevOption();
          break;
      }
    });
  }
  
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  
  open() {
    this.isOpen = true;
    this.element.classList.add('select-open');
    this.trigger.setAttribute('aria-expanded', 'true');
  }
  
  close() {
    this.isOpen = false;
    this.element.classList.remove('select-open');
    this.trigger.setAttribute('aria-expanded', 'false');
  }
  
  selectOption(option) {
    const value = option.dataset.value || option.textContent;
    
    if (this.options.multiple) {
      // 多选逻辑
      const index = this.selectedValues.indexOf(value);
      if (index > -1) {
        this.selectedValues.splice(index, 1);
        option.classList.remove('select-option-selected');
      } else {
        this.selectedValues.push(value);
        option.classList.add('select-option-selected');
      }
      this.updateMultipleDisplay();
    } else {
      // 单选逻辑
      this.optionElements.forEach(opt => {
        opt.classList.remove('select-option-selected');
        opt.setAttribute('aria-selected', 'false');
      });
      option.classList.add('select-option-selected');
      option.setAttribute('aria-selected', 'true');
      this.selectedValues = [value];
      this.valueDisplay.textContent = option.textContent;
      this.trigger.removeAttribute('data-placeholder');
      this.close();
    }
    
    // 回调
    if (this.options.onChange) {
      this.options.onChange(this.options.multiple ? this.selectedValues : value);
    }
  }
  
  updateMultipleDisplay() {
    // 更新多选显示
    const tagsContainer = this.element.querySelector('.select-tags');
    if (tagsContainer) {
      tagsContainer.innerHTML = this.selectedValues.map(value => `
        <span class="select-tag">
          ${value}
          <button class="select-tag-remove" type="button" data-value="${value}">&times;</button>
        </span>
      `).join('');
      
      // 绑定删除事件
      tagsContainer.querySelectorAll('.select-tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const valueToRemove = btn.dataset.value;
          this.removeValue(valueToRemove);
        });
      });
    }
  }
  
  removeValue(value) {
    const index = this.selectedValues.indexOf(value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
      const option = Array.from(this.optionElements).find(
        opt => (opt.dataset.value || opt.textContent) === value
      );
      if (option) {
        option.classList.remove('select-option-selected');
      }
      this.updateMultipleDisplay();
      
      if (this.options.onChange) {
        this.options.onChange(this.selectedValues);
      }
    }
  }
  
  focusNextOption() {
    // 实现向下导航
  }
  
  focusPrevOption() {
    // 实现向上导航
  }
  
  setValue(value) {
    // 编程式设置值
    if (this.options.multiple) {
      this.selectedValues = Array.isArray(value) ? value : [value];
    } else {
      this.selectedValues = [value];
    }
    this.updateDisplay();
  }
  
  getValue() {
    return this.options.multiple ? this.selectedValues : this.selectedValues[0];
  }
  
  updateDisplay() {
    if (this.options.multiple) {
      this.updateMultipleDisplay();
    } else {
      const option = Array.from(this.optionElements).find(
        opt => (opt.dataset.value || opt.textContent) === this.selectedValues[0]
      );
      if (option) {
        this.valueDisplay.textContent = option.textContent;
        this.trigger.removeAttribute('data-placeholder');
      }
    }
    
    // 更新选项选中状态
    this.optionElements.forEach(opt => {
      const value = opt.dataset.value || opt.textContent;
      if (this.selectedValues.includes(value)) {
        opt.classList.add('select-option-selected');
        opt.setAttribute('aria-selected', 'true');
      } else {
        opt.classList.remove('select-option-selected');
        opt.setAttribute('aria-selected', 'false');
      }
    });
  }
}

// 自动初始化
function initSelects() {
  document.querySelectorAll('.select').forEach(el => {
    if (!el._selectInstance) {
      el._selectInstance = new Select(el);
    }
  });
}

// DOM 加载后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSelects);
} else {
  initSelects();
}

