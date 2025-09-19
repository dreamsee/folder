import { z } from "zod";
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
