class Slider {
  constructor(container) {
    this.container = container;
    this.track = container.querySelector('.slider-track');
    this.fill = container.querySelector('.slider-fill');
    this.thumb = container.querySelector('.slider-thumb');
    
    this.min = parseFloat(container.dataset.min) || 0;
    this.max = parseFloat(container.dataset.max) || 100;
    this.step = parseFloat(container.dataset.step) || 1;
    this.value = parseFloat(container.dataset.value) || this.min;
    
    this.isDragging = false;
    this.init();
  }
  
  init() {
    this.updateUI();
    
    this.thumb.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', () => this.endDrag());
    
    this.track.addEventListener('click', (e) => this.onClick(e));
  }
  
  startDrag(e) {
    e.preventDefault();
    this.isDragging = true;
  }
  
  onDrag(e) {
    if (!this.isDragging) return;
    this.updateValue(e.clientX);
  }
  
  endDrag() {
    this.isDragging = false;
  }
  
  onClick(e) {
    this.updateValue(e.clientX);
  }
  
  updateValue(clientX) {
    const rect = this.track.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let value = this.min + percent * (this.max - this.min);
    value = Math.round(value / this.step) * this.step;
    value = Math.max(this.min, Math.min(this.max, value));
    
    if (this.value !== value) {
      this.value = value;
      this.updateUI();
      this.container.dispatchEvent(new CustomEvent('change', { detail: { value } }));
    }
  }
  
  updateUI() {
    const percent = ((this.value - this.min) / (this.max - this.min)) * 100;
    this.fill.style.width = `${percent}%`;
    this.thumb.style.left = `${percent}%`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.slider').forEach(el => new Slider(el));
});

