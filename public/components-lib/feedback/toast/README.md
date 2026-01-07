# Toast 轻提示

轻量级的消息提示组件。

## 使用方式

```javascript
// 初始化（可选，设置位置）
Toast.init('top-right');

// 显示提示
Toast.success('保存成功');
Toast.error('操作失败');
Toast.warning('请注意');
Toast.info('提示信息');

// 带标题
Toast.success('数据已保存到服务器', '保存成功');

// 完整配置
Toast.show({
  type: 'success',
  title: '标题',
  message: '消息内容',
  duration: 3000,
  closable: true
});
```

## 位置

- `top-right`（默认）
- `top-left`
- `top-center`
- `bottom-right`
- `bottom-left`
- `bottom-center`

## 类型

| 类型 | 方法 |
|------|------|
| 成功 | `Toast.success()` |
| 错误 | `Toast.error()` |
| 警告 | `Toast.warning()` |
| 信息 | `Toast.info()` |

## CSS 变量

```css
--toast-min-width: ;
--toast-max-width: ;
--toast-bg: ;
--toast-padding: ;
--toast-radius: ;
--toast-shadow: ;
```

