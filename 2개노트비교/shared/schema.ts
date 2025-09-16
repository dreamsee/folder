import { pgTable, text, serial, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 사용자 테이블
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// 원본 문서 테이블
export const originalDocuments = pgTable("original_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isBackup: boolean("is_backup").default(false).notNull(),
  backupName: text("backup_name"), // v1, v2 또는 사용자 입력 이름
  parentId: integer("parent_id"), // 원본 문서 ID (self-reference)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOriginalDocumentSchema = createInsertSchema(originalDocuments).pick({
  title: true,
  content: true,
  isBackup: true,
  backupName: true,
  parentId: true,
});

// 스키마 확장 (유효성 검사 규칙 추가)
export const originalDocumentValidationSchema = insertOriginalDocumentSchema.extend({
  title: z.string().min(1, "제목은 필수입니다").max(100, "제목은 100자 이하여야 합니다"),
  content: z.string().min(1, "내용은 필수입니다"),
});

// 수정된 문서 테이블
export const modifiedDocuments = pgTable("modified_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  originalId: integer("original_id").notNull().references(() => originalDocuments.id),
  regionData: json("region_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertModifiedDocumentSchema = createInsertSchema(modifiedDocuments).pick({
  title: true,
  content: true,
  originalId: true,
  regionData: true,
});

// 스키마 확장 (유효성 검사 규칙 추가)
export const modifiedDocumentValidationSchema = insertModifiedDocumentSchema.extend({
  title: z.string().min(1, "제목은 필수입니다").max(100, "제목은 100자 이하여야 합니다"),
  content: z.string().min(1, "내용은 필수입니다").max(5 * 1024 * 1024, "내용은 5MB 이하여야 합니다"),
  originalId: z.number().int().positive("원본 문서 ID는 양수여야 합니다"),
});



// 타입 정의
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type OriginalDocument = typeof originalDocuments.$inferSelect;
export type InsertOriginalDocument = z.infer<typeof insertOriginalDocumentSchema>;
export type ModifiedDocument = typeof modifiedDocuments.$inferSelect;
export type InsertModifiedDocument = z.infer<typeof insertModifiedDocumentSchema>;
