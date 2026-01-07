# Modal 弹窗

模态弹窗组件。

## 使用方式

```html
<div class="modal-overlay" id="my-modal">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">标题</h3>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">内容</div>
    <div class="modal-footer">
      <button class="btn">取消</button>
      <button class="btn btn-primary">确认</button>
    </div>
  </div>
</div>
```

## JavaScript

```javascript
const modal = new Modal(document.getElementById('my-modal'));
modal.open();
modal.close();
```

## 确认对话框

```javascript
showConfirm({
  title: '确认删除？',
  message: '此操作无法撤销',
  type: 'danger',
  onConfirm: () => { /* 确认操作 */ }
});
```

## 尺寸

| Class | 宽度 |
|-------|------|
| `.modal-sm` | 400px |
| （默认） | 500px |
| `.modal-lg` | 800px |
| `.modal-xl` | 1140px |

## CSS 变量

```css
--modal-max-width: ;
--modal-bg: ;
--modal-radius: ;
--modal-shadow: ;
--modal-overlay-bg: ;
--modal-header-padding: ;
--modal-body-padding: ;
--modal-footer-padding: ;
```

