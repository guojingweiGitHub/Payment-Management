import { pgTable, serial, timestamp, varchar, numeric, boolean, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 项目收款管理表
export const projects = pgTable(
	"projects",
	{
		id: serial().primaryKey(),
		// 拿图日期
		pickup_date: timestamp("pickup_date", { withTimezone: true }).notNull(),
		// 单位名称
		company_name: varchar("company_name", { length: 255 }).notNull(),
		// 工程编号（唯一）
		project_code: varchar("project_code", { length: 100 }).notNull().unique(),
		// 甲方姓名
		client_name: varchar("client_name", { length: 100 }).notNull(),
		// 甲方电话
		client_phone: varchar("client_phone", { length: 50 }).notNull(),
		// 分院领导签字
		branch_leader_signature: varchar("branch_leader_signature", { length: 100 }),
		// 登记人
		registrant: varchar("registrant", { length: 100 }).notNull(),
		// 预计缴费日期
		expected_payment_date: timestamp("expected_payment_date", { withTimezone: true }).notNull(),
		// 是否到期
		is_expired: boolean("is_expired").default(false).notNull(),
		// 项目负责人
		project_manager: varchar("project_manager", { length: 100 }),
		// 合同总额（金额用 numeric，精度10，小数2）
		contract_amount: numeric("contract_amount", { precision: 10, scale: 2 }),
		// 缴费状态（未缴费/已缴费）
		payment_status: varchar("payment_status", { length: 20 }).default("未缴费").notNull(),
		// 附件（存储对象存储的 key）
		attachment_key: text("attachment_key"),
		// 创建时间
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		// 更新时间
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		// 工程编号索引（唯一查询）
		index("projects_project_code_idx").on(table.project_code),
		// 单位名称索引（模糊查询）
		index("projects_company_name_idx").on(table.company_name),
		// 预计缴费日期索引（筛选到期）
		index("projects_expected_payment_date_idx").on(table.expected_payment_date),
		// 缴费状态索引（筛选）
		index("projects_payment_status_idx").on(table.payment_status),
		// 登记人索引（通知推送）
		index("projects_registrant_idx").on(table.registrant),
	]
);

// 联系记录表
export const contactRecords = pgTable(
	"contact_records",
	{
		id: serial().primaryKey(),
		// 关联项目
		project_id: serial("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
		// 联系时间
		contact_time: timestamp("contact_time", { withTimezone: true }).notNull(),
		// 延期说明
		delay_reason: text("delay_reason"),
		// 备注
		notes: text("notes"),
		// 附件（存储对象存储的 key）
		attachment_key: text("attachment_key"),
		// 创建时间
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		// 外键索引
		index("contact_records_project_id_idx").on(table.project_id),
		// 联系时间索引
		index("contact_records_contact_time_idx").on(table.contact_time),
	]
);

// 审核推送人表
export const reviewers = pgTable(
	"reviewers",
	{
		id: serial().primaryKey(),
		// 姓名
		name: varchar("name", { length: 100 }).notNull().unique(),
		// 创建时间
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("reviewers_name_idx").on(table.name),
	]
);