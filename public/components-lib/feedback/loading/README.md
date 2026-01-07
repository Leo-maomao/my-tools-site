# Loading 加载

加载状态组件，支持多种展示形式。

## 使用方式

### 行内 Loading

```html
<div class="loading">
  <div class="loading-spinner"></div>
  <span class="loading-text">加载中...</span>
</div>
```

### 全屏 Loading

```javascript
Loading.show('加载中...');
// 完成后
Loading.hide();
```

### 区域 Loading

```javascript
const loader = Loading.wrap(element, '加载中...');
// 完成后
loader.hide();
```

## 尺寸

| Class | 说明 |
|-------|------|
| `.loading-sm` | 小尺寸 |
| （默认） | 中尺寸 |
| `.loading-lg` | 大尺寸 |

## 样式变体

| 组件 | 说明 |
|------|------|
| `.loading-spinner` | 圆形旋转 |
| `.loading-dots` | 点状跳动 |
| `.loading-bar` | 进度条 |
| `.skeleton` | 骨架屏 |

## CSS 变量

```css
--loading-size: ;
--loading-color: ;
--loading-track: ;
--loading-border-width: ;
--loading-text-color: ;
--skeleton-bg: ;
```

