class Carousel {
  constructor(container) {
    this.container = container;
    this.track = container.querySelector('.carousel-track');
    this.slides = container.querySelectorAll('.carousel-slide');
    this.prevBtn = container.querySelector('.carousel-prev');
    this.nextBtn = container.querySelector('.carousel-next');
    this.dots = container.querySelectorAll('.carousel-dot');
    
    this.currentIndex = 0;
    this.slideCount = this.slides.length;
    this.autoPlayInterval = null;
    this.autoPlayDelay = parseInt(container.dataset.autoplay) || 0;
    
    this.init();
  }
  
  init() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }
    
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goTo(index));
    });
    
    if (this.autoPlayDelay > 0) {
      this.startAutoPlay();
      this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
      this.container.addEventListener('mouseleave', () => this.startAutoPlay());
    }
  }
  
  goTo(index) {
    if (index < 0) index = this.slideCount - 1;
    if (index >= this.slideCount) index = 0;
    
    this.currentIndex = index;
    this.track.style.transform = `translateX(-${index * 100}%)`;
    
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('carousel-dot-active', i === index);
    });
  }
  
  prev() {
    this.goTo(this.currentIndex - 1);
  }
  
  next() {
    this.goTo(this.currentIndex + 1);
  }
  
  startAutoPlay() {
    if (this.autoPlayDelay > 0) {
      this.autoPlayInterval = setInterval(() => this.next(), this.autoPlayDelay);
    }
  }
  
  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.carousel').forEach(el => new Carousel(el));
});

