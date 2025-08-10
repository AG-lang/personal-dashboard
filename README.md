# 个人仪表盘 Personal Dashboard

基于 Next.js 和 FastAPI 的现代个人仪表盘应用。

## 技术栈

### 前端

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query v5
- shadcn/ui 组件库

### 后端

- Python 3.11+
- FastAPI
- SQLModel (ORM)
- PostgreSQL

## 开发环境设置

### 快速启动

**Windows:**

```bash
# 双击运行
dev.bat
```

**Linux/Mac:**

```bash
# 执行脚本
./dev.sh
```

### 手动启动

#### 1. 安装依赖

```bash
# 安装前端依赖
cd frontend
pnpm install

# 安装后端依赖
cd ../api
# 使用 uv 创建虚拟环境并安装依赖 (推荐)
uv venv
source .venv\Scripts\activate  # Windows
# source .venv/bin/activate    # Linux/Mac
uv pip install -r requirements.txt
```

#### 2. 环境变量配置

复制根目录 `.env.example` 到 `.env.local`（后端环境变量：数据库、密钥等），并配置数据库连接：

```bash
cp .env.example .env.local
```

**注意：** 首次运行前需要创建 PostgreSQL 数据库，或者使用 SQLite 进行本地开发。

#### 3. 启动开发服务器

```bash
# 启动前端开发服务器
cd frontend
pnpm dev

# 启动后端开发服务器（新终端）
cd api
uvicorn app.main:app --reload --port 8000
```

前端将运行在 `http://localhost:3000`
后端 API 将运行在 `http://localhost:8000`
如需前端本地代理后端，请在 `frontend/.env.local` 设置：`NEXT_PUBLIC_API_URL=http://localhost:8000`

### 功能访问

- 首页：<http://localhost:3000>
- Todo 任务管理：<http://localhost:3000/todos>
- 笔记反思：<http://localhost:3000/notes>
- 番茄钟专注：<http://localhost:3000/pomodoro>
- 间隔重复记忆：<http://localhost:3000/flashcards>
- 工具管理：<http://localhost:3000/tools>
- 命令记忆库：<http://localhost:3000/commands>
- 配色生成：<http://localhost:3000/palette>
- API 文档：<http://localhost:8000/docs>

### 数据库配置

#### 使用 PostgreSQL (生产推荐)

```bash
# .env.local
POSTGRES_URL="postgresql://username:password@localhost:5432/personal_dashboard"
```

#### 使用 SQLite (开发环境)

```bash
# .env.local
POSTGRES_URL="sqlite:///./personal_dashboard.db"
```

## 部署到 Vercel

1. 连接 Git 仓库并导入项目
2. Framework 选择 Next.js（根目录），构建命令 `cd frontend && pnpm build`，输出目录 `frontend/.next`
3. Serverless Functions: `api/app/main.py`（Python 3.11，见 `vercel.json`）
4. 配置环境变量（生产环境）：
   - `POSTGRES_URL`：Vercel Postgres 连接串或自建数据库
   - `SECRET_KEY`：JWT 加密密钥（强随机字符串）
   - 可选：移除前端 `NEXT_PUBLIC_API_URL` 以使用相对路径 `/api`
5. 一键部署

> 说明：本仓库已提供 `vercel.json`，会将 `/api/*` 路由指向 FastAPI，静态资源与 Next.js 走 `frontend`。前端请求默认走 `/api`，本地开发通过 `frontend/.env.local` 将代理指到 `http://localhost:8000`。

### Vercel 环境变量清单

- `POSTGRES_URL_NON_POOLING`：Serverless 推荐连接（Vercel Postgres 提供）
- `POSTGRES_URL`：数据库连接，生产必填（如未提供 NON_POOLING）
- `SECRET_KEY`：后端 JWT 密钥，生产必填
- `NEXT_PUBLIC_API_URL`（前端）：仅用于本地开发，放在 `frontend/.env.local`（例如 `http://localhost:8000`）；生产环境建议不设置，走相对路径 `/api`

### 本地与生产的 URL 行为

- 本地：`frontend/next.config.js` 将 `/api` 代理到 `NEXT_PUBLIC_API_URL`（`frontend/.env.local`，默认 `http://localhost:8000`）
- 生产：前端使用 `/api` 相对路径，Vercel 根据 `vercel.json` 将其转发到 FastAPI 函数

## 项目结构

```
├── frontend/          # Next.js 前端应用
│   ├── src/
│   │   ├── app/       # 应用路由和页面
│   │   │   ├── todos/ # Todo 任务管理页面
│   │   │   ├── notes/ # 笔记反思页面
│   │   │   ├── pomodoro/ # 番茄钟专注页面
│   │   │   ├── flashcards/ # 间隔重复记忆页面
│   │   │   ├── tools/ # 工具管理页面
│   │   │   ├── commands/ # 命令记忆库页面
│   │   │   ├── palette/ # 配色生成页面
│   │   │   └── ...
│   │   ├── components/ # React 组件
│   │   │   ├── ui/    # 基础 UI 组件
│   │   │   ├── TodoList.tsx
│   │   │   ├── NoteList.tsx
│   │   │   ├── PomodoroTimer.tsx
│   │   │   ├── PomodoroStats.tsx
│   │   │   ├── FlashcardForm.tsx
│   │   │   ├── FlashcardList.tsx
│   │   │   ├── FlashcardItem.tsx
│   │   │   ├── FlashcardStats.tsx
│   │   │   ├── FlashcardReview.tsx
│   │   │   ├── ToolForm.tsx
│   │   │   ├── ToolList.tsx
│   │   │   ├── CommandForm.tsx
│   │   │   ├── CommandList.tsx
│   │   │   ├── CommandItem.tsx
│   │   │   ├── CommandStats.tsx
│   │   │   └── ...
│   │   ├── hooks/     # React Hooks
│   │   │   ├── useTodos.ts
│   │   │   ├── useNotes.ts
│   │   │   ├── usePomodoro.ts
│   │   │   ├── useFlashcards.ts
│   │   │   ├── useTools.ts
│   │   │   ├── useCommands.ts
│   │   │   ├── useTimer.ts
│   │   │   ├── useWhiteNoise.ts
│   │   │   └── ...
│   │   ├── lib/       # 工具函数和配置
│   │   └── api/       # API 客户端
│   │       ├── todos.ts
│   │       ├── notes.ts
│   │       ├── pomodoro.ts
│   │       ├── flashcards.ts
│   │       ├── tools.ts
│   │       ├── commands.ts
│   │       └── ...
│   └── ...
├── api/               # FastAPI 后端应用
│   ├── app/
│   │   ├── models/    # 数据模型
│   │   │   ├── todo.py
│   │   │   ├── note.py
│   │   │   ├── pomodoro.py
│   │   │   ├── flashcard.py
│   │   │   ├── tool.py
│   │   │   ├── command.py
│   │   │   └── ...
│   │   ├── routers/   # API 路由
│   │   │   ├── todos.py
│   │   │   ├── notes.py
│   │   │   ├── pomodoro.py
│   │   │   ├── flashcards.py
│   │   │   ├── tools.py
│   │   │   ├── commands.py
│   │   │   └── ...
│   │   ├── database.py # 数据库配置
│   │   └── main.py    # 应用入口
│   └── ...
└── vercel.json        # Vercel 部署配置

### 运行与调试
- 前端：`pnpm -w dev` 或进入 `frontend` 执行 `pnpm dev`
- 后端：`uvicorn app.main:app --reload --port 8000`（目录 `api`）
- 环境变量：
  - 后端：复制根目录 `.env.example` 到 `.env.local`
  - 前端：复制 `frontend/.env.example` 到 `frontend/.env.local`

### 生产运维建议
- 使用 Vercel Postgres 或稳定的托管 PostgreSQL，确保 `POSTGRES_URL` 可连通
- 设置 `SECRET_KEY` 为强随机值并保存在 Vercel Project 的 Environment Variables 中
- 开启 Vercel 的 `Protect Preview Deployments`（可选）
- 如需自定义域名，将 CORS 允许来源扩展到你的域名
```

## API 接口

### 用户认证

- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录（返回 `access_token`、`token_type`、`user`）
- `GET /auth/me` - 获取当前用户信息（需 `Authorization: Bearer <token>`）

请求示例：

```json
// POST /auth/register
{ "username": "alice", "password": "P@ssw0rd" }

// POST /auth/login
{ "username": "alice", "password": "P@ssw0rd" }
```

响应示例（登录成功）：

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": { "id": 1, "username": "alice" }
}
```

前端使用（简要）：

```ts
import { authApi } from "@/lib/auth";

// 注册
await authApi.register({ username: "alice", password: "P@ssw0rd" });

// 登录并保存 Token（axios 拦截器会从 localStorage 读取）
const res = await authApi.login({ username: "alice", password: "P@ssw0rd" });
localStorage.setItem("access_token", res.access_token);

// 获取当前用户
const me = await authApi.getCurrentUser();
```

后端实现要点：

- JWT: HS256，过期默认 30 天（可在 `SECRET_KEY` 和过期策略上调整）
- 密码哈希：`passlib[bcrypt]`
- CORS：本地 `http://localhost:3000`，生产 `*.vercel.app`
- 环境变量：`SECRET_KEY`（生产必须配置强随机值）

### Todo 任务管理

- `GET /todos/` - 获取任务列表
- `POST /todos/` - 创建新任务
- `GET /todos/{id}` - 获取单个任务
- `PUT /todos/{id}` - 更新任务
- `DELETE /todos/{id}` - 删除任务
- `PATCH /todos/{id}/toggle` - 切换完成状态

### 笔记反思

- `GET /notes/` - 获取笔记列表
- `POST /notes/` - 创建新笔记
- `GET /notes/{id}` - 获取单个笔记
- `PUT /notes/{id}` - 更新笔记
- `DELETE /notes/{id}` - 删除笔记
- `GET /notes/tags/` - 获取所有标签

### 番茄钟专注

- `GET /pomodoro/sessions/` - 获取番茄钟会话列表
- `POST /pomodoro/sessions/` - 创建新会话
- `GET /pomodoro/sessions/{id}` - 获取单个会话
- `PUT /pomodoro/sessions/{id}` - 更新会话
- `DELETE /pomodoro/sessions/{id}` - 删除会话
- `GET /pomodoro/sessions/active/` - 获取活跃会话
- `POST /pomodoro/sessions/{id}/pause` - 暂停会话
- `POST /pomodoro/sessions/{id}/resume` - 恢复会话
- `GET /pomodoro/stats/` - 获取专注统计
- `GET /pomodoro/stats/today/` - 获取今日统计

### 工具管理

- `GET /tools/` - 获取工具列表
- `POST /tools/` - 创建新工具
- `GET /tools/{id}` - 获取单个工具
- `PUT /tools/{id}` - 更新工具
- `DELETE /tools/{id}` - 删除工具
- `GET /tools/tags/` - 获取所有标签
- `GET /tools/types/` - 获取所有工具类型

### 命令记忆库

- `GET /commands/` - 获取命令列表
- `POST /commands/` - 创建新命令
- `GET /commands/{id}` - 获取单个命令
- `PUT /commands/{id}` - 更新命令
- `DELETE /commands/{id}` - 删除命令
- `POST /commands/{id}/use` - 记录命令使用
- `GET /commands/stats/overview` - 获取命令统计信息
- `GET /commands/categories/` - 获取所有分类
- `GET /commands/tags/` - 获取所有标签
- `GET /commands/frequent/` - 获取常用命令
- `GET /commands/recent/` - 获取最近使用的命令

### 间隔重复记忆

- `GET /flashcards/` - 获取记忆卡片列表
- `POST /flashcards/` - 创建新卡片
- `GET /flashcards/{id}` - 获取单个卡片
- `PUT /flashcards/{id}` - 更新卡片
- `DELETE /flashcards/{id}` - 删除卡片
- `GET /flashcards/due` - 获取到期需要复习的卡片
- `POST /flashcards/{id}/review` - 复习卡片并更新间隔
- `GET /flashcards/stats` - 获取学习统计信息
- `GET /flashcards/categories` - 获取所有分类
- `GET /flashcards/tags` - 获取所有标签
- `GET /flashcards/{id}/reviews` - 获取卡片复习历史
- `GET /flashcards/study-stats/{date}` - 获取指定日期学习统计
- `POST /flashcards/batch-import` - 批量导入卡片

## 功能特性

- [x] 项目基础架构
- [x] Todo 任务管理
  - 创建、编辑、删除任务
  - 优先级管理（高/中/低）
  - 完成状态切换
  - 按优先级分组显示
  - 实时更新界面
- [x] 笔记反思模块
  - 创建和编辑笔记
  - 反思笔记标记
  - 标签分类管理
  - 搜索功能（标题和内容）
  - 按类型分组显示
- [x] 番茄钟专注模块
  - 标准番茄工作法计时（25 分钟工作+5 分钟休息）
  - 多种白噪音背景声音支持
  - 与任务管理联动，选择任务进行专注
  - 会话暂停和恢复功能
  - 专注时长自动记录和统计
  - 每日/每周专注数据分析
  - 效率指标计算
- [x] 间隔重复记忆模块
  - 基于艾宾浩斯遗忘曲线的智能复习调度
  - Leitner 盒子系统进度管理
  - 记忆卡片创建、编辑、分类管理
  - 智能复习提醒和进度跟踪
  - 学习效果统计和分析
  - 记忆保持率计算
  - 复习历史记录
  - 批量导入功能
- [x] 工具管理模块
  - 提示词工具和 API 工具分类管理
  - 系统提示词存储和一键复制
  - API 密钥安全存储和管理
  - 智能搜索和标签筛选
  - 工具类型分组显示
  - 一键复制功能（标题、内容、API 信息）
  - 响应式界面设计
- [x] 命令记忆库模块
  - 常用命令保存和管理
  - 多种命令分类（Git、Docker、Linux、Windows 等）
  - 命令使用频率统计和排序
  - 危险命令标记和警告
  - 智能搜索和过滤功能
  - 使用示例和注意事项
  - 一键复制命令内容
  - 最近使用和常用命令快速访问
- [x] 配色生成模块
  - 从图片提取色彩方案
  - 随机色彩生成
  - 多种颜色格式支持（HEX、RGB、HSL）
  - 一键复制颜色值
- [x] 用户认证（JWT 注册/登录/当前用户）
- [ ] 数据统计分析

## 使用指南

### Todo 任务管理

1. **创建任务**：在左侧表单中输入任务内容和优先级
2. **管理任务**：
   - 点击复选框切换完成状态
   - 使用编辑按钮修改任务
   - 使用删除按钮移除任务
3. **筛选查看**：
   - 按状态筛选（全部/待完成/已完成）
   - 按优先级筛选（全部/高/中/低优先级）
4. **自动分组**：任务按优先级自动分组显示

### 笔记反思功能

1. **创建笔记**：
   - 填写标题和内容
   - 添加标签（用逗号分隔）
   - 选择是否为反思笔记
2. **管理笔记**：
   - 点击编辑按钮修改笔记
   - 使用删除按钮移除笔记
3. **搜索和筛选**：
   - 搜索框可搜索标题和内容
   - 按类型筛选（全部/普通笔记/反思笔记）
   - 按标签筛选
4. **自动分类**：
   - 反思笔记和普通笔记分组显示
   - 标签自动提取和管理

### 番茄钟专注功能

1. **开始专注会话**：
   - 选择专注时长（默认 25 分钟）
   - 可选择关联的待办任务
   - 选择背景白噪音（雨声、森林、海浪、咖啡厅等）
   - 调节音量大小
2. **会话管理**：
   - 实时倒计时显示和进度条
   - 暂停/恢复专注会话
   - 提前结束会话
   - 阶段自动切换（工作 → 短休息 → 工作 → 长休息）
3. **数据统计**：
   - 自动记录每次专注时长
   - 今日专注数据概览
   - 最近 7 天专注趋势
   - 效率指标分析（完成率、工作休息比等）
4. **音频提示**：
   - 阶段完成时播放提示音
   - 支持多种白噪音背景
   - 音量可调节控制

### 间隔重复记忆功能

1. **创建记忆卡片**：
   - 输入卡片正面（问题）和背面（答案）内容
   - 添加分类和标签便于管理
   - 支持富文本内容和多行文本
2. **开始复习**：
   - 系统自动显示到期需要复习的卡片
   - 按照艾宾浩斯遗忘曲线安排复习时间
   - 实时显示复习进度和统计信息
3. **复习评价**：
   - **重新学习**：完全忘记，重新开始记忆流程
   - **困难**：记住了但很吃力，减少复习间隔
   - **良好**：正常记忆难度，按标准间隔复习
   - **简单**：很容易记住，延长复习间隔
4. **学习统计**：
   - 查看总卡片数、到期卡片数、学习进度
   - Leitner 盒子分布显示记忆程度
   - 记忆保持率和学习效率分析
   - 每日学习时间和复习卡片统计
5. **管理功能**：
   - 搜索和筛选卡片（按状态、分类、标签）
   - 编辑和删除卡片
   - 批量导入卡片
   - 查看复习历史记录

### 工具管理功能

1. **创建工具**：
   - 选择工具类型（提示词工具或 API 工具）
   - 输入工具标题和描述信息
   - 添加标签便于分类管理
   - 提示词工具：输入系统提示词内容
   - API 工具：配置 API 端点和密钥
2. **管理工具**：
   - 智能搜索：按标题、描述或内容搜索
   - 筛选功能：按工具类型、标签筛选
   - 编辑和删除工具
   - 分类展示：提示词工具和 API 工具分组显示
3. **一键复制功能**：
   - 点击工具标题直接复制
   - 系统提示词内容一键复制
   - API 端点和密钥独立复制
   - 悬停显示复制图标提示
4. **安全管理**：
   - API 密钥安全存储和显示
   - 敏感信息脱敏展示
   - 分类权限管理

### 命令记忆库功能

1. **创建命令**：
   - 输入命令名称和完整命令
   - 选择命令分类（Git、Docker、Linux、Windows、Node.js 等）
   - 添加命令描述和使用示例
   - 设置标签便于分类查找
   - 标记危险命令并添加注意事项
2. **管理命令**：
   - 智能搜索：按名称、命令内容或描述搜索
   - 多重过滤：按分类、标签、安全性筛选
   - 灵活排序：按更新时间、使用频率、名称排序
   - 编辑和删除命令
3. **使用功能**：
   - 一键复制命令内容、使用示例
   - 点击"使用"按钮记录使用次数
   - 危险命令显示警告图标
   - 查看命令详细信息和注意事项
4. **统计分析**：
   - 总览统计：总命令数、分类数、最常用命令
   - 分类分布：各分类的命令数量统计
   - 常用命令：按使用频率排序的热门命令
   - 最近使用：按时间排序的最近访问命令
5. **高级特性**：
   - 危险命令确认对话框
   - 命令使用历史记录
   - 响应式界面适配移动设备

## 技术特点

- **实时更新**：使用 TanStack Query 实现乐观更新
- **响应式设计**：适配各种设备屏幕
- **类型安全**：TypeScript 全覆盖
- **组件化**：基于 shadcn/ui 的可复用组件
- **Hot Reload**：开发时实时预览更改
- **API 文档**：自动生成的 FastAPI 文档
- **音频处理**：Web Audio API 实现白噪音和提示音
- **计时器优化**：高精度倒计时和进度显示
- **数据持久化**：专注会话和统计数据自动保存
- **状态管理**：React Query 缓存和同步机制
- **智能算法**：实现 SM-2 算法和 Leitner 系统的间隔重复记忆
- **科学学习**：基于认知科学的记忆规律设计
- **数据分析**：详细的学习统计和效果分析
- **安全设计**：危险命令标记和确认机制
- **使用统计**：命令使用频率自动跟踪和分析
- **智能搜索**：支持多字段模糊搜索和高级过滤
- **一键操作**：复制、使用等常用操作一键完成

## 测试和验证

### 测试记忆卡片系统

项目包含了一个测试脚本来验证间隔重复记忆系统：

```bash
# 在虚拟环境中运行测试脚本
cd api && source .venv/Scripts/activate && python ../test_flashcards.py
```

测试脚本会：

1. 创建数据库表
2. 添加 5 张示例记忆卡片（涵盖心理学、编程、AI 等领域）
3. 模拟复习流程，演示算法如何调整复习间隔
4. 显示统计信息和 Leitner 盒子分布

### 验证功能

- ✅ 数据库模型创建和迁移
- ✅ 艾宾浩斯算法实现
- ✅ Leitner 盒子系统
- ✅ 复习记录追踪
- ✅ 统计数据计算
- ✅ API 接口完整性
- ✅ 前端组件渲染
- ✅ 类型安全检查

## 间隔重复记忆系统技术说明

### 核心算法

本项目实现了两种经典的间隔重复算法：

#### 1. 艾宾浩斯遗忘曲线 (SM-2 算法)

- **难度系数调整**：根据用户反馈（重新学习/困难/良好/简单）动态调整
- **间隔计算**：第 1 次复习间隔 1 天，第 2 次 6 天，之后按 `间隔 × 难度系数` 计算
- **智能重置**：答错时重新开始，保持学习连续性

#### 2. Leitner 盒子系统

- **7 个盒子等级**：每个盒子对应不同的复习频率
- **动态升降级**：答对升级到更高盒子，答错降级到第一盒子
- **频率设计**：
  - 盒子 1：每天复习
  - 盒子 2：每 2 天复习
  - 盒子 3：每 4 天复习
  - 盒子 4：每周复习
  - 盒子 5：每 2 周复习
  - 盒子 6：每月复习
  - 盒子 7：每 3 个月复习

### 数据模型设计

- **记忆卡片表**：存储卡片内容、状态、算法参数
- **复习记录表**：追踪每次复习的详细信息
- **学习统计表**：按日期汇总学习数据
- **外键关联**：确保数据完整性和查询效率

### 性能优化

- **索引优化**：对 frequently 查询字段添加数据库索引
- **缓存策略**：前端使用 TanStack Query 缓存 API 响应
- **批量操作**：支持批量导入和统计计算
- **懒加载**：按需加载复习历史和详细统计
