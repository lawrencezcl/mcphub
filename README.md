# MCPHub - MCP 工具导航与发现平台

MCPHub 是一个智能化的 Model Context Protocol (MCP) 工具导航与发现平台，帮助开发者快速找到和使用 MCP 生态系统中的优秀工具。

## ✨ 特性

### 🤖 智能化内容处理
- **自动发现**：从 GitHub 和 NPM 自动发现 MCP 相关工具
- **AI 分析**：使用 DeepSeek API 智能分析工具功能和特性
- **质量评估**：基于多维度指标自动计算工具质量分数
- **智能分类**：自动识别工具类别和相关标签

### 🔍 强大的搜索功能
- **全文搜索**：支持工具名称和描述的全文搜索
- **多维筛选**：按分类、标签、运行时环境筛选
- **智能排序**：支持按热度、时间、名称等多种排序方式
- **实时搜索**：即时搜索结果反馈

### 🛠️ 完整的管理系统
- **管理后台**：完整的后台管理界面
- **审核流程**：人工审核确保内容质量
- **数据源管理**：灵活配置爬取数据源
- **任务监控**：实时监控爬取和处理任务

### 📊 性能与监控
- **多层缓存**：Edge 缓存 + 内存缓存优化性能
- **性能监控**：完整的性能指标收集和分析
- **健康检查**：系统健康状态实时监控
- **错误追踪**：结构化错误日志和追踪

## 🚀 技术架构

### 前端技术栈
- **Next.js 14**：App Router + TypeScript
- **Tailwind CSS**：现代化 CSS 框架
- **shadcn/ui**：高质量 UI 组件库
- **React Hook Form**：表单处理
- **Lucide React**：图标库

### 后端技术栈
- **Vercel Edge Runtime**：读取密集型 API
- **Node.js Runtime**：写入密集型任务
- **Drizzle ORM**：类型安全的数据库 ORM
- **Neon PostgreSQL**：现代化 PostgreSQL 数据库
- **DeepSeek API**：AI 内容分析

### 基础设施
- **Vercel**：部署和 CDN
- **GitHub Actions**：CI/CD 流水线
- **Vercel Cron**：定时任务调度

## 📦 安装和运行

### 环境要求
- Node.js 18+
- npm 或 yarn
- PostgreSQL 数据库（推荐使用 Neon）

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/your-username/mcphub.git
cd mcphub
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件：
```env
# 数据库配置
DATABASE_URL="your-postgresql-connection-string"

# 认证配置
ADMIN_TOKEN="your-admin-token"

# API 密钥
DEEPSEEK_API_KEY="your-deepseek-api-key"
GITHUB_TOKEN="your-github-token"

# 应用配置
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

4. **初始化数据库**
```bash
# 推送数据库 schema
npm run db:migrate

# 插入种子数据
npm run db:seed
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 生产部署

1. **部署到 Vercel**
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

2. **配置环境变量**
在 Vercel 控制台中配置以下环境变量：
- `DATABASE_URL`
- `ADMIN_TOKEN`
- `DEEPSEEK_API_KEY`
- `GITHUB_TOKEN`
- `CRON_SECRET`

3. **设置 Cron 任务**
Vercel 会自动根据 `vercel.json` 配置 Cron 任务。

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

### 开发流程
1. Fork 项目
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 和 Prettier 配置
- 编写测试覆盖新功能
- 更新相关文档

### 提交规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：
- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Vercel](https://vercel.com/) - 部署平台
- [DeepSeek](https://www.deepseek.com/) - AI 服务

## 📞 联系我们

- 项目主页：https://github.com/your-username/mcphub
- 问题反馈：https://github.com/your-username/mcphub/issues
- 邮箱：your-email@example.com

---

**MCPHub** - 让 MCP 工具发现变得简单 🚀
