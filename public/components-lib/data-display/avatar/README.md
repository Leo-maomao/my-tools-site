# Avatar 头像组件

用于展示用户头像或文字标识。

## 使用方法

### 图片头像

```html
<span class="avatar">
  <img src="avatar.jpg" alt="用户头像">
</span>
```

### 文字头像

```html
<span class="avatar">张</span>
```

### 带状态

```html
<div class="avatar-wrapper">
  <span class="avatar">张</span>
  <span class="avatar-status avatar-status-online"></span>
</div>
```

### 头像组

```html
<div class="avatar-group">
  <span class="avatar avatar-bordered">...</span>
  <span class="avatar avatar-bordered">...</span>
  <span class="avatar-group-more">+5</span>
</div>
```

### 带文字信息

```html
<div class="avatar-with-info">
  <span class="avatar avatar-lg">张</span>
  <div class="avatar-info">
    <span class="avatar-name">张三</span>
    <span class="avatar-desc">前端工程师</span>
  </div>
</div>
```

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--avatar-size` | `2.5rem` | 尺寸 |
| `--avatar-font-size` | `1rem` | 字体大小 |
| `--avatar-color` | `#ffffff` | 文字颜色 |
| `--avatar-bg` | `var(--color-primary)` | 背景色 |
| `--avatar-radius` | `50%` | 圆角 |
| `--avatar-border` | `var(--bg-card)` | 边框颜色 |

## 变体

### 尺寸

| 类名 | 说明 |
|------|------|
| `.avatar-xs` | 超小 (1.5rem) |
| `.avatar-sm` | 小 (2rem) |
| `.avatar-lg` | 大 (3rem) |
| `.avatar-xl` | 超大 (4rem) |
| `.avatar-2xl` | 特大 (5rem) |

### 形状

| 类名 | 说明 |
|------|------|
| `.avatar-square` | 方形圆角 |

### 颜色

| 类名 | 说明 |
|------|------|
| `.avatar-secondary` | 灰色 |
| `.avatar-success` | 绿色 |
| `.avatar-warning` | 橙色 |
| `.avatar-danger` | 红色 |

### 状态

| 类名 | 说明 |
|------|------|
| `.avatar-status-online` | 在线 |
| `.avatar-status-offline` | 离线 |
| `.avatar-status-busy` | 忙碌 |
| `.avatar-status-away` | 离开 |

