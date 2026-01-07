# 在线工具箱

自媒体内容生成工具集，帮助快速制作各平台的图文内容。

## 在线访问

https://your-domain.workers.dev/

## 功能列表

### 已实现

- **小红书助手** - 封面图和正文图生成，支持自动分页
- **产品助理** - AI 辅助生成原型图和 PRD
- **报告小助手** - AI 帮你写工作报告
- **基金助手** - 基金净值查询和自选管理
- **研发工具箱** - JSON/编码解码/时间戳/正则等 30+ 开发工具
- **短剧工坊** - AI 生成短视频脚本和分镜（管理员专属）

### 规划中

- **抖音工具** - 短视频脚本和封面生成
- **公众号工具** - 图文排版和封面设计
- **微博工具** - 长图文和九宫格图片生成

## 关联站点

- [AI 智能导航站](https://github.com/your-username/my-nav-site) - 精选实用网站导航
- [个人博客](https://github.com/your-username/my-blog-site) - 个人博客系统

## 技术栈

- HTML / CSS / JavaScript
- Canvas API（图片生成）
- Cloudflare Workers（部署 + API 代理）
- Supabase（用户认证 + 数据存储）

## 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/my-tools-site.git

# 安装依赖
npm install

# 启动本地开发服务器
npx wrangler dev --port 8787
```

## 部署

推送到 main 分支后，Cloudflare Pages 自动部署。

## 📄 许可证

MIT License
