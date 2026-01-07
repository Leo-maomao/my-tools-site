/**
 * 文本域自定义滚动条
 * 确保滚动条与文本完全对齐
 */

class TextareaScrollbar {
  constructor(box) {
    this.box = box;
    this.input = box.querySelector('.textarea-input');
    this.track = box.querySelector('.textarea-track');
    this.thumb = box.querySelector('.textarea-thumb');
    
    if (!this.input || !this.track || !this.thumb) return;
    
    this.isDragging = false;
    this.startY = 0;
    this.startScrollTop = 0;
    
    this.init();
  }
  
  init() {
    this.input.addEventListener('scroll', () => this.update());
    this.input.addEventListener('input', () => this.update());
    
    this.thumb.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', () => this.endDrag());
    
    this.track.addEventListener('click', (e) => this.onTrackClick(e));
    
    this.update();
    
    if (window.ResizeObserver) {
      new ResizeObserver(() => this.update()).observe(this.box);
    }
  }
  
  update() {
    const { scrollHeight, clientHeight, scrollTop } = this.input;
    
    if (scrollHeight <= clientHeight) {
      this.thumb.style.display = 'none';
      return;
    }
    
    this.thumb.style.display = 'block';
    
    const trackHeight = this.track.clientHeight;
    const thumbHeight = Math.max(30, (clientHeight / scrollHeight) * trackHeight);
    this.thumb.style.height = `${thumbHeight}px`;
    
    const maxScrollTop = scrollHeight - clientHeight;
    const maxThumbTop = trackHeight - thumbHeight;
    const thumbTop = (scrollTop / maxScrollTop) * maxThumbTop;
    this.thumb.style.transform = `translateY(${thumbTop}px)`;
  }
  
  startDrag(e) {
    e.preventDefault();
    this.isDragging = true;
    this.startY = e.clientY;
    this.startScrollTop = this.input.scrollTop;
    this.thumb.style.background = 'var(--scrollbar-thumb-hover, #a3a3a3)';
  }
  
  onDrag(e) {
    if (!this.isDragging) return;
    
    const deltaY = e.clientY - this.startY;
    const { scrollHeight, clientHeight } = this.input;
    const trackHeight = this.track.clientHeight;
    const thumbHeight = this.thumb.clientHeight;
    const maxThumbTop = trackHeight - thumbHeight;
    const maxScrollTop = scrollHeight - clientHeight;
    
    const scrollDelta = (deltaY / maxThumbTop) * maxScrollTop;
    this.input.scrollTop = this.startScrollTop + scrollDelta;
  }
  
  endDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      this.thumb.style.background = '';
    }
  }
  
  onTrackClick(e) {
    if (e.target === this.thumb) return;
    
    const rect = this.track.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const { scrollHeight, clientHeight } = this.input;
    const trackHeight = this.track.clientHeight;
    const thumbHeight = this.thumb.clientHeight;
    const maxScrollTop = scrollHeight - clientHeight;
    const maxThumbTop = trackHeight - thumbHeight;
    
    const targetThumbTop = clickY - thumbHeight / 2;
    const scrollTop = (targetThumbTop / maxThumbTop) * maxScrollTop;
    
    this.input.scrollTo({
      top: Math.max(0, Math.min(scrollTop, maxScrollTop)),
      behavior: 'smooth'
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.textarea-box').forEach(box => {
    new TextareaScrollbar(box);
  });
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextareaScrollbar;
}
