# Badge 徽标

用于展示数字或状态的徽标组件。

## 使用方式

```html
<!-- 附着在元素上 -->
<div class="badge-wrapper">
  <button class="btn">消息</button>
  <span class="badge">5</span>
</div>

<!-- 小红点 -->
<div class="badge-wrapper">
  <span>通知</span>
  <span class="badge badge-dot"></span>
</div>
```

## 颜色

| Class | 说明 |
|-------|------|
| （默认） | 红色 |
| `.badge-primary` | 主色 |
| `.badge-success` | 绿色 |
| `.badge-warning` | 橙色 |
| `.badge-danger` | 红色 |

## 样式

| Class | 说明 |
|-------|------|
| `.badge-dot` | 小红点 |
| `.badge-standalone` | 独立使用 |
| `.badge-status` | 状态徽标 |

## CSS 变量

```css
--badge-min-width: ;
--badge-height: ;
--badge-padding-x: ;
--badge-font-size: ;
--badge-color: ;
--badge-bg: ;
--badge-radius: ;
--badge-dot-size: ;
```

