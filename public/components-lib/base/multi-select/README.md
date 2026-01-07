# Multi-Select 多选下拉组件

支持选择多个选项，已选项显示为标签。

## 使用方法

### HTML 结构

```html
<div class="multi-select">
  <div class="multi-select-trigger">
    <div class="multi-select-tags">
      <!-- 未选择时显示占位符 -->
      <span class="multi-select-placeholder">请选择</span>
      
      <!-- 已选择时显示标签 -->
      <span class="multi-select-tag">
        <span class="multi-select-tag-text">选项1</span>
        <button class="multi-select-tag-remove">×</button>
      </span>
    </div>
    <svg class="multi-select-arrow">...</svg>
  </div>
  <div class="multi-select-dropdown">
    <ul class="multi-select-options">
      <li class="multi-select-option multi-select-option-selected">
        <span class="multi-select-checkbox">✓</span>
        <span class="multi-select-option-text">选项1</span>
      </li>
    </ul>
  </div>
</div>
```

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--multi-select-min-height` | `42px` | 最小高度 |
| `--multi-select-padding` | `0.375rem 0.75rem` | 内边距 |
| `--multi-select-bg` | `var(--bg-card)` | 背景色 |
| `--multi-select-border` | `var(--border-color)` | 边框色 |
| `--multi-select-radius` | `0.5rem` | 圆角 |

## 功能特性

- ✅ 多选支持
- ✅ 标签展示已选项
- ✅ 可搜索过滤
- ✅ 全选/清空
- ✅ 超长文字省略

## 使用场景

- 标签选择
- 多分类筛选
- 权限分配
- 技能选择

