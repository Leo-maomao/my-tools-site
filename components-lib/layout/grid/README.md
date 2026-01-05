# Grid 网格

网格布局组件，支持 CSS Grid 和 Flexbox 两种模式。

## CSS Grid

```html
<div class="grid grid-cols-3">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>
```

## 响应式网格

```html
<div class="grid grid-responsive">
  <!-- 自动适应，最小 280px -->
</div>
```

## Flex 栅格（12列）

```html
<div class="row">
  <div class="col-4">4/12</div>
  <div class="col-8">8/12</div>
</div>
```

## CSS 变量

```css
--grid-gap: ;
--grid-min-width: ;
--row-gap: ;
```

