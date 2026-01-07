/**
 * Cascader 级联选择组件
 * 支持多级联动选择
 */

class Cascader {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      placeholder: '请选择',
      separator: ' / ',
      data: [],
      expandTrigger: 'click', // click | hover
      changeOnSelect: false, // 选择即改变，还是只有选择叶子节点才改变
      onChange: null,
      onLoad: null, // 动态加载
      ...options
    };
    
    this.selectedPath = []; // 选中的路径
    this.expandedPath = []; // 展开的路径
    this.isOpen = false;
    
    this.init();
  }
  
  init() {
    this.render();
    this.bindEvents();
  }
  
  render() {
    this.element.innerHTML = `
      <button class="cascader-trigger" type="button">
        <span class="cascader-value cascader-placeholder">${this.options.placeholder}</span>
        <svg class="cascader-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      <div class="cascader-dropdown"></div>
    `;
    
    this.trigger = this.element.querySelector('.cascader-trigger');
    this.valueDisplay = this.element.querySelector('.cascader-value');
    this.dropdown = this.element.querySelector('.cascader-dropdown');
  }
  
  renderMenus() {
    let menus = [];
    let currentData = this.options.data;
    
    // 第一级菜单
    menus.push(this.renderMenu(currentData, 0));
    
    // 根据展开路径渲染后续菜单
    for (let i = 0; i < this.expandedPath.length; i++) {
      const expandedValue = this.expandedPath[i];
      const expandedItem = this.findItemInLevel(currentData, expandedValue);
      
      if (expandedItem && expandedItem.children && expandedItem.children.length > 0) {
        currentData = expandedItem.children;
        menus.push(this.renderMenu(currentData, i + 1));
      } else {
        break;
      }
    }
    
    this.dropdown.innerHTML = menus.join('');
  }
  
  renderMenu(data, level) {
    if (!data || data.length === 0) {
      return `<div class="cascader-empty">暂无数据</div>`;
    }
    
    const selectedValue = this.selectedPath[level];
    const expandedValue = this.expandedPath[level];
    
    return `
      <ul class="cascader-menu" data-level="${level}">
        ${data.map(item => {
          const isSelected = item.value === selectedValue;
          const isExpanded = item.value === expandedValue;
          const hasChildren = item.children && item.children.length > 0;
          const isDisabled = item.disabled;
          const isLoading = item.loading;
          
          return `
            <li class="cascader-option ${isSelected || isExpanded ? 'cascader-option-selected' : ''} ${isDisabled ? 'cascader-option-disabled' : ''}"
                data-value="${item.value}"
                data-level="${level}"
                data-has-children="${hasChildren}">
              <span class="cascader-option-text">${item.label}</span>
              ${isLoading ? `
                <span class="cascader-option-loading"></span>
              ` : hasChildren ? `
                <svg class="cascader-option-expand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              ` : `
                <svg class="cascader-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              `}
            </li>
          `;
        }).join('')}
      </ul>
    `;
  }
  
  findItemInLevel(data, value) {
    return data.find(item => item.value === value);
  }
  
  findItemByPath(path) {
    let currentData = this.options.data;
    let result = [];
    
    for (const value of path) {
      const item = this.findItemInLevel(currentData, value);
      if (item) {
        result.push(item);
        currentData = item.children || [];
      } else {
        break;
      }
    }
    
    return result;
  }
  
  bindEvents() {
    // 点击触发器
    this.trigger.addEventListener('click', () => this.toggle());
    
    // 点击选项
    this.dropdown.addEventListener('click', (e) => {
      const option = e.target.closest('.cascader-option');
      if (option && !option.classList.contains('cascader-option-disabled')) {
        this.handleOptionClick(option);
      }
    });
    
    // Hover 展开（如果配置）
    if (this.options.expandTrigger === 'hover') {
      this.dropdown.addEventListener('mouseenter', (e) => {
        const option = e.target.closest('.cascader-option');
        if (option && !option.classList.contains('cascader-option-disabled')) {
          this.handleOptionHover(option);
        }
      }, true);
    }
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target)) {
        this.close();
      }
    });
  }
  
  handleOptionClick(option) {
    const value = option.dataset.value;
    const level = parseInt(option.dataset.level, 10);
    const hasChildren = option.dataset.hasChildren === 'true';
    
    // 更新展开路径
    this.expandedPath = this.expandedPath.slice(0, level);
    this.expandedPath[level] = value;
    
    if (hasChildren) {
      // 有子级，展开
      this.renderMenus();
      
      if (this.options.changeOnSelect) {
        this.selectedPath = [...this.expandedPath];
        this.updateValue();
      }
    } else {
      // 无子级，选中并关闭
      this.selectedPath = [...this.expandedPath];
      this.updateValue();
      this.close();
    }
  }
  
  handleOptionHover(option) {
    const value = option.dataset.value;
    const level = parseInt(option.dataset.level, 10);
    const hasChildren = option.dataset.hasChildren === 'true';
    
    if (hasChildren) {
      this.expandedPath = this.expandedPath.slice(0, level);
      this.expandedPath[level] = value;
      this.renderMenus();
    }
  }
  
  updateValue() {
    const items = this.findItemByPath(this.selectedPath);
    
    if (items.length > 0) {
      const labels = items.map(item => item.label);
      this.valueDisplay.innerHTML = labels.map((label, i) => 
        i === labels.length - 1 ? label : `${label}<span class="cascader-separator">${this.options.separator}</span>`
      ).join('');
      this.valueDisplay.classList.remove('cascader-placeholder');
    } else {
      this.valueDisplay.textContent = this.options.placeholder;
      this.valueDisplay.classList.add('cascader-placeholder');
    }
    
    if (this.options.onChange) {
      this.options.onChange(this.selectedPath, items);
    }
  }
  
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  
  open() {
    this.isOpen = true;
    this.element.classList.add('cascader-open');
    this.expandedPath = [...this.selectedPath];
    this.renderMenus();
  }
  
  close() {
    this.isOpen = false;
    this.element.classList.remove('cascader-open');
  }
  
  getValue() {
    return [...this.selectedPath];
  }
  
  setValue(path) {
    this.selectedPath = [...path];
    this.updateValue();
  }
  
  setData(data) {
    this.options.data = data;
    this.selectedPath = [];
    this.expandedPath = [];
    this.updateValue();
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Cascader;
}

