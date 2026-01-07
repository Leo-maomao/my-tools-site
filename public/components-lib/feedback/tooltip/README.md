# Tooltip 文字提示组件

鼠标悬停显示提示信息。

## 使用方法

### 纯 CSS 用法

```html
<span class="tooltip">
  <button>按钮</button>
  <span class="tooltip-content">提示文字</span>
</span>
```

### Data 属性用法

```html
<button data-tooltip="提示文字" data-tooltip-position="bottom">
  悬停查看
</button>
```

### JavaScript 用法

```javascript
new Tooltip(element, {
  content: '提示文字',
  position: 'top', // top, bottom, left, right
  theme: 'dark',   // dark, light
  delay: 300       // 延迟显示（毫秒）
});
```

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--tooltip-padding` | `0.375rem 0.625rem` | 内边距 |
| `--tooltip-font-size` | `0.75rem` | 字体大小 |
| `--tooltip-color` | `#ffffff` | 文字颜色 |
| `--tooltip-bg` | `rgba(15, 23, 42, 0.9)` | 背景色 |
| `--tooltip-radius` | `0.375rem` | 圆角 |

## 变体

| 类名 | 说明 |
|------|------|
| `.tooltip-top` | 上方显示（默认） |
| `.tooltip-bottom` | 下方显示 |
| `.tooltip-left` | 左侧显示 |
| `.tooltip-right` | 右侧显示 |
| `.tooltip-light` | 浅色主题 |
| `.tooltip-multiline` | 多行文本 |
| `.tooltip-no-arrow` | 无箭头 |

## API

### 方法

| 方法 | 说明 |
|------|------|
| `show()` | 显示提示 |
| `hide()` | 隐藏提示 |
| `setContent(text)` | 设置内容 |
| `destroy()` | 销毁实例 |

