import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// 영상 정보 테이블
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull().unique(),
  title: text("title").notNull(),
  channelName: text("channel_name").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  lastChecked: timestamp("last_checked").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 노트 세션 테이블 (영상별 노트 그룹)
export const noteSessions = pgTable("note_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  videoId: text("video_id").references(() => videos.videoId).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 타임스탬프 테이블
export const timestamps = pgTable("timestamps", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => noteSessions.id).notNull(),
  timeInSeconds: integer("time_in_seconds").notNull(),
  timeFormatted: text("time_formatted").notNull(),
  memo: text("memo").notNull().default(""),
  screenshot: text("screenshot"), // base64 이미지 데이터
  volume: integer("volume").default(100), // 0-100 범위
  playbackRate: doublePrecision("playback_rate").default(1.0), // 0.25-2.0 범위
  duration: integer("duration").default(5), // 지속시간 (초)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 기존 notes 테이블 제거하고 새로운 스키마들로 교체
export const insertVideoSchema = createInsertSchema(videos).pick({
  videoId: true,
  title: true,
  channelName: true,
  thumbnailUrl: true,
});

export const insertNoteSessionSchema = createInsertSchema(noteSessions).pick({
  userId: true,
  videoId: true,
  title: true,
  content: true,
});

export const insertTimestampSchema = createInsertSchema(timestamps).pick({
  sessionId: true,
  timeInSeconds: true,
  timeFormatted: true,
  memo: true,
  screenshot: true,
  volume: true,
  playbackRate: true,
  duration: true,
});

// 관계 정의
export const usersRelations = relations(users, ({ many }) => ({
  noteSessions: many(noteSessions),
}));

export const videosRelations = relations(videos, ({ many }) => ({
  noteSessions: many(noteSessions),
}));

export const noteSessionsRelations = relations(noteSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [noteSessions.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [noteSessions.videoId],
    references: [videos.videoId],
  }),
  timestamps: many(timestamps),
}));

export const timestampsRelations = relations(timestamps, ({ one }) => ({
  noteSession: one(noteSessions, {
    fields: [timestamps.sessionId],
    references: [noteSessions.id],
  }),
}));

// 타입 정의
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

export type InsertNoteSession = z.infer<typeof insertNoteSessionSchema>;
export type NoteSession = typeof noteSessions.$inferSelect;

export type InsertTimestamp = z.infer<typeof insertTimestampSchema>;
export type Timestamp = typeof timestamps.$inferSelect;

// 기존 호환성을 위한 별칭
export type InsertNote = InsertNoteSession;
export type Note = NoteSession;

// YouTube 검색 응답 스키마
export const youtubeVideoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  channelTitle: z.string(),
});

export const youtubeSearchResponseSchema = z.object({
  videos: z.array(youtubeVideoSchema),
});

export type YoutubeVideo = z.infer<typeof youtubeVideoSchema>;
export type YoutubeSearchResponse = z.infer<typeof youtubeSearchResponseSchema>;

// 녹화 세션 테이블 (휘발성 문제 해결)
export const recordingSessions = pgTable("recording_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  videoId: text("video_id").references(() => videos.videoId).notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  totalDuration: integer("total_duration").default(0), // 녹화 총 시간 (초)
  rawTimestamps: integer("raw_timestamps_count").default(0), // 생성된 타임스탬프 수
  metadata: text("metadata"), // JSON 형태 추가 정보
});

// 원시 타임스탬프 테이블 (녹화 중 생성된 데이터)
export const rawTimestamps = pgTable("raw_timestamps", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => recordingSessions.id).notNull(),
  timestampId: text("timestamp_id").notNull(), // 클라이언트에서 생성한 ID
  timeInSeconds: doublePrecision("time_in_seconds").notNull(), // 정확한 시간 (소수점 포함)
  action: text("action").notNull(), // speed, volume, seek, pause, manual
  value: doublePrecision("value").notNull(), // 변경된 값
  previousValue: doublePrecision("previous_value").notNull(), // 이전 값
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRecordingSessionSchema = createInsertSchema(recordingSessions).pick({
  userId: true,
  videoId: true,
  title: true,
  status: true,
  totalDuration: true,
  rawTimestamps: true,
  metadata: true,
});

export const insertRawTimestampSchema = createInsertSchema(rawTimestamps).pick({
  sessionId: true,
  timestampId: true,
  timeInSeconds: true,
  action: true,
  value: true,
  previousValue: true,
});

export type InsertRecordingSession = z.infer<typeof insertRecordingSessionSchema>;
export type RecordingSession = typeof recordingSessions.$inferSelect;

export type InsertRawTimestamp = z.infer<typeof insertRawTimestampSchema>;
export type RawTimestamp = typeof rawTimestamps.$inferSelect;
