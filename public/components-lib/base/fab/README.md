# FAB 悬浮操作按钮

悬浮在页面角落的操作按钮，支持单个或多个按钮组合。

## 使用场景

- 回到顶部
- 在线客服/聊天
- 意见反馈
- 快速新建

## 基础用法

```html
<!-- 单个悬浮按钮 -->
<button class="fab" type="button" aria-label="操作">
  <svg>...</svg>
</button>

<!-- 悬浮按钮组 -->
<div class="fab-group">
  <button class="fab fab-success">...</button>
  <button class="fab">...</button>
  <button class="fab">...</button>
</div>
```

## 变体

| 类名 | 说明 |
|------|------|
| `.fab` | 默认样式（白底灰色图标） |
| `.fab-primary` | 主要按钮（蓝色） |
| `.fab-success` | 成功按钮（绿色） |
| `.fab-sm` | 小尺寸 |
| `.fab-lg` | 大尺寸 |
| `.fab-hidden` | 隐藏状态 |
| `.fab-visible` | 显示状态 |

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--fab-size` | `3rem` | 按钮尺寸 |
| `--fab-icon-size` | `1.25rem` | 图标尺寸 |
| `--fab-right` | `1.5rem` | 右边距 |
| `--fab-bottom` | `1.5rem` | 下边距 |
| `--fab-gap` | `0.75rem` | 按钮组间距 |
| `--fab-bg` | `#ffffff` | 背景色 |
| `--fab-color` | `#6b7280` | 图标颜色 |
| `--fab-shadow` | `...` | 阴影 |

## 回到顶部功能

配合 JS 控制显示/隐藏：

```javascript
const backToTop = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTop.classList.remove('fab-hidden');
    backToTop.classList.add('fab-visible');
  } else {
    backToTop.classList.remove('fab-visible');
    backToTop.classList.add('fab-hidden');
  }
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
```

