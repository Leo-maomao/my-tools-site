document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.collapse-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.collapse-item');
      const collapse = item.closest('.collapse');
      const isAccordion = collapse.classList.contains('collapse-accordion');
      
      if (isAccordion) {
        collapse.querySelectorAll('.collapse-item').forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('collapse-item-active');
          }
        });
      }
      
      item.classList.toggle('collapse-item-active');
    });
  });
});

