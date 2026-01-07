# WeChat QR 微信二维码组件

悬浮在页面角落的微信二维码展示组件，适用于个人网站的微信联系或公众号关注。

## 使用方法

### 基础用法

```html
<div class="wechat-qr">
  <button class="wechat-qr-trigger" type="button" aria-label="微信联系">
    <svg><!-- WeChat Icon --></svg>
  </button>
  
  <div class="wechat-qr-popup">
    <img class="wechat-qr-image" src="your-qr-code.png" alt="微信二维码">
    <h4 class="wechat-qr-title">扫码添加微信</h4>
    <p class="wechat-qr-desc">备注「来源」更快通过</p>
  </div>
</div>
```

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--wechat-qr-right` | `1.5rem` | 距离右边距离 |
| `--wechat-qr-bottom` | `5rem` | 距离底部距离 |
| `--wechat-qr-size` | `2.75rem` | 触发按钮尺寸 |
| `--wechat-qr-bg` | `#07c160` | 按钮背景色（微信绿） |
| `--wechat-qr-popup-width` | `200px` | 弹出层宽度 |

## 变体

| 类名 | 说明 |
|------|------|
| `.wechat-qr-left` | 靠左显示 |
| `.wechat-qr-sm` | 小尺寸 |
| `.wechat-qr-lg` | 大尺寸 |

## 交互

- 悬停触发按钮显示二维码
- 移动端可以添加点击切换（需要 JS）

## 使用场景

- 个人博客/网站
- 作品集
- 独立开发者展示页

