# 项目上下文

## 项目概述

未缴费拿图管理系统 - 用于统一管控项目收款相关数据、支持收款信息精准查询筛选、实现收款到期智能提醒。

## 核心功能

1. **台账列表**：项目收款管理单据列表，支持多条件查询和筛选
2. **新增申请**：录入项目收款信息，包含工程编号唯一性校验
3. **工程详情**：查看项目详情，支持添加联系记录
4. **到期提醒**：自动提醒即将到期或已到期的项目
5. **审核推送**：向指定审核推送人发送通知

## 数据库表结构

- **projects**：项目收款管理表（拿图日期、单位名称、工程编号、甲方信息、预计缴费日期、缴费状态等）
- **contact_records**：联系记录表（关联项目、联系时间、延期说明、备注、附件）
- **reviewers**：审核推送人表（预设：高庆强、刘玉春、薛蛟）

## API 接口

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/projects` | GET, POST | 项目列表查询、新增 |
| `/api/projects/[id]` | GET, PUT, DELETE | 项目详情、更新、删除 |
| `/api/projects/[id]/contacts` | GET, POST | 联系记录查询、新增 |
| `/api/projects/[id]/notify` | POST | 审核推送通知 |
| `/api/reminders` | GET | 到期提醒列表 |
| `/api/reviewers` | GET, POST | 审核推送人列表 |

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)

## 目录结构

```
├── src/
│   ├── app/
│   │   ├── api/           # API 路由
│   │   │   ├── projects/  # 项目相关接口
│   │   │   ├── reminders/ # 到期提醒接口
│   │   │   └── reviewers/ # 审核推送人接口
│   │   ├── page.tsx       # 台账列表主页
│   │   └── projects/[id]/ # 项目详情页
│   ├── components/ui/     # Shadcn UI 组件库
│   ├── lib/
│   │   ├── api.ts         # API 工具函数
│   │   └── utils.ts       # 通用工具函数
│   └── storage/database/  # Supabase 客户端和 Schema
├── public/                # 静态资源
└── scripts/               # 构建与启动脚本
```

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码
- 禁止隐式 `any` 和 `as any`
- 字段名使用 snake_case（如 `created_at`）
- 每次数据库操作检查 `{ data, error }` 并处理错误

### Hydration 问题防范

- 严禁在 JSX 渲染逻辑中直接使用动态数据（如 `Date.now()`）
- 必须使用 `useEffect` + `useState` 确保动态内容仅在客户端挂载后渲染

## UI 设计规范

- 使用 shadcn/ui 组件库
- 表格为主的数据展示
- 弹窗式新增/编辑操作
- 状态颜色：
  - 未缴费：橙色/红色警示
  - 已缴费：绿色成功
  - 到期：红色高亮