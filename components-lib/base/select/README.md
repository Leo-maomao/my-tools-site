# Select 下拉选择

自定义下拉选择组件，替代原生 select。

## 使用方式

```html
<div class="select">
  <button class="select-trigger" type="button">
    <span class="select-value">请选择</span>
    <svg class="select-arrow">...</svg>
  </button>
  <ul class="select-dropdown" role="listbox">
    <li class="select-option" role="option">选项一</li>
    <li class="select-option" role="option">选项二</li>
  </ul>
</div>
```

## JavaScript 初始化

```javascript
const select = new Select(element, {
  placeholder: '请选择',
  searchable: false,
  multiple: false,
  onChange: (value) => console.log(value)
});
```

## 功能

| 功能 | Class | 说明 |
|------|-------|------|
| 可搜索 | `.select-searchable` | 带搜索框 |
| 多选 | `.select-multiple` | 多选模式 |
| 分组 | `.select-group-label` | 选项分组 |

## 尺寸

| Class | 说明 |
|-------|------|
| `.select-sm` | 小尺寸 |
| （默认） | 中尺寸 |
| `.select-lg` | 大尺寸 |

## 选项状态

| Class | 说明 |
|-------|------|
| `.select-option-selected` | 选中状态 |
| `.select-option-hover` | 悬停状态 |
| `.select-option-disabled` | 禁用状态 |

## CSS 变量

```css
--select-bg: ;
--select-color: ;
--select-border-color: ;
--select-radius: ;
--select-padding-x: ;
--select-padding-y: ;
--select-font-size: ;
--select-dropdown-bg: ;
--select-dropdown-shadow: ;
--select-option-hover-bg: ;
--select-option-selected-bg: ;
--select-option-selected-color: ;
```

## API

| 方法 | 说明 |
|------|------|
| `open()` | 打开下拉 |
| `close()` | 关闭下拉 |
| `toggle()` | 切换状态 |
| `setValue(value)` | 设置值 |
| `getValue()` | 获取值 |

