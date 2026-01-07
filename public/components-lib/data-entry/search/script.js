/**
 * Search 搜索组件
 */

class Search {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      suggestions: [],
      onSearch: null,
      onInput: null,
      onSuggestionSelect: null,
      debounceTime: 300,
      ...options
    };
    
    this.init();
  }
  
  init() {
    this.input = this.element.querySelector('.search-input');
    this.clearBtn = this.element.querySelector('.search-clear');
    this.suggestionsContainer = this.element.querySelector('.search-suggestions');
    
    this.bindEvents();
  }
  
  bindEvents() {
    // 输入事件
    let debounceTimer;
    this.input.addEventListener('input', () => {
      this.updateClearButton();
      
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (this.options.onInput) {
          this.options.onInput(this.input.value);
        }
      }, this.options.debounceTime);
    });
    
    // 清除按钮
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        this.clear();
      });
    }
    
    // 回车搜索
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.search();
      }
      
      // 上下键选择建议
      if (this.suggestionsContainer && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        this.navigateSuggestions(e.key === 'ArrowDown' ? 1 : -1);
      }
      
      // ESC 关闭建议
      if (e.key === 'Escape') {
        this.closeSuggestions();
      }
    });
    
    // 聚焦显示建议
    this.input.addEventListener('focus', () => {
      if (this.input.value && this.suggestionsContainer) {
        this.openSuggestions();
      }
    });
    
    // 失焦关闭建议
    this.input.addEventListener('blur', () => {
      setTimeout(() => this.closeSuggestions(), 150);
    });
    
    // 点击建议项
    if (this.suggestionsContainer) {
      this.suggestionsContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.search-suggestion-item');
        if (item && !item.classList.contains('search-suggestion-empty')) {
          this.selectSuggestion(item);
        }
      });
    }
    
    // 初始化清除按钮状态
    this.updateClearButton();
  }
  
  updateClearButton() {
    if (this.input.value) {
      this.element.classList.add('has-value');
    } else {
      this.element.classList.remove('has-value');
    }
  }
  
  clear() {
    this.input.value = '';
    this.element.classList.remove('has-value');
    this.input.focus();
    this.closeSuggestions();
    
    if (this.options.onInput) {
      this.options.onInput('');
    }
  }
  
  search() {
    const value = this.input.value.trim();
    if (this.options.onSearch) {
      this.options.onSearch(value);
    }
    this.closeSuggestions();
  }
  
  openSuggestions() {
    if (this.suggestionsContainer) {
      this.element.classList.add('search-open');
    }
  }
  
  closeSuggestions() {
    this.element.classList.remove('search-open');
  }
  
  navigateSuggestions(direction) {
    const items = this.suggestionsContainer.querySelectorAll('.search-suggestion-item:not(.search-suggestion-empty)');
    const currentActive = this.suggestionsContainer.querySelector('.search-suggestion-item-active');
    let nextIndex = 0;
    
    if (currentActive) {
      currentActive.classList.remove('search-suggestion-item-active');
      const currentIndex = Array.from(items).indexOf(currentActive);
      nextIndex = currentIndex + direction;
    } else {
      nextIndex = direction > 0 ? 0 : items.length - 1;
    }
    
    if (nextIndex < 0) nextIndex = items.length - 1;
    if (nextIndex >= items.length) nextIndex = 0;
    
    items[nextIndex]?.classList.add('search-suggestion-item-active');
  }
  
  selectSuggestion(item) {
    const text = item.textContent.trim();
    this.input.value = text;
    this.updateClearButton();
    this.closeSuggestions();
    
    if (this.options.onSuggestionSelect) {
      this.options.onSuggestionSelect(text);
    }
    
    this.search();
  }
  
  setValue(value) {
    this.input.value = value;
    this.updateClearButton();
  }
  
  getValue() {
    return this.input.value;
  }
}

// 自动初始化
document.querySelectorAll('.search').forEach(el => {
  if (!el.dataset.searchInit) {
    new Search(el);
    el.dataset.searchInit = 'true';
  }
});

// 导出
window.Search = Search;

