# Pagination 分页组件

用于数据分页展示。

## 使用方法

### 基础用法（静态 HTML）

```html
<nav class="pagination" aria-label="分页">
  <button class="pagination-item" aria-label="上一页">
    <svg>...</svg>
  </button>
  <button class="pagination-item">1</button>
  <button class="pagination-item pagination-item-active">2</button>
  <button class="pagination-item">3</button>
  <button class="pagination-item" aria-label="下一页">
    <svg>...</svg>
  </button>
</nav>
```

### JavaScript 动态渲染

```javascript
const pagination = new Pagination(element, {
  total: 100,
  pageSize: 10,
  current: 1,
  showTotal: true,
  showJumper: true,
  onChange: (page) => {
    console.log('当前页:', page);
  }
});
```

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--pagination-gap` | `0.25rem` | 间距 |
| `--pagination-item-size` | `2rem` | 项目尺寸 |
| `--pagination-font-size` | `0.875rem` | 字体大小 |

## 变体

| 类名 | 说明 |
|------|------|
| `.pagination-sm` | 小尺寸 |
| `.pagination-lg` | 大尺寸 |
| `.pagination-simple` | 简洁模式 |
| `.pagination-bordered` | 带边框 |

## API

### 方法

| 方法 | 说明 |
|------|------|
| `goTo(page)` | 跳转到指定页 |
| `setTotal(total)` | 设置总数 |

