/**
 * Multi-Select 多选下拉组件
 * 支持选择多个选项，显示为标签
 */

class MultiSelect {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      placeholder: '请选择',
      searchable: true,
      showActions: true,
      maxTags: Infinity,
      data: [],
      onChange: null,
      ...options
    };
    
    this.selectedValues = new Set();
    this.isOpen = false;
    
    this.init();
  }
  
  init() {
    this.render();
    this.bindEvents();
  }
  
  render() {
    this.element.innerHTML = `
      <div class="multi-select-trigger">
        <div class="multi-select-tags">
          <span class="multi-select-placeholder">${this.options.placeholder}</span>
        </div>
        <svg class="multi-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      <div class="multi-select-dropdown">
        ${this.options.searchable ? `
          <div class="multi-select-search">
            <input type="text" class="multi-select-search-input" placeholder="搜索...">
          </div>
        ` : ''}
        <ul class="multi-select-options"></ul>
        ${this.options.showActions ? `
          <div class="multi-select-actions">
            <button class="multi-select-action multi-select-select-all" type="button">全选</button>
            <button class="multi-select-action multi-select-clear-all" type="button">清空</button>
          </div>
        ` : ''}
      </div>
    `;
    
    this.trigger = this.element.querySelector('.multi-select-trigger');
    this.tagsContainer = this.element.querySelector('.multi-select-tags');
    this.dropdown = this.element.querySelector('.multi-select-dropdown');
    this.optionsList = this.element.querySelector('.multi-select-options');
    this.searchInput = this.element.querySelector('.multi-select-search-input');
    
    this.renderOptions();
  }
  
  renderOptions(filter = '') {
    const filteredData = this.options.data.filter(item => 
      item.label.toLowerCase().includes(filter.toLowerCase())
    );
    
    if (filteredData.length === 0) {
      this.optionsList.innerHTML = '<li class="multi-select-empty">无匹配结果</li>';
      return;
    }
    
    this.optionsList.innerHTML = filteredData.map(item => `
      <li class="multi-select-option ${this.selectedValues.has(item.value) ? 'multi-select-option-selected' : ''}" 
          data-value="${item.value}">
        <span class="multi-select-checkbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </span>
        <span class="multi-select-option-text">${item.label}</span>
      </li>
    `).join('');
  }
  
  renderTags() {
    if (this.selectedValues.size === 0) {
      this.tagsContainer.innerHTML = `<span class="multi-select-placeholder">${this.options.placeholder}</span>`;
      return;
    }
    
    const selectedItems = this.options.data.filter(item => this.selectedValues.has(item.value));
    const displayItems = selectedItems.slice(0, this.options.maxTags);
    const remainingCount = selectedItems.length - displayItems.length;
    
    this.tagsContainer.innerHTML = displayItems.map(item => `
      <span class="multi-select-tag" data-value="${item.value}">
        <span class="multi-select-tag-text">${item.label}</span>
        <button class="multi-select-tag-remove" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </span>
    `).join('') + (remainingCount > 0 ? `
      <span class="multi-select-tag">
        <span class="multi-select-tag-text">+${remainingCount}</span>
      </span>
    ` : '');
  }
  
  bindEvents() {
    // 点击触发器
    this.trigger.addEventListener('click', () => this.toggle());
    
    // 点击选项
    this.optionsList.addEventListener('click', (e) => {
      const option = e.target.closest('.multi-select-option');
      if (option) {
        const value = option.dataset.value;
        this.toggleValue(value);
      }
    });
    
    // 移除标签
    this.tagsContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.multi-select-tag-remove');
      if (removeBtn) {
        e.stopPropagation();
        const tag = removeBtn.closest('.multi-select-tag');
        this.removeValue(tag.dataset.value);
      }
    });
    
    // 搜索
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.renderOptions(e.target.value);
      });
    }
    
    // 全选/清空
    const selectAllBtn = this.element.querySelector('.multi-select-select-all');
    const clearAllBtn = this.element.querySelector('.multi-select-clear-all');
    
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => this.selectAll());
    }
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.clearAll());
    }
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target)) {
        this.close();
      }
    });
  }
  
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  
  open() {
    this.isOpen = true;
    this.element.classList.add('multi-select-open');
    if (this.searchInput) {
      this.searchInput.focus();
    }
  }
  
  close() {
    this.isOpen = false;
    this.element.classList.remove('multi-select-open');
    if (this.searchInput) {
      this.searchInput.value = '';
      this.renderOptions();
    }
  }
  
  toggleValue(value) {
    if (this.selectedValues.has(value)) {
      this.selectedValues.delete(value);
    } else {
      this.selectedValues.add(value);
    }
    this.update();
  }
  
  removeValue(value) {
    this.selectedValues.delete(value);
    this.update();
  }
  
  selectAll() {
    this.options.data.forEach(item => this.selectedValues.add(item.value));
    this.update();
  }
  
  clearAll() {
    this.selectedValues.clear();
    this.update();
  }
  
  update() {
    this.renderTags();
    this.renderOptions(this.searchInput?.value || '');
    
    if (this.options.onChange) {
      this.options.onChange(Array.from(this.selectedValues));
    }
  }
  
  getValue() {
    return Array.from(this.selectedValues);
  }
  
  setValue(values) {
    this.selectedValues = new Set(values);
    this.update();
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MultiSelect;
}

