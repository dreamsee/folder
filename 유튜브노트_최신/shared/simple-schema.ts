import { z } from "zod";

// 기본 타입 정의
export interface User {
  id: number;
  username: string;
  password: string;
}

export interface Video {
  id: number;
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  isAvailable: boolean;
  lastChecked: Date;
  createdAt: Date;
}

export interface NoteSession {
  id: number;
  userId: number;
  videoId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Timestamp {
  id: number;
  sessionId: number;
  timeInSeconds: number;
  timeFormatted: string;
  memo: string;
  screenshot: string | null;
  volume: number | null;
  playbackRate: number | null;
  duration: number | null;
  createdAt: Date;
}

// Insert 타입 정의
export interface InsertUser {
  username: string;
  password: string;
}

export interface InsertVideo {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
}

export interface InsertNoteSession {
  userId: number;
  videoId: string;
  title: string;
  content?: string;
}

export interface InsertTimestamp {
  sessionId: number;
  timeInSeconds: number;
  timeFormatted: string;
  memo?: string;
  screenshot?: string;
  volume?: number;
  playbackRate?: number;
  duration?: number;
}

// 호환성을 위한 별칭
export type Note = NoteSession;
export type InsertNote = InsertNoteSession;

// Zod 스키마 정의
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const insertVideoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channelName: z.string(),
  thumbnailUrl: z.string(),
});

export const insertNoteSessionSchema = z.object({
  userId: z.number(),
  videoId: z.string(),
  title: z.string(),
  content: z.string().optional(),
});

export const insertTimestampSchema = z.object({
  sessionId: z.number(),
  timeInSeconds: z.number(),
  timeFormatted: z.string(),
  memo: z.string().optional(),
  screenshot: z.string().optional(),
  volume: z.number().optional(),
  playbackRate: z.number().optional(),
  duration: z.number().optional(),
});

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