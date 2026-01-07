/**
 * Pagination 分页组件
 */

class Pagination {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      total: 0,
      pageSize: 10,
      current: 1,
      showTotal: false,
      showJumper: false,
      onChange: null,
      ...options
    };
    
    this.init();
  }
  
  init() {
    this.totalPages = Math.ceil(this.options.total / this.options.pageSize);
    this.current = Math.min(Math.max(1, this.options.current), this.totalPages);
    
    this.render();
    this.bindEvents();
  }
  
  render() {
    const { showTotal, showJumper, total } = this.options;
    
    let html = '';
    
    // 总数
    if (showTotal) {
      html += `<span class="pagination-total">共 ${total} 条</span>`;
    }
    
    // 上一页
    html += `
      <button class="pagination-item pagination-prev" aria-label="上一页" ${this.current <= 1 ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
    `;
    
    // 页码
    const pages = this.getPageNumbers();
    pages.forEach(page => {
      if (page === '...') {
        html += `<span class="pagination-ellipsis">...</span>`;
      } else {
        const isActive = page === this.current;
        html += `
          <button 
            class="pagination-item ${isActive ? 'pagination-item-active' : ''}" 
            data-page="${page}"
            ${isActive ? 'aria-current="page"' : ''}
          >${page}</button>
        `;
      }
    });
    
    // 下一页
    html += `
      <button class="pagination-item pagination-next" aria-label="下一页" ${this.current >= this.totalPages ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    `;
    
    // 跳转
    if (showJumper) {
      html += `
        <div class="pagination-jumper">
          <span>跳至</span>
          <input type="number" class="pagination-jumper-input" value="${this.current}" min="1" max="${this.totalPages}">
          <span>页</span>
        </div>
      `;
    }
    
    this.element.innerHTML = html;
  }
  
  getPageNumbers() {
    const pages = [];
    const total = this.totalPages;
    const current = this.current;
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, '...', total);
      } else if (current >= total - 2) {
        pages.push(1, '...', total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', total);
      }
    }
    
    return pages;
  }
  
  bindEvents() {
    this.element.addEventListener('click', (e) => {
      const btn = e.target.closest('.pagination-item');
      if (!btn || btn.disabled) return;
      
      if (btn.classList.contains('pagination-prev')) {
        this.goTo(this.current - 1);
      } else if (btn.classList.contains('pagination-next')) {
        this.goTo(this.current + 1);
      } else if (btn.dataset.page) {
        this.goTo(parseInt(btn.dataset.page, 10));
      }
    });
    
    // 跳转输入
    const jumperInput = this.element.querySelector('.pagination-jumper-input');
    if (jumperInput) {
      jumperInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const page = parseInt(jumperInput.value, 10);
          if (!isNaN(page)) {
            this.goTo(page);
          }
        }
      });
    }
  }
  
  goTo(page) {
    page = Math.min(Math.max(1, page), this.totalPages);
    if (page === this.current) return;
    
    this.current = page;
    this.render();
    this.bindEvents();
    
    if (this.options.onChange) {
      this.options.onChange(page);
    }
  }
  
  setTotal(total) {
    this.options.total = total;
    this.totalPages = Math.ceil(total / this.options.pageSize);
    this.current = Math.min(this.current, this.totalPages);
    this.render();
    this.bindEvents();
  }
}

// 导出
window.Pagination = Pagination;

