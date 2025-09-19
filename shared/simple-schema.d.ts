import { z } from "zod";
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
export type Note = NoteSession;
export type InsertNote = InsertNoteSession;
export declare const insertUserSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const insertVideoSchema: z.ZodObject<{
    videoId: z.ZodString;
    title: z.ZodString;
    channelName: z.ZodString;
    thumbnailUrl: z.ZodString;
}, z.core.$strip>;
export declare const insertNoteSessionSchema: z.ZodObject<{
    userId: z.ZodNumber;
    videoId: z.ZodString;
    title: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const insertTimestampSchema: z.ZodObject<{
    sessionId: z.ZodNumber;
    timeInSeconds: z.ZodNumber;
    timeFormatted: z.ZodString;
    memo: z.ZodOptional<z.ZodString>;
    screenshot: z.ZodOptional<z.ZodString>;
    volume: z.ZodOptional<z.ZodNumber>;
    playbackRate: z.ZodOptional<z.ZodNumber>;
    duration: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const youtubeVideoSchema: z.ZodObject<{
    videoId: z.ZodString;
    title: z.ZodString;
    thumbnail: z.ZodString;
    channelTitle: z.ZodString;
}, z.core.$strip>;
export declare const youtubeSearchResponseSchema: z.ZodObject<{
    videos: z.ZodArray<z.ZodObject<{
        videoId: z.ZodString;
        title: z.ZodString;
        thumbnail: z.ZodString;
        channelTitle: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type YoutubeVideo = z.infer<typeof youtubeVideoSchema>;
export type YoutubeSearchResponse = z.infer<typeof youtubeSearchResponseSchema>;
