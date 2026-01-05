# Drawer 抽屉组件

从屏幕边缘滑出的面板，用于承载更多内容。

## 使用方法

### HTML 结构

```html
<div class="drawer-overlay" id="my-drawer">
  <aside class="drawer drawer-right">
    <header class="drawer-header">
      <h3 class="drawer-title">标题</h3>
      <button class="drawer-close" type="button">
        <svg>...</svg>
      </button>
    </header>
    <div class="drawer-body">
      内容...
    </div>
    <footer class="drawer-footer">
      <button class="btn btn-outline">取消</button>
      <button class="btn btn-primary">确认</button>
    </footer>
  </aside>
</div>
```

### JavaScript 初始化

```javascript
const drawer = new Drawer(document.getElementById('my-drawer'), {
  closeOnOverlay: true,
  closeOnEscape: true,
  onOpen: () => console.log('opened'),
  onClose: () => console.log('closed')
});

// 打开
drawer.open();

// 关闭
drawer.close();
```

### 快捷方法

```javascript
const drawer = Drawer.open({
  title: '标题',
  content: '<p>内容</p>',
  position: 'right',
  size: 'lg',
  footer: '<button class="btn">按钮</button>',
  onClose: () => console.log('closed')
});

// 关闭
drawer.close();
```

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--drawer-width` | `400px` | 左右抽屉宽度 |
| `--drawer-height` | `300px` | 上下抽屉高度 |
| `--drawer-bg` | `var(--bg-card)` | 背景色 |
| `--drawer-overlay-bg` | `rgba(15, 23, 42, 0.5)` | 遮罩背景 |
| `--drawer-shadow` | `...` | 阴影 |

## 变体

### 位置

| 类名 | 说明 |
|------|------|
| `.drawer-right` | 右侧（默认） |
| `.drawer-left` | 左侧 |
| `.drawer-top` | 顶部 |
| `.drawer-bottom` | 底部 |

### 尺寸

| 类名 | 说明 |
|------|------|
| `.drawer-sm` | 小尺寸 (320px) |
| `.drawer-lg` | 大尺寸 (560px) |
| `.drawer-xl` | 超大 (720px) |
| `.drawer-full` | 全屏 |

## API

### 方法

| 方法 | 说明 |
|------|------|
| `open()` | 打开抽屉 |
| `close()` | 关闭抽屉 |
| `toggle()` | 切换状态 |
| `destroy()` | 销毁实例 |

