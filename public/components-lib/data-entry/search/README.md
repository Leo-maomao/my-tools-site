# Search 搜索组件

搜索输入框，支持清除按钮、搜索建议等功能。

## 使用方法

### 基础用法

```html
<div class="search">
  <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
  <input type="text" class="search-input" placeholder="搜索...">
  <button class="search-clear" type="button" aria-label="清除">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  </button>
</div>
```

### JavaScript 初始化

```javascript
const search = new Search(element, {
  debounceTime: 300,
  onSearch: (value) => {
    console.log('搜索:', value);
  },
  onInput: (value) => {
    console.log('输入:', value);
  }
});
```

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--search-max-width` | `400px` | 最大宽度 |
| `--search-padding` | `0.5rem 2.5rem` | 内边距 |
| `--search-bg` | `var(--bg-secondary)` | 背景色 |
| `--search-border` | `transparent` | 边框颜色 |
| `--search-radius` | `9999px` | 圆角 |
| `--search-font-size` | `0.875rem` | 字体大小 |

## 变体

- `.search-sm` - 小尺寸
- `.search-lg` - 大尺寸
- `.search-bordered` - 带边框样式

## API

### 方法

| 方法 | 说明 |
|------|------|
| `clear()` | 清空输入 |
| `search()` | 触发搜索 |
| `setValue(value)` | 设置值 |
| `getValue()` | 获取值 |
| `openSuggestions()` | 打开建议 |
| `closeSuggestions()` | 关闭建议 |

