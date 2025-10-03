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
      const pageToken = req.query.pageToken as string;
      
      console.log("검색 요청:", query, "pageToken:", pageToken);
      console.log("API 키 존재 여부:", !!apiKey);

      if (!query) {
        return res.status(400).json({ message: "검색어가 필요합니다." });
      }

      if (!apiKey) {
        console.error("YouTube API 키가 설정되지 않음 - 목업 데이터 반환");
        // 목업 데이터 반환 (개발용) - 테스트용 50개 데이터
        const mockVideos = [];
        const startIndex = pageToken ? parseInt(pageToken) * 50 : 0;
        for (let i = 0; i < 50; i++) {
          mockVideos.push({
            videoId: `video_${startIndex + i}_${Date.now()}`,
            title: `${query} 검색 결과 ${startIndex + i + 1}`,
            thumbnail: `https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
            channelTitle: `채널 ${(startIndex + i) % 5 + 1}`
          });
        }
        return res.json({ 
          videos: mockVideos, 
          nextPageToken: startIndex < 200 ? String(Math.floor(startIndex / 50) + 1) : null 
        });
      }

      // YouTube API 호출 - 검색 결과 개수 증가 (40 -> 50) 및 페이지네이션 지원
      let apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=${encodeURIComponent(
        query
      )}&type=video&key=${apiKey}`;
      
      if (pageToken) {
        apiUrl += `&pageToken=${pageToken}`;
      }
      
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

      return res.json({ 
        videos,
        nextPageToken: data.nextPageToken || null
      });
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

  // YouTube 영상 정보 가져오기 API (즐겨찾기용)
  app.get("/api/youtube/video-info", async (req, res) => {
    try {
      const videoId = req.query.videoId as string;

      if (!videoId) {
        return res.status(400).json({ message: "videoId가 필요합니다." });
      }

      if (!apiKey) {
        // API 키가 없을 때 목업 데이터 반환
        return res.json({
          title: `목업 영상 제목 - ${videoId}`,
          channelTitle: "목업 채널",
          thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
        });
      }

      const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("YouTube API 오류:", response.status, errorText);
        return res.status(response.status).json({
          message: "YouTube API 오류가 발생했습니다.",
          error: { message: errorText }
        });
      }

      const data = await response.json() as any;

      if (!data.items || data.items.length === 0) {
        return res.status(404).json({ message: "영상을 찾을 수 없습니다." });
      }

      const videoInfo = data.items[0];
      return res.json({
        title: videoInfo.snippet.title,
        channelTitle: videoInfo.snippet.channelTitle,
        thumbnail: videoInfo.snippet.thumbnails.medium?.url || videoInfo.snippet.thumbnails.default?.url
      });

    } catch (error) {
      console.error("영상 정보 조회 에러:", error);
      return res.status(500).json({
        message: "서버 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
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

  // YouTube 댓글 API
  app.get("/api/youtube/comments/:videoId", async (req, res) => {
    try {
      const videoId = req.params.videoId;
      const order = req.query.order as string || 'relevance';

      console.log("댓글 요청:", videoId, "정렬:", order);

      if (!apiKey) {
        console.error("YouTube API 키가 설정되지 않음");
        return res.status(500).json({ message: "YouTube API 키가 설정되지 않았습니다." });
      }

      // YouTube API에서 사용하는 정렬 옵션으로 변환
      let apiOrder = 'relevance';
      switch (order) {
        case 'newest':
          apiOrder = 'time';
          break;
        case 'popular':
          apiOrder = 'relevance';
          break;
        case 'timestamp':
        case 'relevance':
        default:
          apiOrder = 'relevance';
          break;
      }

      // YouTube Data API v3 댓글 조회
      const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&order=${apiOrder}&maxResults=50&key=${apiKey}`;

      console.log("API 호출 URL:", url.replace(apiKey, '***'));

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("YouTube API 댓글 에러:", response.status, response.statusText);
        console.error("에러 응답:", errorText);

        // 더 구체적인 에러 메시지 반환
        let errorMessage = "댓글을 가져올 수 없습니다.";
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {
          // JSON 파싱 실패시 원본 텍스트 사용
          errorMessage = errorText;
        }

        return res.status(response.status).json({ message: errorMessage });
      }

      const data = await response.json();
      res.json(data);

    } catch (error) {
      console.error("댓글 조회 에러:", error);
      return res.status(500).json({ message: "서버 에러가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
