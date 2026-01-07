# Input 输入框

通用输入框组件，支持多种变体和状态。

## 使用方式

```html
<input type="text" class="input" placeholder="请输入">
```

## 带标签

```html
<div class="input-wrapper">
  <label class="input-label">标签</label>
  <input type="text" class="input" placeholder="请输入">
</div>
```

## 带图标

```html
<div class="input-group">
  <span class="input-prefix"><!-- icon --></span>
  <input type="text" class="input input-with-prefix" placeholder="搜索">
</div>
```

## 尺寸

| Class | 说明 |
|-------|------|
| `.input-sm` | 小尺寸 |
| （默认） | 中尺寸 |
| `.input-lg` | 大尺寸 |

## 状态

| Class | 说明 |
|-------|------|
| `.input-error` | 错误状态 |
| `.input-success` | 成功状态 |
| `disabled` | 禁用状态 |
| `readonly` | 只读状态 |

## CSS 变量

```css
--input-bg: ;
--input-color: ;
--input-border-color: ;
--input-border-width: ;
--input-radius: ;
--input-padding-x: ;
--input-padding-y: ;
--input-font-size: ;
--input-placeholder-color: ;
--input-focus-border: ;
--input-focus-shadow: ;
--input-disabled-bg: ;
--input-label-color: ;
--input-label-size: ;
```

