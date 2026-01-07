class Rate {
  constructor(container) {
    this.container = container;
    this.stars = container.querySelectorAll('.rate-star');
    this.value = parseFloat(container.dataset.value) || 0;
    this.readonly = container.classList.contains('rate-readonly');
    
    if (!this.readonly) {
      this.init();
    }
    this.render();
  }
  
  init() {
    this.stars.forEach((star, index) => {
      star.addEventListener('click', () => this.setValue(index + 1));
      star.addEventListener('mouseenter', () => this.highlight(index + 1));
    });
    
    this.container.addEventListener('mouseleave', () => this.render());
  }
  
  setValue(value) {
    this.value = value;
    this.container.dataset.value = value;
    this.render();
    this.container.dispatchEvent(new CustomEvent('change', { detail: { value } }));
  }
  
  highlight(value) {
    this.stars.forEach((star, index) => {
      star.classList.toggle('rate-star-active', index < value);
    });
  }
  
  render() {
    this.stars.forEach((star, index) => {
      star.classList.toggle('rate-star-active', index < this.value);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.rate').forEach(el => new Rate(el));
});

