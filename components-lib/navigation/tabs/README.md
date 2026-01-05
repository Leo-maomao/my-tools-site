# Tabs 标签页组件

切换不同的内容区域。

## 使用方法

### 基础用法

```html
<div class="tabs">
  <nav class="tabs-nav" role="tablist">
    <button class="tabs-item tabs-item-active" role="tab">标签1</button>
    <button class="tabs-item" role="tab">标签2</button>
    <button class="tabs-item" role="tab">标签3</button>
  </nav>
  <div class="tabs-content">
    <div class="tabs-panel tabs-panel-active" role="tabpanel">内容1</div>
    <div class="tabs-panel" role="tabpanel">内容2</div>
    <div class="tabs-panel" role="tabpanel">内容3</div>
  </div>
</div>
```

### JavaScript 初始化

```javascript
const tabs = new Tabs(element, {
  activeIndex: 0,
  onChange: (index) => {
    console.log('切换到:', index);
  }
});
```

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--tabs-gap` | `0` | 标签间距 |
| `--tabs-item-padding` | `0.75rem 1rem` | 标签内边距 |
| `--tabs-font-size` | `0.875rem` | 字体大小 |
| `--tabs-nav-margin` | `1rem` | 导航底部边距 |

## 变体

| 类名 | 说明 |
|------|------|
| `.tabs-card` | 卡片式标签 |
| `.tabs-pill` | 胶囊式标签 |
| `.tabs-vertical` | 垂直布局 |
| `.tabs-sm` | 小尺寸 |
| `.tabs-lg` | 大尺寸 |
| `.tabs-centered` | 居中对齐 |
| `.tabs-justified` | 两端对齐 |

## API

### 方法

| 方法 | 说明 |
|------|------|
| `activate(index)` | 激活指定标签 |
| `getActiveIndex()` | 获取当前激活索引 |

