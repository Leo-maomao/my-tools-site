# Back to Top 回到顶部

滚动超过一定距离后显示的回到顶部按钮。

## 使用方式

### 自动初始化

引入脚本后自动创建按钮：

```html
<script src="back-to-top/script.js"></script>
```

### 手动初始化

```javascript
const backToTop = new BackToTop({
  threshold: 300,    // 滚动多少显示
  duration: 300      // 动画时长
});
```

## HTML 结构

```html
<button class="back-to-top" aria-label="回到顶部">
  <svg>...</svg>
</button>
```

## 样式变体

| Class | 说明 |
|-------|------|
| `.back-to-top-visible` | 显示状态 |
| `.back-to-top-rounded` | 圆形按钮 |
| `.back-to-top-with-text` | 带文字 |

## CSS 变量

```css
--back-to-top-right: ;
--back-to-top-bottom: ;
--back-to-top-size: ;
--back-to-top-bg: ;
--back-to-top-border: ;
--back-to-top-color: ;
--back-to-top-radius: ;
--back-to-top-shadow: ;
--back-to-top-hover-bg: ;
--back-to-top-hover-color: ;
```

