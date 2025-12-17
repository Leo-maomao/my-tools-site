/**
 * Ant Design 风格 UI 组件库
 * 包含：Select, Input, Button, Message, Modal 等组件
 */

(function(global) {
  'use strict';

  var UI = {};

  // ============================================
  // Select 下拉组件
  // ============================================
  UI.Select = (function() {
    function init(container) {
      var root = container || document;
      var selects = root.querySelectorAll('select:not([data-ui-init])');
      selects.forEach(function(select) {
        create(select);
      });

      // 全局事件：点击外部关闭
      if (!UI.Select._bindGlobal) {
        UI.Select._bindGlobal = true;
        document.addEventListener('click', function(e) {
          if (!e.target.closest('.ui-select')) {
            closeAll();
          }
        });
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') closeAll();
        });
      }
    }

    function create(select) {
      if (select.dataset.uiInit) return;
      select.dataset.uiInit = 'true';

      var wrapper = document.createElement('div');
      wrapper.className = 'ui-select';
      if (select.className) {
        // 保留原有的尺寸类
        if (select.classList.contains('select-sm')) wrapper.classList.add('ui-select--sm');
        if (select.classList.contains('select-lg')) wrapper.classList.add('ui-select--lg');
      }

      var trigger = document.createElement('div');
      trigger.className = 'ui-select-trigger';
      trigger.setAttribute('tabindex', '0');

      var dropdown = document.createElement('div');
      dropdown.className = 'ui-select-dropdown';

      // 初始化显示
      var valueSpan = document.createElement('span');
      valueSpan.className = 'ui-select-value';
      updateValue(select, valueSpan);
      trigger.appendChild(valueSpan);

      renderOptions(dropdown, select);

      select.parentNode.insertBefore(wrapper, select);
      wrapper.appendChild(trigger);
      wrapper.appendChild(dropdown);
      wrapper.appendChild(select);

      // 事件绑定
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!select.disabled) toggle(wrapper);
      });

      trigger.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!select.disabled) toggle(wrapper);
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (!wrapper.classList.contains('is-open')) open(wrapper);
          navigateOptions(wrapper, e.key === 'ArrowDown' ? 1 : -1);
        }
      });

      dropdown.addEventListener('click', function(e) {
        var opt = e.target.closest('.ui-select-option');
        if (opt && !opt.classList.contains('is-disabled')) {
          selectValue(wrapper, opt.dataset.value);
          close(wrapper);
        }
      });

      select.addEventListener('change', function() {
        updateValue(select, valueSpan);
        updateOptions(wrapper);
      });

      if (select.disabled) trigger.classList.add('is-disabled');
    }

    function renderOptions(dropdown, select) {
      dropdown.innerHTML = '';
      var opts = select.options;
      for (var i = 0; i < opts.length; i++) {
        var div = document.createElement('div');
        div.className = 'ui-select-option';
        div.dataset.value = opts[i].value;
        div.textContent = opts[i].text;
        if (opts[i].selected) div.classList.add('is-selected');
        if (opts[i].disabled) div.classList.add('is-disabled');
        dropdown.appendChild(div);
      }
    }

    function updateValue(select, span) {
      var opt = select.options[select.selectedIndex];
      span.textContent = opt ? opt.text : '请选择';
      span.classList.toggle('is-placeholder', !opt || !opt.value);
    }

    function updateOptions(wrapper) {
      var select = wrapper.querySelector('select');
      var opts = wrapper.querySelectorAll('.ui-select-option');
      opts.forEach(function(opt) {
        opt.classList.toggle('is-selected', opt.dataset.value === select.value);
      });
    }

    function selectValue(wrapper, value) {
      var select = wrapper.querySelector('select');
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function toggle(wrapper) {
      wrapper.classList.contains('is-open') ? close(wrapper) : open(wrapper);
    }

    function open(wrapper) {
      closeAll();

      // 检测是否需要向上展开
      var rect = wrapper.getBoundingClientRect();
      var dropdown = wrapper.querySelector('.ui-select-dropdown');
      var dropdownHeight = 200; // 预估下拉高度
      var spaceBelow = window.innerHeight - rect.bottom;

      if (spaceBelow < dropdownHeight && rect.top > spaceBelow) {
        wrapper.classList.add('is-open-up');
      } else {
        wrapper.classList.remove('is-open-up');
      }

      wrapper.classList.add('is-open');
    }

    function close(wrapper) {
      wrapper.classList.remove('is-open');
    }

    function closeAll() {
      document.querySelectorAll('.ui-select.is-open').forEach(function(el) {
        el.classList.remove('is-open');
      });
    }

    function navigateOptions(wrapper, dir) {
      var opts = wrapper.querySelectorAll('.ui-select-option:not(.is-disabled)');
      var current = wrapper.querySelector('.ui-select-option.is-focused');
      var idx = -1;

      if (current) {
        current.classList.remove('is-focused');
        opts.forEach(function(o, i) { if (o === current) idx = i; });
      }

      idx += dir;
      if (idx < 0) idx = opts.length - 1;
      if (idx >= opts.length) idx = 0;

      if (opts[idx]) {
        opts[idx].classList.add('is-focused');
        opts[idx].scrollIntoView({ block: 'nearest' });
      }
    }

    function refresh(select) {
      var wrapper = select.closest('.ui-select');
      if (wrapper) {
        renderOptions(wrapper.querySelector('.ui-select-dropdown'), select);
        updateValue(select, wrapper.querySelector('.ui-select-value'));
      }
    }

    return { init: init, create: create, refresh: refresh, closeAll: closeAll };
  })();

  // ============================================
  // Message 消息提示
  // ============================================
  UI.Message = (function() {
    var container = null;

    function getContainer() {
      if (!container) {
        container = document.createElement('div');
        container.className = 'ui-message-container';
        document.body.appendChild(container);
      }
      return container;
    }

    function show(content, type, duration) {
      type = type || 'info';
      duration = duration !== undefined ? duration : 3000;

      var msg = document.createElement('div');
      msg.className = 'ui-message ui-message--' + type;

      var icons = {
        success: 'ri-checkbox-circle-fill',
        error: 'ri-close-circle-fill',
        warning: 'ri-error-warning-fill',
        info: 'ri-information-fill'
      };

      msg.innerHTML = '<i class="' + icons[type] + '"></i><span>' + content + '</span>';
      getContainer().appendChild(msg);

      // 动画进入
      requestAnimationFrame(function() {
        msg.classList.add('is-visible');
      });

      // 自动关闭
      if (duration > 0) {
        setTimeout(function() {
          msg.classList.remove('is-visible');
          setTimeout(function() { msg.remove(); }, 300);
        }, duration);
      }

      return msg;
    }

    return {
      success: function(content, duration) { return show(content, 'success', duration); },
      error: function(content, duration) { return show(content, 'error', duration); },
      warning: function(content, duration) { return show(content, 'warning', duration); },
      info: function(content, duration) { return show(content, 'info', duration); }
    };
  })();

  // ============================================
  // Modal 弹窗
  // ============================================
  UI.Modal = (function() {
    function show(options) {
      var opts = Object.assign({
        title: '',
        content: '',
        okText: '确定',
        cancelText: '取消',
        showCancel: true,
        onOk: null,
        onCancel: null,
        width: 420
      }, options);

      var modal = document.createElement('div');
      modal.className = 'ui-modal';
      modal.innerHTML =
        '<div class="ui-modal-mask"></div>' +
        '<div class="ui-modal-wrap">' +
          '<div class="ui-modal-content" style="width:' + opts.width + 'px">' +
            '<div class="ui-modal-header">' +
              '<span class="ui-modal-title">' + opts.title + '</span>' +
              '<button class="ui-modal-close"><i class="ri-close-line"></i></button>' +
            '</div>' +
            '<div class="ui-modal-body">' + opts.content + '</div>' +
            '<div class="ui-modal-footer">' +
              (opts.showCancel ? '<button class="ui-btn ui-btn--default ui-modal-cancel">' + opts.cancelText + '</button>' : '') +
              '<button class="ui-btn ui-btn--primary ui-modal-ok">' + opts.okText + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      document.body.appendChild(modal);
      requestAnimationFrame(function() { modal.classList.add('is-visible'); });

      function close() {
        modal.classList.remove('is-visible');
        setTimeout(function() { modal.remove(); }, 200);
      }

      modal.querySelector('.ui-modal-close').onclick = function() {
        if (opts.onCancel) opts.onCancel();
        close();
      };
      modal.querySelector('.ui-modal-mask').onclick = function() {
        if (opts.onCancel) opts.onCancel();
        close();
      };
      if (opts.showCancel) {
        modal.querySelector('.ui-modal-cancel').onclick = function() {
          if (opts.onCancel) opts.onCancel();
          close();
        };
      }
      modal.querySelector('.ui-modal-ok').onclick = function() {
        if (opts.onOk) opts.onOk();
        close();
      };

      return { close: close, el: modal };
    }

    function confirm(options) {
      return show(Object.assign({ showCancel: true }, options));
    }

    function alert(options) {
      return show(Object.assign({ showCancel: false }, options));
    }

    return { show: show, confirm: confirm, alert: alert };
  })();

  // ============================================
  // Loading 加载
  // ============================================
  UI.Loading = (function() {
    var current = null;

    function show(text) {
      if (current) return current;

      current = document.createElement('div');
      current.className = 'ui-loading';
      current.innerHTML =
        '<div class="ui-loading-mask"></div>' +
        '<div class="ui-loading-content">' +
          '<i class="ri-loader-4-line ui-spin"></i>' +
          (text ? '<span>' + text + '</span>' : '') +
        '</div>';

      document.body.appendChild(current);
      requestAnimationFrame(function() { current.classList.add('is-visible'); });
      return current;
    }

    function hide() {
      if (current) {
        current.classList.remove('is-visible');
        setTimeout(function() {
          if (current) { current.remove(); current = null; }
        }, 200);
      }
    }

    return { show: show, hide: hide };
  })();

  // ============================================
  // Tooltip 工具提示
  // ============================================
  UI.Tooltip = (function() {
    function init() {
      document.querySelectorAll('[data-tooltip]').forEach(function(el) {
        if (el.dataset.tooltipInit) return;
        el.dataset.tooltipInit = 'true';

        el.addEventListener('mouseenter', function() {
          show(el, el.dataset.tooltip);
        });
        el.addEventListener('mouseleave', function() {
          hide(el);
        });
      });
    }

    function show(el, text) {
      var tip = document.createElement('div');
      tip.className = 'ui-tooltip';
      tip.textContent = text;
      document.body.appendChild(tip);

      var rect = el.getBoundingClientRect();
      tip.style.left = rect.left + rect.width / 2 - tip.offsetWidth / 2 + 'px';
      tip.style.top = rect.top - tip.offsetHeight - 8 + window.scrollY + 'px';

      requestAnimationFrame(function() { tip.classList.add('is-visible'); });
      el._tooltip = tip;
    }

    function hide(el) {
      if (el._tooltip) {
        el._tooltip.remove();
        el._tooltip = null;
      }
    }

    return { init: init };
  })();

  // ============================================
  // 初始化
  // ============================================
  UI.init = function(container) {
    UI.Select.init(container);
    UI.Tooltip.init();
  };

  // 暴露全局
  global.UI = UI;

  // DOM Ready 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { UI.init(); });
  } else {
    UI.init();
  }

})(window);
