import { 
  users, videos, noteSessions, timestamps,
  type User, type InsertUser, 
  type Video, type InsertVideo,
  type NoteSession, type InsertNoteSession,
  type Timestamp, type InsertTimestamp,
  type Note, type InsertNote // 호환성 유지
} from "../shared/simple-schema";

// 스토리지 인터페이스 정의
export interface IStorage {
  // 사용자 관련
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // 영상 관련
  getVideo(videoId: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideoAvailability(videoId: string, isAvailable: boolean): Promise<void>;
  
  // 노트 세션 관련
  getNoteSessionsByUserId(userId: number): Promise<NoteSession[]>;
  getNoteSessionsByVideoId(videoId: string): Promise<NoteSession[]>;
  getNoteSession(id: number): Promise<NoteSession | undefined>;
  createNoteSession(noteSession: InsertNoteSession): Promise<NoteSession>;
  updateNoteSession(id: number, noteSession: Partial<InsertNoteSession>): Promise<NoteSession | undefined>;
  deleteNoteSession(id: number): Promise<boolean>;
  
  // 타임스탬프 관련
  getTimestampsBySessionId(sessionId: number): Promise<Timestamp[]>;
  createTimestamp(timestamp: InsertTimestamp): Promise<Timestamp>;
  updateTimestamp(id: number, timestamp: Partial<InsertTimestamp>): Promise<Timestamp | undefined>;
  deleteTimestamp(id: number): Promise<boolean>;
  
  // 기존 호환성을 위한 별칭
  getNotesByUserId(userId: number): Promise<Note[]>;
  getNotesByVideoId(videoId: string): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;
}

// 메모리 스토리지 구현
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private videos: Map<string, Video>;
  private noteSessions: Map<number, NoteSession>;
  private timestamps: Map<number, Timestamp>;
  private userCurrentId: number;
  private videoCurrentId: number;
  private sessionCurrentId: number;
  private timestampCurrentId: number;

  constructor() {
    this.users = new Map();
    this.videos = new Map();
    this.noteSessions = new Map();
    this.timestamps = new Map();
    this.userCurrentId = 1;
    this.videoCurrentId = 1;
    this.sessionCurrentId = 1;
    this.timestampCurrentId = 1;
  }

  // 사용자 관련 메서드
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // 영상 관련 메서드
  async getVideo(videoId: string): Promise<Video | undefined> {
    return this.videos.get(videoId);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = this.videoCurrentId++;
    const video: Video = { 
      ...insertVideo, 
      id,
      isAvailable: true,
      lastChecked: new Date(),
      createdAt: new Date()
    };
    this.videos.set(insertVideo.videoId, video);
    return video;
  }

  async updateVideoAvailability(videoId: string, isAvailable: boolean): Promise<void> {
    const video = this.videos.get(videoId);
    if (video) {
      video.isAvailable = isAvailable;
      video.lastChecked = new Date();
    }
  }

  // 노트 세션 관련 메서드
  async getNoteSessionsByUserId(userId: number): Promise<NoteSession[]> {
    return Array.from(this.noteSessions.values()).filter(
      (session) => session.userId === userId
    );
  }

  async getNoteSessionsByVideoId(videoId: string): Promise<NoteSession[]> {
    return Array.from(this.noteSessions.values()).filter(
      (session) => session.videoId === videoId
    );
  }

  async getNoteSession(id: number): Promise<NoteSession | undefined> {
    return this.noteSessions.get(id);
  }

  async createNoteSession(insertNoteSession: InsertNoteSession): Promise<NoteSession> {
    const id = this.sessionCurrentId++;
    const noteSession: NoteSession = { 
      ...insertNoteSession, 
      id,
      content: insertNoteSession.content || "",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.noteSessions.set(id, noteSession);
    return noteSession;
  }

  async updateNoteSession(id: number, noteSessionData: Partial<InsertNoteSession>): Promise<NoteSession | undefined> {
    const existingSession = this.noteSessions.get(id);
    
    if (!existingSession) {
      return undefined;
    }
    
    const updatedSession: NoteSession = { 
      ...existingSession, 
      ...noteSessionData,
      updatedAt: new Date()
    };
    this.noteSessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteNoteSession(id: number): Promise<boolean> {
    return this.noteSessions.delete(id);
  }

  // 타임스탬프 관련 메서드
  async getTimestampsBySessionId(sessionId: number): Promise<Timestamp[]> {
    return Array.from(this.timestamps.values()).filter(
      (timestamp) => timestamp.sessionId === sessionId
    );
  }

  async createTimestamp(insertTimestamp: InsertTimestamp): Promise<Timestamp> {
    const id = this.timestampCurrentId++;
    const timestamp: Timestamp = { 
      ...insertTimestamp, 
      id,
      memo: insertTimestamp.memo || "",
      screenshot: insertTimestamp.screenshot || null,
      createdAt: new Date()
    };
    this.timestamps.set(id, timestamp);
    return timestamp;
  }

  async updateTimestamp(id: number, timestampData: Partial<InsertTimestamp>): Promise<Timestamp | undefined> {
    const existingTimestamp = this.timestamps.get(id);
    
    if (!existingTimestamp) {
      return undefined;
    }
    
    const updatedTimestamp: Timestamp = { ...existingTimestamp, ...timestampData };
    this.timestamps.set(id, updatedTimestamp);
    return updatedTimestamp;
  }

  async deleteTimestamp(id: number): Promise<boolean> {
    return this.timestamps.delete(id);
  }

  // 기존 호환성을 위한 별칭 메서드들
  async getNotesByUserId(userId: number): Promise<Note[]> {
    return this.getNoteSessionsByUserId(userId);
  }

  async getNotesByVideoId(videoId: string): Promise<Note[]> {
    return this.getNoteSessionsByVideoId(videoId);
  }

  async getNote(id: number): Promise<Note | undefined> {
    return this.getNoteSession(id);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    return this.createNoteSession(insertNote);
  }

  async updateNote(id: number, noteData: Partial<InsertNote>): Promise<Note | undefined> {
    return this.updateNoteSession(id, noteData);
  }

  async deleteNote(id: number): Promise<boolean> {
    return this.deleteNoteSession(id);
  }
}

// PostgreSQL 데이터베이스 스토리지 구현 (일시적으로 주석 처리)
// import { db } from "./db";
// import { eq, and } from "drizzle-orm";

/*
PostgreSQL 구현은 drizzle-orm 설치 후 활성화 예정
export class PostgreSQLStorage implements IStorage {
  // 구현 코드 생략...
}
*/

// 단일 인스턴스 내보내기 (임시로 메모리 스토리지만 사용)
export const storage = new MemStorage();
