import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { youtubeSearchResponseSchema, insertVideoSchema, insertNoteSessionSchema, insertTimestampSchema } from "../shared/simple-schema.js";
import fetch from "node-fetch";
import dotenv from "dotenv";

// 환경 변수 로드 - 여러 경로 시도
dotenv.config({ path: "../.env" });
dotenv.config({ path: "./.env" });
dotenv.config(); // 기본 경로

export async function registerRoutes(app: Express): Promise<Server> {
  // 환경 변수에서 YouTube API 키 가져오기
  const apiKey = process.env.YOUTUBE_API_KEY || "";
  
  // 환경 변수 디버깅
  console.log("=== 환경 변수 상태 ===");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("API KEY 존재:", !!apiKey);
  console.log("API KEY 길이:", apiKey.length);
  console.log("API KEY 첫 10자리:", apiKey.substring(0, 10));
  console.log("====================");

  // YouTube 검색 API 엔드포인트
  app.get("/api/youtube/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      console.log("검색 요청:", query);
      console.log("API 키 존재 여부:", !!apiKey);

      if (!query) {
        return res.status(400).json({ message: "검색어가 필요합니다." });
      }

      if (!apiKey) {
        console.error("YouTube API 키가 설정되지 않음 - 목업 데이터 반환");
        // 목업 데이터 반환 (개발용)
        const mockVideos = [
          {
            videoId: "dQw4w9WgXcQ",
            title: `검색 결과: ${query}`,
            thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
            channelTitle: "테스트 채널"
          },
          {
            videoId: "jNQXAC9IVRw",
            title: `샘플 영상: ${query}`,
            thumbnail: "https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg",
            channelTitle: "샘플 채널"
          }
        ];
        return res.json({ videos: mockVideos });
      }

      // YouTube API 호출
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(
        query
      )}&type=video&key=${apiKey}`;
      
      console.log("API 호출 URL:", apiUrl.replace(apiKey, "***"));

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("YouTube API 에러 응답:", response.status, errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          return res.status(response.status).json({
            message: "YouTube API 오류가 발생했습니다.",
            error: errorData
          });
        } catch {
          return res.status(response.status).json({
            message: "YouTube API 오류가 발생했습니다.",
            error: { message: errorText }
          });
        }
      }

      const data = await response.json() as any;
      console.log("API 응답 데이터:", data);

      if (!data.items || data.items.length === 0) {
        return res.status(404).json({ message: "검색 결과가 없습니다." });
      }

      const videos = data.items.map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle
      }));

      return res.json({ videos });
    } catch (error) {
      console.error("YouTube 검색 에러:", error);
      console.error("에러 스택:", error instanceof Error ? error.stack : error);
      return res.status(500).json({ 
        message: "서버 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // 영상 정보 저장 API
  app.post("/api/videos", async (req, res) => {
    try {
      const videoData = insertVideoSchema.parse(req.body);
      
      // 이미 존재하는 영상인지 확인
      const existingVideo = await storage.getVideo(videoData.videoId);
      if (existingVideo) {
        return res.json(existingVideo);
      }
      
      const video = await storage.createVideo(videoData);
      res.json(video);
    } catch (error) {
      console.error("영상 저장 에러:", error);
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }
  });

  // 노트 세션 생성/조회 API
  app.post("/api/note-sessions", async (req, res) => {
    try {
      const sessionData = insertNoteSessionSchema.parse(req.body);
      const session = await storage.createNoteSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("노트 세션 생성 에러:", error);
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }
  });

  // 노트 세션 업데이트 API
  app.patch("/api/note-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sessionData = req.body;
      const session = await storage.updateNoteSession(id, sessionData);
      
      if (!session) {
        return res.status(404).json({ message: "노트 세션을 찾을 수 없습니다." });
      }
      
      res.json(session);
    } catch (error) {
      console.error("노트 세션 업데이트 에러:", error);
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }
  });

  // 사용자별 노트 세션 조회 API
  app.get("/api/note-sessions/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await storage.getNoteSessionsByUserId(userId);
      res.json(sessions);
    } catch (error) {
      console.error("노트 세션 조회 에러:", error);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // 영상별 노트 세션 조회 API
  app.get("/api/note-sessions/video/:videoId", async (req, res) => {
    try {
      const videoId = req.params.videoId;
      const sessions = await storage.getNoteSessionsByVideoId(videoId);
      res.json(sessions);
    } catch (error) {
      console.error("노트 세션 조회 에러:", error);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // 타임스탬프 생성 API
  app.post("/api/timestamps", async (req, res) => {
    try {
      const timestampData = insertTimestampSchema.parse(req.body);
      const timestamp = await storage.createTimestamp(timestampData);
      res.json(timestamp);
    } catch (error) {
      console.error("타임스탬프 생성 에러:", error);
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }
  });

  // 타임스탬프 조회 API (쿼리 파라미터 지원)
  app.get("/api/timestamps", async (req, res) => {
    try {
      const sessionId = req.query.sessionId ? parseInt(req.query.sessionId as string) : null;
      
      if (sessionId) {
        const timestamps = await storage.getTimestampsBySessionId(sessionId);
        res.json(timestamps);
      } else {
        res.json([]); // sessionId가 없으면 빈 배열 반환
      }
    } catch (error) {
      console.error("타임스탬프 조회 에러:", error);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // 세션별 타임스탬프 조회 API (레거시 지원)
  app.get("/api/timestamps/session/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const timestamps = await storage.getTimestampsBySessionId(sessionId);
      res.json(timestamps);
    } catch (error) {
      console.error("타임스탬프 조회 에러:", error);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // 타임스탬프 업데이트 API
  app.patch("/api/timestamps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const timestampData = req.body;
      const timestamp = await storage.updateTimestamp(id, timestampData);
      
      if (!timestamp) {
        return res.status(404).json({ message: "타임스탬프를 찾을 수 없습니다." });
      }
      
      res.json(timestamp);
    } catch (error) {
      console.error("타임스탬프 업데이트 에러:", error);
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }
  });

  // 타임스탬프 삭제 API
  app.delete("/api/timestamps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTimestamp(id);
      
      if (!success) {
        return res.status(404).json({ message: "타임스탬프를 찾을 수 없습니다." });
      }
      
      res.json({ message: "타임스탬프가 삭제되었습니다." });
    } catch (error) {
      console.error("타임스탬프 삭제 에러:", error);
      return res.status(400).json({ message: "잘못된 요청입니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
