# MCPHub - MCP 工具导航与发现平台

MCPHub 是一个智能化的 Model Context Protocol (MCP) 工具导航与发现平台，帮助开发者快速找到和使用 MCP 生态系统中的优秀工具。

🌐 **在线访问**: https://mcphub-6n3ir721e-lawrencezcls-projects.vercel.app

## 🎯 项目概述

MCPHub 致力于构建 MCP 生态系统的中心枢纽，通过智能化的内容发现、分析和管理，为开发者提供一站式的 MCP 工具发现和使用体验。

## ✨ 特性

### 🤖 智能化内容处理
- **自动发现**：从 GitHub 和 NPM 自动发现 MCP 相关工具
- **AI 分析**：使用 DeepSeek API 智能分析工具功能和特性
- **质量评估**：基于多维度指标自动计算工具质量分数
- **智能分类**：自动识别工具类别和相关标签
- **内容增强**：AI 生成详细的工具描述、使用指南和FAQ

### 🔍 强大的搜索功能
- **全文搜索**：支持工具名称和描述的全文搜索
- **多维筛选**：按分类、标签、运行时环境筛选
- **智能排序**：支持按热度、时间、名称等多种排序方式
- **实时搜索**：即时搜索结果反馈
- **搜索建议**：智能搜索建议和自动补全

### 🛠️ 完整的管理系统
- **管理后台**：完整的后台管理界面
- **审核流程**：人工审核确保内容质量
- **数据源管理**：灵活配置爬取数据源
- **任务监控**：实时监控爬取和处理任务
- **内容管理**：工具、分类、标签的完整CRUD操作

### 📊 性能与监控
- **多层缓存**：Edge 缓存 + 内存缓存优化性能
- **性能监控**：完整的性能指标收集和分析
- **健康检查**：系统健康状态实时监控
- **错误追踪**：结构化错误日志和追踪
- **审计日志**：完整的操作审计和追踪

### 🎨 用户体验
- **响应式设计**：完美适配桌面和移动设备
- **暗色模式**：支持明暗主题切换
- **收藏功能**：用户可收藏感兴趣的工具
- **分享功能**：支持多平台工具分享
- **无障碍访问**：遵循 WCAG 无障碍标准

## 🚀 技术架构

### 前端技术栈
- **Next.js 15**：App Router + TypeScript + React Server Components
- **Tailwind CSS**：现代化 CSS 框架 + 响应式设计
- **shadcn/ui**：高质量 UI 组件库
- **React Hook Form**：表单处理和验证
- **Lucide React**：现代图标库
- **Framer Motion**：动画和交互效果

### 后端技术栈
- **Vercel Edge Runtime**：读取密集型 API + 全球边缘计算
- **Node.js Runtime**：写入密集型任务 + 复杂业务逻辑
- **Drizzle ORM**：类型安全的数据库 ORM + 迁移管理
- **Neon PostgreSQL**：现代化 Serverless PostgreSQL 数据库
- **DeepSeek API**：AI 内容分析和生成
- **GitHub API**：代码仓库数据获取
- **NPM API**：包管理器数据获取

### 基础设施
- **Vercel**：部署、CDN 和边缘计算
- **GitHub Actions**：CI/CD 流水线和自动化测试
- **Vercel Cron**：定时任务调度和数据同步
- **Vercel Analytics**：性能监控和用户分析
- **Sentry**：错误追踪和性能监控（可选）

### 数据库架构
- **工具管理**：tools, categories, tags, tool_tags, tool_categories
- **用户系统**：users, favorites, likes, shares
- **内容管理**：submissions, ingests, audit_logs
- **爬虫系统**：sources, crawl_jobs, crawl_results, llm_jobs
- **统计分析**：views, performance metrics

## 📦 安装和运行

### 环境要求
- Node.js 18+ 
- npm 或 yarn 或 pnpm
- PostgreSQL 数据库（推荐使用 Neon）
- DeepSeek API 密钥（用于 AI 功能）

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/your-username/mcphub.git
cd mcphub
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. **配置环境变量**
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置以下环境变量：
```env
# 数据库连接
DATABASE_URL="postgresql://username:password@host:port/database"

# 管理员令牌
ADMIN_TOKEN="your-admin-token"

# NextAuth 配置
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# AI 服务配置
DEEPSEEK_API_KEY="your-deepseek-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"

# GitHub API（可选，用于增强数据获取）
GITHUB_TOKEN="your-github-token"

# 应用配置
NEXT_PUBLIC_APP_NAME="MCPHub"
NEXT_PUBLIC_APP_DESCRIPTION="MCP 工具导航与发现平台"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **初始化数据库**
```bash
# 生成数据库迁移
npm run db:generate

# 执行数据库迁移
npm run db:migrate

# 填充初始数据（可选）
npm run db:seed
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 生产部署（Vercel）

1. **安装 Vercel CLI**
```bash
npm i -g vercel
```

2. **部署到 Vercel**
```bash
vercel --prod
```

3. **配置环境变量**
在 Vercel 控制台或使用 CLI 配置生产环境变量：
```bash
# 设置数据库连接
vercel env add DATABASE_URL production

# 设置管理员令牌
vercel env add ADMIN_TOKEN production

# 设置 NextAuth 配置
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# 设置 AI 服务配置
vercel env add DEEPSEEK_API_KEY production
vercel env add DEEPSEEK_BASE_URL production

# 设置其他必要的环境变量
vercel env add GITHUB_TOKEN production
vercel env add NEXT_PUBLIC_APP_NAME production
vercel env add NEXT_PUBLIC_APP_DESCRIPTION production
vercel env add NEXT_PUBLIC_APP_URL production
```

4. **配置 Cron 任务**
在 `vercel.json` 中配置定时任务：
```json
{
  "crons": [
    {
      "path": "/api/cron/crawl",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/analyze",
      "schedule": "0 2 * * *"
    }
  ]
}
```

5. **数据库迁移**
部署后执行数据库迁移：
```bash
# 在本地连接生产数据库执行迁移
npm run db:migrate
```

## 🔧 开发指南

### 项目结构
```
mcphub/
├── app/                    # Next.js App Router 页面
│   ├── (admin)/           # 管理后台页面
│   ├── api/               # API 路由
│   ├── tools/             # 工具相关页面
│   └── ...
├── src/
│   ├── components/        # React 组件
│   ├── lib/              # 工具函数和配置
│   ├── db/               # 数据库相关
│   │   ├── schema.ts     # 数据库模式定义
│   │   └── migrations/   # 数据库迁移文件
│   └── types/            # TypeScript 类型定义
├── docs/                 # 项目文档
├── public/               # 静态资源
└── ...
```

### 数据库操作
```bash
# 生成新的迁移文件
npm run db:generate

# 执行数据库迁移
npm run db:migrate

# 查看数据库状态
npm run db:studio

# 重置数据库（开发环境）
npm run db:reset
```

### 代码质量
```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check

# 运行测试
npm run test

# 构建项目
npm run build
```

## 🎯 使用指南

### 用户功能

#### 浏览工具
- 访问 `/tools` 查看所有工具
- 使用搜索框进行关键词搜索
- 使用筛选器按分类、标签、运行时环境筛选
- 点击工具卡片查看详细信息

#### 工具详情
- 查看工具的详细描述和使用说明
- 获取安装命令和使用示例
- 查看工具的标签、分类和运行时支持
- 访问工具的 GitHub 仓库或官网

### 管理员功能

#### 访问管理后台
1. 访问 `/admin`
2. 使用管理员令牌进行 API 认证

#### 数据源管理
- 配置 GitHub Topics 和 NPM 查询
- 启用/禁用数据源
- 设置爬取参数和阈值

#### 审核工具
- 查看待审核的工具入库请求
- 审核 AI 分析结果
- 批准或拒绝工具入库
- 添加审核备注

#### 任务监控
- 查看爬取任务执行状态
- 监控 LLM 处理队列
- 查看系统性能指标
- 检查错误日志

## 🔧 API 文档

### 公开 API

#### 获取工具列表
```http
GET /api/tools?page=1&pageSize=20&q=search&category=ai-ml&tag=typescript&runtime=node&sort=popular&order=desc
```

#### 获取工具详情
```http
GET /api/tools/[slug]
```

#### 获取分类列表
```http
GET /api/categories
```

#### 获取标签列表
```http
GET /api/tags
```

### 管理员 API

#### 获取待审核项目
```http
GET /api/admin/ingests
Authorization: Bearer your-admin-token
```

#### 审核工具
```http
POST /api/admin/ingests
Authorization: Bearer your-admin-token
Content-Type: application/json

{
  "ingestId": 123,
  "action": "approve",
  "reason": "工具质量良好，符合入库标准"
}
```

#### 手动触发爬虫
```http
GET /api/cron/crawl?sourceId=1
Authorization: Bearer your-admin-token
```

#### 获取系统指标
```http
GET /api/metrics
Authorization: Bearer your-admin-token
```

### 系统 API

#### 健康检查
```http
GET /api/health
```

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 启动测试 UI
npm run test:ui
```

### 测试类型
- **单元测试**：API 验证、工具函数测试
- **集成测试**：数据库操作、外部 API 调用
- **E2E 测试**：完整用户流程测试

## 📈 性能优化

### 缓存策略
- **Edge 缓存**：静态内容和 API 响应
- **内存缓存**：数据库查询结果
- **标签失效**：智能缓存失效机制

### 数据库优化
- **索引优化**：关键字段建立索引
- **查询优化**：避免 N+1 查询
- **连接池**：数据库连接复用

### 前端优化
- **代码分割**：按路由分割代码
- **图片优化**：Next.js Image 组件
- **预加载**：关键资源预加载

## 🔒 安全措施

### 认证授权
- **管理员认证**：基于令牌的认证
- **权限控制**：细粒度权限管理
- **会话管理**：安全的会话处理

### 数据保护
- **输入验证**：Zod 严格验证
- **SQL 注入防护**：ORM 参数化查询
- **XSS 防护**：内容转义和 CSP

### 速率限制
- **API 限流**：防止滥用
- **IP 限制**：基于 IP 的访问控制
- **请求监控**：异常请求检测

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

### 提交工具
1. 访问平台首页，点击"提交工具"按钮
2. 填写工具的基本信息（名称、描述、仓库地址等）
3. 提交后等待管理员审核
4. 审核通过后工具将出现在平台上

### 代码贡献
1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

### 报告问题
- 使用 GitHub Issues 报告 bug 或提出功能请求
- 提供详细的问题描述和复现步骤
- 包含相关的错误日志和环境信息

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢以下项目和服务：
- [Next.js](https://nextjs.org/) - React 全栈框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Vercel](https://vercel.com/) - 部署平台
- [DeepSeek](https://www.deepseek.com/) - AI 服务

## 📞 联系我们

- 项目主页：https://mcphub-6n3ir721e-lawrencezcls-projects.vercel.app
- GitHub：https://github.com/your-username/mcphub
- 问题反馈：https://github.com/your-username/mcphub/issues

---

**MCPHub** - 让 MCP 工具发现变得简单 🚀
