# Checkbox 复选框

自定义复选框组件。

## 使用方式

```html
<label class="checkbox">
  <input type="checkbox" class="checkbox-input">
  <span class="checkbox-box">
    <svg class="checkbox-icon">...</svg>
  </span>
  <span class="checkbox-label">复选框</span>
</label>
```

## 状态

| 状态 | 实现方式 |
|------|---------|
| 选中 | `checked` 属性 |
| 禁用 | `disabled` + `.checkbox-disabled` |
| 半选 | `.checkbox-indeterminate` |

## 尺寸

| Class | 说明 |
|-------|------|
| `.checkbox-sm` | 小尺寸 |
| （默认） | 中尺寸 |
| `.checkbox-lg` | 大尺寸 |

## CSS 变量

```css
--checkbox-size: ;
--checkbox-bg: ;
--checkbox-border-color: ;
--checkbox-border-width: ;
--checkbox-radius: ;
--checkbox-checked-bg: ;
--checkbox-checked-border: ;
--checkbox-gap: ;
--checkbox-label-size: ;
--checkbox-label-color: ;
```

