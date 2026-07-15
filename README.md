# 未缴费台账管理系统

项目收款管理台账系统，支持多条件查询筛选、批量导入/打折、缴费状态跟踪、到期提醒与用户权限管理。

## 功能概览

- **台账列表** — 项目收款数据展示，支持工程编号/单位名称/甲方电话/缴费状态/是否到期等多条件筛选
- **新增申请** — 录入项目信息，含工程编号唯一性校验，登记人自动填充当前用户
- **批量导入** — Excel 批量导入项目数据，自动校验必填字段与工程编号重复
- **批量打折** — 选中项目批量按折扣比例更新决算金额，当决算为空时自动用合同金额计算
- **工程详情** — 查看完整项目信息、联系记录，支持编辑全部字段
- **到期提醒** — 7 天内即将到期项目高亮提示，可点击工程编号跳转详情
- **列排序** — 表头点击切换正序/倒序排列
- **用户权限** — 三级角色（管理员/编辑/查看），精细控制数据操作权限

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 |
| UI | shadcn/ui (Radix UI) + Tailwind CSS 4 |
| 数据库 | SQLite (better-sqlite3 + Drizzle ORM) |
| 图标 | Lucide React |
| 表单 | React Hook Form |
| 包管理 | pnpm 9+ |

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 9+

### 开发模式

```bash
pnpm install
pnpm dev
```

访问 http://localhost:5000

> **注意**：开发模式使用 Turbopack 可能出现稳定性问题，若遇页面反复刷新，改用生产模式启动。

### 生产模式

```bash
pnpm build
NODE_ENV=production HOSTNAME=0.0.0.0 PORT=5000 node dist/server.js
```

访问 http://localhost:5000

## 项目结构

```
src/
├── app/
│   ├── admin/users/          # 账号管理页（仅管理员）
│   ├── api/
│   │   ├── auth/             # 登录/登出/鉴权
│   │   ├── projects/         # 项目 CRUD + 批量导入/打折 + 生成文档
│   │   ├── reminders/        # 到期提醒
│   │   ├── reviewers/        # 审核推送人（保留，未使用）
│   │   ├── upload/           # 文件上传
│   │   └── users/            # 用户管理
│   ├── login/                # 登录页
│   ├── projects/[id]/        # 项目详情页
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 台账首页
│   └── globals.css           # 全局样式
├── components/ui/            # shadcn/ui 组件库 + AppLayout
├── lib/
│   ├── api.ts                # 前端 API 调用封装
│   ├── auth-store.ts         # 全局认证状态管理
│   ├── auth.ts               # 服务端认证逻辑
│   └── utils.ts              # cn() 工具函数
├── storage/database/
│   ├── shared/schema.ts      # Drizzle ORM 表定义
│   └── supabase-client.ts    # 数据库客户端（实际使用 SQLite）
└── server.ts                 # 自定义服务器入口（含自动迁移）

scripts/
├── dev.sh                    # 开发启动脚本
├── build.sh                  # 构建脚本
├── start.sh                  # 生产启动脚本
├── deploy.sh                 # 部署脚本
└── setup-server.sh           # 服务器环境搭建脚本
```

## 数据库

使用 SQLite 本地文件数据库，Drizzle ORM 管理表结构。

### 表结构

**projects** — 项目收款管理表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| pickup_date | TEXT | 拿图日期 |
| company_name | TEXT | 单位名称 |
| project_code | TEXT | 工程编号（唯一） |
| client_name | TEXT | 甲方姓名 |
| client_phone | TEXT | 甲方电话 |
| branch_leader_signature | TEXT | 分院领导签字 |
| registrant | TEXT | 登记人 |
| expected_payment_date | TEXT | 预计缴费日期 |
| is_expired | INTEGER | 是否到期 |
| project_manager | TEXT | 项目负责人 |
| contract_amount | REAL | 合同总额 |
| final_amount | REAL | 决算金额 |
| payment_status | TEXT | 缴费状态（未缴费/已缴费） |
| attachments | TEXT | 附件（JSON） |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

**contact_records** — 联系记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| project_id | INTEGER | 关联项目 |
| contact_time | TEXT | 联系时间 |
| delay_reason | TEXT | 延期说明 |
| notes | TEXT | 备注 |
| attachments | TEXT | 附件（JSON） |
| created_at | TEXT | 创建时间 |

**users** — 用户表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| username | TEXT | 用户名（唯一） |
| password_hash | TEXT | 密码哈希 |
| role | TEXT | 角色（admin/编辑/查看） |
| created_at | TEXT | 创建时间 |

### 迁移

开发模式下启动时自动执行 `drizzle-kit push`。生产部署前运行：

```bash
npx drizzle-kit push --force
```

## 用户权限

| 角色 | 权限 |
|------|------|
| **管理员 (admin)** | 全部权限：台账增删改查、批量操作、账号管理 |
| **编辑** | 台账增删改查、批量操作（不可管理账号） |
| **查看** | 仅可查看台账列表和详情，不可修改任何数据 |

默认管理员账号：`admin` / `admin123`（首次启动自动创建）

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 退出登录 |
| `/api/auth/me` | GET | 获取当前用户 |
| `/api/projects` | GET | 项目列表（支持筛选/排序/分页） |
| `/api/projects` | POST | 新增项目 |
| `/api/projects/[id]` | GET | 项目详情（含联系记录） |
| `/api/projects/[id]` | PUT | 更新项目 |
| `/api/projects/[id]` | DELETE | 删除项目 |
| `/api/projects/[id]/contacts` | GET/POST | 联系记录查询/新增 |
| `/api/projects/batch-import` | POST | Excel 批量导入 |
| `/api/projects/batch-update` | POST | 批量打折 |
| `/api/projects/[id]/generate-doc` | POST | 生成 Word 文档（开发中） |
| `/api/reminders` | GET | 到期提醒 |
| `/api/users` | GET/POST | 用户列表/新增用户 |
| `/api/users/[id]` | PUT/DELETE | 更新/删除用户 |
| `/api/upload` | POST | 文件上传 |

## 部署

### Ubuntu 24.04

```bash
# 1. 环境搭建
bash scripts/setup-server.sh your-domain.com

# 2. 上传代码后安装依赖
cd /path/to/project
pnpm install --no-frozen-lockfile

# 3. 部署
bash scripts/deploy.sh
```

部署前需确保服务器已安装 `build-essential` 和 `python3`（better-sqlite3 编译所需）。

## 开发规范

- 必须使用 pnpm，禁止 npm/yarn
- 字段名使用 snake_case（如 `created_at`）
- 每次数据库操作检查 `{ data, error }` 并处理错误
- 状态颜色：未缴费→橙色/红色，已缴费→绿色
