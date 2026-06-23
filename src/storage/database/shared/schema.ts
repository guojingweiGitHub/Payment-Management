import { sqliteTable, integer, text, real, index } from "drizzle-orm/sqlite-core"

// 项目收款管理表
export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // 拿图日期
    pickup_date: text("pickup_date").notNull(),
    // 单位名称
    company_name: text("company_name").notNull(),
    // 工程编号（唯一）
    project_code: text("project_code").notNull().unique(),
    // 甲方姓名
    client_name: text("client_name").notNull(),
    // 甲方电话
    client_phone: text("client_phone").notNull(),
    // 分院领导签字
    branch_leader_signature: text("branch_leader_signature"),
    // 登记人
    registrant: text("registrant").notNull(),
    // 预计缴费日期
    expected_payment_date: text("expected_payment_date").notNull(),
    // 是否到期
    is_expired: integer("is_expired", { mode: "boolean" }).default(false).notNull(),
    // 项目负责人
    project_manager: text("project_manager"),
    // 合同总额
    contract_amount: real("contract_amount"),
    // 决算金额
    final_amount: real("final_amount"),
    // 缴费状态（未缴费/已缴费）
    payment_status: text("payment_status").default("未缴费").notNull(),
    // 附件列表（JSON 字符串存储）
    attachments: text("attachments", { mode: "json" }).$type<Array<{key: string; name: string; type: string; size: number}>>(),
    // 创建时间
    created_at: text("created_at").default("datetime('now')").notNull(),
    // 更新时间
    updated_at: text("updated_at"),
  },
  (table) => [
    index("projects_project_code_idx").on(table.project_code),
    index("projects_company_name_idx").on(table.company_name),
    index("projects_expected_payment_date_idx").on(table.expected_payment_date),
    index("projects_payment_status_idx").on(table.payment_status),
    index("projects_registrant_idx").on(table.registrant),
  ]
);

// 联系记录表
export const contactRecords = sqliteTable(
  "contact_records",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // 关联项目
    project_id: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    // 联系时间
    contact_time: text("contact_time").notNull(),
    // 延期说明
    delay_reason: text("delay_reason"),
    // 备注
    notes: text("notes"),
    // 附件列表（JSON 字符串存储）
    attachments: text("attachments", { mode: "json" }).$type<Array<{key: string; name: string; type: string; size: number}>>(),
    // 创建时间
    created_at: text("created_at").default("datetime('now')").notNull(),
  },
  (table) => [
    index("contact_records_project_id_idx").on(table.project_id),
    index("contact_records_contact_time_idx").on(table.contact_time),
  ]
);

// 审核推送人表
export const reviewers = sqliteTable(
  "reviewers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // 姓名
    name: text("name").notNull().unique(),
    // 创建时间
    created_at: text("created_at").default("datetime('now')").notNull(),
  },
  (table) => [
    index("reviewers_name_idx").on(table.name),
  ]
);

// 用户表
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // 用户名（唯一）
    username: text("username").notNull().unique(),
    // 密码哈希
    password_hash: text("password_hash").notNull(),
    // 角色：编辑 / 查看
    role: text("role").default("查看").notNull(),
    // 创建时间
    created_at: text("created_at").default("datetime('now')").notNull(),
  },
  (table) => [
    index("users_username_idx").on(table.username),
  ]
);
