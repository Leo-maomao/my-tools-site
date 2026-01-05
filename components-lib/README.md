# 组件库 Components Library

基于 CSS 变量的无主题组件库，支持通过 `ui-ux-pro-max-skill` 进行动态换肤。

## 📁 目录结构

```
components-lib/
├── base/              # 基础组件
├── navigation/        # 导航组件
├── data-entry/        # 数据录入
├── data-display/      # 数据展示
├── feedback/          # 反馈组件
├── layout/            # 布局组件
└── preview.html       # 组件预览
```

## 📦 组件清单（共 43 个）

### 📐 布局 Layout（5 个）

| 组件 | 目录 | 说明 |
|------|------|------|
| Container | `layout/container/` | 容器 |
| Grid | `layout/grid/` | 网格布局 |
| Card | `layout/card/` | 卡片 |
| Divider | `layout/divider/` | 分割线 |
| Footer | `layout/footer/` | 页脚 |

### 🔘 基础 Base（9 个）

| 组件 | 目录 | 说明 |
|------|------|------|
| Button | `base/button/` | 按钮 |
| Input | `base/input/` | 输入框 |
| Textarea | `base/textarea/` | 文本域（自定义滚动条） |
| Select | `base/select/` | 下拉选择 |
| Multi-Select | `base/multi-select/` | 多选下拉 |
| Cascader | `base/cascader/` | 级联选择 |
| Checkbox | `base/checkbox/` | 复选框 |
| Radio | `base/radio/` | 单选框 |
| Switch | `base/switch/` | 开关 |

### 🧭 导航 Navigation（8 个）

| 组件 | 目录 | 说明 |
|------|------|------|
| Navbar | `navigation/navbar/` | 顶部导航 |
| Menu | `navigation/menu/` | 侧边菜单 |
| Breadcrumb | `navigation/breadcrumb/` | 面包屑 |
| Dropdown | `navigation/dropdown/` | 下拉菜单 |
| Tabs | `navigation/tabs/` | 选项卡 |
| Steps | `navigation/steps/` | 步骤条 |
| Pagination | `navigation/pagination/` | 分页 |
| Back to Top | `navigation/back-to-top/` | 回到顶部 |

### 📝 数据录入 Data Entry（5 个）

| 组件 | 目录 | 说明 |
|------|------|------|
| Form | `data-entry/form/` | 表单布局 |
| Search | `data-entry/search/` | 搜索框 |
| Upload | `data-entry/upload/` | 文件上传 |
| Slider | `data-entry/slider/` | 滑块 |
| Rate | `data-entry/rate/` | 评分 |

### 📊 数据展示 Data Display（10 个）

| 组件 | 目录 | 说明 |
|------|------|------|
| Table | `data-display/table/` | 表格 |
| List | `data-display/list/` | 列表 |
| Tag | `data-display/tag/` | 标签 |
| Badge | `data-display/badge/` | 徽标 |
| Avatar | `data-display/avatar/` | 头像 |
| Image | `data-display/image/` | 图片 |
| Carousel | `data-display/carousel/` | 轮播图 |
| Timeline | `data-display/timeline/` | 时间线 |
| Empty | `data-display/empty/` | 空状态 |
| Collapse | `data-display/collapse/` | 折叠面板 |

### 💬 反馈 Feedback（8 个）

| 组件 | 目录 | 说明 |
|------|------|------|
| Modal | `feedback/modal/` | 弹窗 |
| Drawer | `feedback/drawer/` | 抽屉 |
| Toast | `feedback/toast/` | 轻提示 |
| Loading | `feedback/loading/` | 加载 |
| Tooltip | `feedback/tooltip/` | 文字提示 |
| Alert | `feedback/alert/` | 警告提示 |
| Progress | `feedback/progress/` | 进度条 |
| Skeleton | `feedback/skeleton/` | 骨架屏 |

## 🎨 换肤

组件库使用 CSS 变量定义所有样式参数，支持通过 `ui-ux-pro-max-skill` 生成主题配置。

### 核心变量

```css
:root {
  /* 品牌色 */
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  
  /* 背景色 */
  --bg-primary: #f8fafc;
  --bg-card: #ffffff;
  
  /* 文字色 */
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  
  /* 边框 */
  --border-color: #e5e7eb;
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 0.75rem;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

## 🚀 快速使用

1. 引入所需组件的 CSS 和 JS
2. 复制组件 HTML 结构
3. 根据需要覆盖 CSS 变量

```html
<!-- 引入组件 -->
<link rel="stylesheet" href="components-lib/base/button/style.css">

<!-- 使用组件 -->
<button class="btn btn-primary">按钮</button>
```
