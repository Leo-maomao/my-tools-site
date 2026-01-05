# Admin Login 管理员登录组件

隐藏式的管理员登录入口，支持键盘快捷键触发和 Supabase Auth 集成。

## 功能特性

- 🔐 键盘快捷键触发 (默认 `Ctrl+Shift+L`)
- 🗄️ Supabase Auth 无缝集成
- 💾 持久化登录状态
- 🎨 现代化设计风格
- ♿ 无障碍支持

## 使用方法

### 基础用法（无 Supabase）

```javascript
const adminLogin = new AdminLogin({
  onLogin: (user) => {
    console.log('已登录:', user);
    // 显示管理功能
  },
  onLogout: () => {
    console.log('已登出');
    // 隐藏管理功能
  }
});
```

### 集成 Supabase

```javascript
const adminLogin = new AdminLogin({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key',
  onLogin: (user) => {
    console.log('已登录:', user);
  }
});
```

### 自定义快捷键

```javascript
const adminLogin = new AdminLogin({
  shortcut: {
    ctrl: true,
    shift: false,
    key: 'k'
  }
});
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `supabaseUrl` | `string` | `''` | Supabase 项目 URL |
| `supabaseKey` | `string` | `''` | Supabase anon key |
| `shortcut.ctrl` | `boolean` | `true` | 是否需要 Ctrl |
| `shortcut.shift` | `boolean` | `true` | 是否需要 Shift |
| `shortcut.key` | `string` | `'l'` | 触发键 |
| `onLogin` | `function` | `null` | 登录成功回调 |
| `onLogout` | `function` | `null` | 登出回调 |

## API

### 方法

| 方法 | 说明 |
|------|------|
| `open()` | 打开登录弹窗 |
| `close()` | 关闭登录弹窗 |
| `login()` | 执行登录 |
| `logout()` | 执行登出 |
| `isLoggedIn()` | 检查是否已登录 |
| `getUser()` | 获取当前用户信息 |

## CSS 变量

组件使用全局 CSS 变量，可通过修改主题变量来调整样式。

## 使用场景

1. **个人博客/网站**: 作者需要快速进入编辑模式
2. **作品集**: 需要管理展示内容
3. **工具站**: 需要管理配置或数据

## 安全建议

- 使用 Supabase RLS（行级安全）保护数据
- 不要在前端代码中硬编码敏感信息
- 定期更换 API 密钥

