# Dropdown 下拉菜单

下拉菜单组件，用于展示操作列表。

## 使用方式

```html
<div class="dropdown">
  <button class="dropdown-trigger btn">
    菜单
    <svg class="dropdown-arrow">...</svg>
  </button>
  <div class="dropdown-menu">
    <a href="#" class="dropdown-item">菜单项</a>
  </div>
</div>
```

## 位置

| Class | 说明 |
|-------|------|
| （默认） | 左下对齐 |
| `.dropdown-right` | 右下对齐 |
| `.dropdown-up` | 向上展开 |

## 菜单项

| Class | 说明 |
|-------|------|
| `.dropdown-item` | 普通菜单项 |
| `.dropdown-item-active` | 选中状态 |
| `.dropdown-item-danger` | 危险操作（红色） |
| `.dropdown-item-disabled` | 禁用状态 |
| `.dropdown-divider` | 分割线 |
| `.dropdown-group-label` | 分组标签 |

## CSS 变量

```css
--dropdown-min-width: ;
--dropdown-bg: ;
--dropdown-border: ;
--dropdown-radius: ;
--dropdown-shadow: ;
--dropdown-item-padding: ;
--dropdown-item-hover-bg: ;
--dropdown-item-active-color: ;
--dropdown-item-active-bg: ;
```

## API

| 方法 | 说明 |
|------|------|
| `open()` | 打开菜单 |
| `close()` | 关闭菜单 |
| `toggle()` | 切换状态 |

