# Table 表格组件

用于展示结构化数据。

## 使用方法

### 基础用法

```html
<div class="table-wrapper">
  <table class="table">
    <thead>
      <tr>
        <th>列标题</th>
        ...
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>数据</td>
        ...
      </tr>
    </tbody>
  </table>
</div>
```

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--table-radius` | `0.5rem` | 圆角 |
| `--table-border-color` | `var(--border-color)` | 边框颜色 |
| `--table-header-bg` | `var(--bg-secondary)` | 表头背景 |
| `--table-cell-padding` | `0.75rem 1rem` | 单元格内边距 |
| `--table-font-size` | `0.875rem` | 字体大小 |
| `--table-hover-bg` | `rgba(0,0,0,0.02)` | 悬停背景 |
| `--table-stripe-bg` | `var(--bg-secondary)` | 斑马纹背景 |

## 变体

| 类名 | 说明 |
|------|------|
| `.table-hover` | 行悬停效果 |
| `.table-striped` | 斑马纹 |
| `.table-compact` | 紧凑模式 |
| `.table-sortable` | 可排序 |
| `.table-selectable` | 可选中 |
| `.table-responsive` | 响应式（移动端卡片式） |

## 单元格辅助类

| 类名 | 说明 |
|------|------|
| `.table-cell-number` | 数字右对齐 |
| `.table-cell-actions` | 操作按钮容器 |
| `.table-status` | 状态标签 |
| `.table-status-success` | 成功状态 |
| `.table-status-warning` | 警告状态 |
| `.table-status-danger` | 危险状态 |
| `.table-status-info` | 信息状态 |

## 特殊状态

### 空状态

```html
<tr>
  <td colspan="全部列数">
    <div class="table-empty">
      <svg class="table-empty-icon">...</svg>
      <p>暂无数据</p>
    </div>
  </td>
</tr>
```

### 加载状态

给 `.table-wrapper` 添加 `.table-loading` 类。

### 响应式

给 `<table>` 添加 `.table-responsive`，并在 `<td>` 上添加 `data-label` 属性：

```html
<td data-label="名称">数据</td>
```

