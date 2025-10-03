import { pgTable, unique, bigint, text, inet, timestamp, jsonb, boolean, integer, bigserial, numeric, primaryKey, date } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const shares = pgTable("shares", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "shares_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	toolId: bigint("tool_id", { mode: "number" }).notNull(),
	shareId: text("share_id").notNull(),
	platform: text().notNull(),
	userAgent: text("user_agent"),
	ipAddress: inet("ip_address"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("shares_share_id_unique").on(table.shareId),
]);

export const auditLogs = pgTable("audit_logs", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "audit_logs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	tableName: text("table_name").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	recordId: bigint("record_id", { mode: "number" }).notNull(),
	action: text().notNull(),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const categories = pgTable("categories", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "categories_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	icon: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("categories_name_unique").on(table.name),
	unique("categories_slug_unique").on(table.slug),
]);

export const users = pgTable("users", {
	analyticsOptIn: boolean("analytics_opt_in").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	dataRetention: text("data_retention").default('90days').notNull(),
	firstName: text("first_name").notNull(),
	lastActive: timestamp("last_active", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	maxNotificationsPerDay: integer("max_notifications_per_day").default(10).notNull(),
	notificationFrequency: text("notification_frequency").default('daily').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	username: text(),
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
});

export const crawlJobs = pgTable("crawl_jobs", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "crawl_jobs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sourceId: bigint("source_id", { mode: "number" }).notNull(),
	status: text().notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	stats: jsonb(),
	error: text(),
});

export const crawlResults = pgTable("crawl_results", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "crawl_results_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	jobId: bigint("job_id", { mode: "number" }).notNull(),
	canonicalUrl: text("canonical_url"),
	rawTitle: text("raw_title"),
	rawDescription: text("raw_description"),
	rawReadme: text("raw_readme"),
	rawMetadata: jsonb("raw_metadata"),
	dedupeHash: text("dedupe_hash"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("crawl_results_dedupe_hash_unique").on(table.dedupeHash),
]);

export const ingests = pgTable("ingests", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "ingests_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	toolId: bigint("tool_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	llmJobId: bigint("llm_job_id", { mode: "number" }).notNull(),
	status: text().notNull(),
	reason: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	moderatorId: bigint("moderator_id", { mode: "number" }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const llmJobs = pgTable("llm_jobs", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "llm_jobs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	resultId: bigint("result_id", { mode: "number" }).notNull(),
	status: text().notNull(),
	model: text(),
	promptVersion: text("prompt_version"),
	output: jsonb(),
	error: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
});

export const sources = pgTable("sources", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "sources_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	type: text().notNull(),
	identifier: text().notNull(),
	enabled: boolean().default(true),
	config: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const submissions = pgTable("submissions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "submissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	submitterEmail: text("submitter_email"),
	payload: jsonb(),
	status: text().default('pending'),
	moderatorNote: text("moderator_note"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	moderatorId: bigint("moderator_id", { mode: "number" }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const tags = pgTable("tags", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "tags_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	name: text().notNull(),
	slug: text().notNull(),
	color: text().default('#6B7280'),
}, (table) => [
	unique("tags_name_unique").on(table.name),
	unique("tags_slug_unique").on(table.slug),
]);

export const tools = pgTable("tools", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "tools_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: text().notNull(),
	name: text().notNull(),
	description: text(),
	repoUrl: text("repo_url"),
	homepageUrl: text("homepage_url"),
	packageName: text("package_name"),
	installCmd: text("install_cmd"),
	runtimeSupport: jsonb("runtime_support"),
	author: text(),
	license: text(),
	logoUrl: text("logo_url"),
	version: text(),
	status: text().default('pending'),
	sourceScore: integer("source_score").default(0),
	popularityScore: integer("popularity_score").default(0),
	qualityScore: numeric("quality_score", { precision: 3, scale:  2 }).default('0.0'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastCrawledAt: timestamp("last_crawled_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("tools_slug_unique").on(table.slug),
]);

export const toolCategories = pgTable("tool_categories", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	toolId: bigint("tool_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	categoryId: bigint("category_id", { mode: "number" }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.toolId, table.categoryId], name: "tool_categories_tool_id_category_id_pk"}),
]);

export const toolTags = pgTable("tool_tags", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	toolId: bigint("tool_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tagId: bigint("tag_id", { mode: "number" }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.toolId, table.tagId], name: "tool_tags_tool_id_tag_id_pk"}),
]);

export const favorites = pgTable("favorites", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	toolId: bigint("tool_id", { mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	primaryKey({ columns: [table.userId, table.toolId], name: "favorites_user_id_tool_id_pk"}),
]);

export const likes = pgTable("likes", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	toolId: bigint("tool_id", { mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	primaryKey({ columns: [table.userId, table.toolId], name: "likes_user_id_tool_id_pk"}),
]);

export const views = pgTable("views", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	toolId: bigint("tool_id", { mode: "number" }).notNull(),
	date: date().notNull(),
	count: integer().default(0),
}, (table) => [
	primaryKey({ columns: [table.toolId, table.date], name: "views_tool_id_date_pk"}),
]);
