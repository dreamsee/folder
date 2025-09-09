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

  // YouTube 영상 상세 정보 API 엔드포인트 (설명란 포함)
  app.get("/api/youtube/video-info/:videoId", async (req, res) => {
    try {
      const videoId = req.params.videoId as string;
      
      console.log("영상 상세 정보 요청:", videoId);
      console.log("API 키 존재 여부:", !!apiKey);

      if (!videoId) {
        return res.status(400).json({ message: "영상 ID가 필요합니다." });
      }

      if (!apiKey) {
        console.error("YouTube API 키가 설정되지 않음 - 목업 데이터 반환");
        // 목업 데이터 반환 (개발용)
        return res.json({ 
          videoId,
          title: "목업 영상 제목",
          description: "0:00 인트로\n2:30 메인 내용 설명\n8:15 결론 및 마무리\n10:00 엔딩",
          duration: 600 // 10분
        });
      }

      // YouTube API 호출 - 영상 상세 정보
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
      
      console.log("API 호출 URL:", apiUrl.replace(apiKey, "***"));

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("YouTube API 에러 응답:", response.status, errorText);
        
        return res.status(response.status).json({
          message: "YouTube API 오류가 발생했습니다.",
          error: errorText
        });
      }

      const data = await response.json() as any;
      console.log("API 응답 데이터:", data);

      if (!data.items || data.items.length === 0) {
        return res.status(404).json({ message: "영상을 찾을 수 없습니다." });
      }

      const video = data.items[0];
      const videoInfo = {
        videoId: video.id,
        title: video.snippet.title,
        description: video.snippet.description || "",
        duration: video.contentDetails.duration, // PT4M13S 형식
        channelTitle: video.snippet.channelTitle
      };

      return res.json(videoInfo);
    } catch (error) {
      console.error("YouTube 영상 정보 에러:", error);
      console.error("에러 스택:", error instanceof Error ? error.stack : error);
      return res.status(500).json({ 
        message: "서버 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

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

  // 관련 영상 API 엔드포인트
  app.get("/api/youtube/related", async (req, res) => {
    try {
      const videoId = req.query.videoId as string;
      const direction = req.query.direction as 'prev' | 'next';
      
      if (!videoId || !direction) {
        return res.status(400).json({ message: "videoId와 direction이 필요합니다." });
      }

      if (!apiKey) {
        // 목업 데이터 반환
        return res.json({
          videoId: `related_${direction}_${Date.now()}`,
          title: `${direction === 'next' ? '다음' : '이전'} 관련영상 (목업)`
        });
      }

      // 현재 영상 정보 가져오기
      const videoInfoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
      const videoResponse = await fetch(videoInfoUrl);
      const videoData = await videoResponse.json() as any;
      
      if (!videoData.items?.[0]) {
        return res.status(404).json({ message: "영상을 찾을 수 없습니다." });
      }

      const currentVideo = videoData.items[0];
      const channelId = currentVideo.snippet.channelId;
      
      // 관련 영상 검색 (같은 채널의 다른 영상들)
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=relevance&maxResults=10&key=${apiKey}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json() as any;

      if (!searchData.items || searchData.items.length === 0) {
        return res.status(404).json({ message: "관련 영상을 찾을 수 없습니다." });
      }

      // 현재 영상 제외하고 첫 번째 영상 반환
      const relatedVideo = searchData.items.find((item: any) => item.id.videoId !== videoId);
      
      if (!relatedVideo) {
        return res.status(404).json({ message: "관련 영상을 찾을 수 없습니다." });
      }

      return res.json({
        videoId: relatedVideo.id.videoId,
        title: relatedVideo.snippet.title,
        thumbnail: relatedVideo.snippet.thumbnails.medium.url,
        channelTitle: relatedVideo.snippet.channelTitle
      });
    } catch (error) {
      console.error("관련 영상 API 에러:", error);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // 같은 채널 영상 API 엔드포인트
  app.get("/api/youtube/channel", async (req, res) => {
    try {
      const videoId = req.query.videoId as string;
      const direction = req.query.direction as 'prev' | 'next';
      
      if (!videoId || !direction) {
        return res.status(400).json({ message: "videoId와 direction이 필요합니다." });
      }

      if (!apiKey) {
        // 목업 데이터 반환
        return res.json({
          videoId: `channel_${direction}_${Date.now()}`,
          title: `${direction === 'next' ? '다음' : '이전'} 채널영상 (목업)`
        });
      }

      // 현재 영상 정보 가져오기
      const videoInfoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
      const videoResponse = await fetch(videoInfoUrl);
      const videoData = await videoResponse.json() as any;
      
      if (!videoData.items?.[0]) {
        return res.status(404).json({ message: "영상을 찾을 수 없습니다." });
      }

      const currentVideo = videoData.items[0];
      const channelId = currentVideo.snippet.channelId;
      
      // 채널의 모든 영상 가져오기 (업로드 날짜 순)
      const order = direction === 'next' ? 'date' : 'date'; // 실제로는 더 복잡한 로직 필요
      const channelUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=${order}&maxResults=50&key=${apiKey}`;
      const channelResponse = await fetch(channelUrl);
      const channelData = await channelResponse.json() as any;

      if (!channelData.items || channelData.items.length === 0) {
        return res.status(404).json({ message: "채널 영상을 찾을 수 없습니다." });
      }

      // 현재 영상의 인덱스 찾기
      const currentIndex = channelData.items.findIndex((item: any) => item.id.videoId === videoId);
      let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      
      if (targetIndex < 0 || targetIndex >= channelData.items.length) {
        return res.status(404).json({ message: `${direction === 'next' ? '다음' : '이전'} 영상을 찾을 수 없습니다.` });
      }

      const targetVideo = channelData.items[targetIndex];
      
      return res.json({
        videoId: targetVideo.id.videoId,
        title: targetVideo.snippet.title,
        thumbnail: targetVideo.snippet.thumbnails.medium.url,
        channelTitle: targetVideo.snippet.channelTitle
      });
    } catch (error) {
      console.error("채널 영상 API 에러:", error);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // 즐겨찾기 영상 API 엔드포인트
  app.get("/api/favorites", async (req, res) => {
    try {
      const currentVideoId = req.query.currentVideoId as string;
      const direction = req.query.direction as 'prev' | 'next';
      
      if (!currentVideoId || !direction) {
        return res.status(400).json({ message: "currentVideoId와 direction이 필요합니다." });
      }

      // 실제로는 사용자별 즐겨찾기 목록을 데이터베이스에서 가져와야 함
      // 현재는 목업 데이터로 구현
      const mockFavorites = [
        { videoId: "dQw4w9WgXcQ", title: "Rick Astley - Never Gonna Give You Up" },
        { videoId: "3JZ_D3ELwOQ", title: "Sample Video 1" },
        { videoId: "oHg5SJYRHA0", title: "Sample Video 2" },
        currentVideoId,
        { videoId: "ZZ5LpwO-An4", title: "Sample Video 3" },
      ];

      const currentIndex = mockFavorites.findIndex(item => 
        typeof item === 'string' ? item === currentVideoId : item.videoId === currentVideoId
      );

      if (currentIndex === -1) {
        return res.status(404).json({ message: "현재 영상이 즐겨찾기에 없습니다." });
      }

      const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      
      if (targetIndex < 0 || targetIndex >= mockFavorites.length) {
        return res.status(404).json({ message: `${direction === 'next' ? '다음' : '이전'} 즐겨찾기 영상을 찾을 수 없습니다.` });
      }

      const targetVideo = mockFavorites[targetIndex];
      const videoId = typeof targetVideo === 'string' ? targetVideo : targetVideo.videoId;
      
      if (!apiKey) {
        return res.json({
          videoId,
          title: `즐겨찾기 ${direction === 'next' ? '다음' : '이전'} 영상 (목업)`
        });
      }

      // 실제 영상 정보 가져오기
      const videoInfoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
      const videoResponse = await fetch(videoInfoUrl);
      const videoData = await videoResponse.json() as any;
      
      if (!videoData.items?.[0]) {
        return res.status(404).json({ message: "즐겨찾기 영상 정보를 가져올 수 없습니다." });
      }

      const video = videoData.items[0];
      
      return res.json({
        videoId: video.id,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.medium.url,
        channelTitle: video.snippet.channelTitle
      });
    } catch (error) {
      console.error("즐겨찾기 영상 API 에러:", error);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // 영상 정보 조회 API (미리보기용)
  app.get("/api/youtube/video-info", async (req, res) => {
    try {
      const videoId = req.query.videoId as string;
      
      if (!videoId) {
        return res.status(400).json({ message: "videoId가 필요합니다." });
      }

      if (!apiKey) {
        return res.json({
          title: `영상 정보 (목업) - ${videoId}`,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
        });
      }

      const videoInfoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
      const response = await fetch(videoInfoUrl);
      const data = await response.json() as any;
      
      if (!data.items?.[0]) {
        return res.status(404).json({ message: "영상을 찾을 수 없습니다." });
      }

      const video = data.items[0];
      
      return res.json({
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.medium.url
      });
    } catch (error) {
      console.error("영상 정보 API 에러:", error);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // 관련 영상 목록 API (미리보기용)
  app.get("/api/youtube/related-list", async (req, res) => {
    try {
      const videoId = req.query.videoId as string;
      const count = parseInt(req.query.count as string) || 10;
      
      if (!videoId) {
        return res.status(400).json({ message: "videoId가 필요합니다." });
      }

      if (!apiKey) {
        // 목업 데이터 반환
        const mockVideos = [];
        for (let i = 0; i < count; i++) {
          mockVideos.push({
            videoId: `related_${i}_${Date.now()}`,
            title: `관련영상 ${i + 1} (목업)`,
            thumbnail: `https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
            channelTitle: `채널 ${i + 1}`
          });
        }
        return res.json({ videos: mockVideos });
      }

      // 실제 관련 영상 가져오기
      const videoInfoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
      const videoResponse = await fetch(videoInfoUrl);
      const videoData = await videoResponse.json() as any;
      
      if (!videoData.items?.[0]) {
        return res.status(404).json({ message: "영상을 찾을 수 없습니다." });
      }

      const currentVideo = videoData.items[0];
      const channelId = currentVideo.snippet.channelId;
      
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=relevance&maxResults=${count}&key=${apiKey}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json() as any;

      const videos = searchData.items?.filter((item: any) => item.id.videoId !== videoId).map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle
      })) || [];

      return res.json({ videos: videos.slice(0, count) });
    } catch (error) {
      console.error("관련 영상 목록 API 에러:", error);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // 같은 채널 영상 목록 API (미리보기용)
  app.get("/api/youtube/channel-list", async (req, res) => {
    try {
      const videoId = req.query.videoId as string;
      const count = parseInt(req.query.count as string) || 10;
      
      if (!videoId) {
        return res.status(400).json({ message: "videoId가 필요합니다." });
      }

      if (!apiKey) {
        // 목업 데이터 반환
        const mockVideos = [];
        for (let i = 0; i < count; i++) {
          mockVideos.push({
            videoId: `channel_${i}_${Date.now()}`,
            title: `채널영상 ${i + 1} (목업)`,
            thumbnail: `https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
            channelTitle: `같은 채널`
          });
        }
        return res.json({ videos: mockVideos });
      }

      // 실제 채널 영상 목록 가져오기
      const videoInfoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
      const videoResponse = await fetch(videoInfoUrl);
      const videoData = await videoResponse.json() as any;
      
      if (!videoData.items?.[0]) {
        return res.status(404).json({ message: "영상을 찾을 수 없습니다." });
      }

      const currentVideo = videoData.items[0];
      const channelId = currentVideo.snippet.channelId;
      
      const channelUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${count + 5}&key=${apiKey}`;
      const channelResponse = await fetch(channelUrl);
      const channelData = await channelResponse.json() as any;

      const videos = channelData.items?.filter((item: any) => item.id.videoId !== videoId).map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle
      })) || [];

      return res.json({ videos: videos.slice(0, count) });
    } catch (error) {
      console.error("채널 영상 목록 API 에러:", error);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // 즐겨찾기 영상 목록 API (미리보기용)
  app.get("/api/favorites-list", async (req, res) => {
    try {
      const currentVideoId = req.query.currentVideoId as string;
      const count = parseInt(req.query.count as string) || 10;
      
      if (!currentVideoId) {
        return res.status(400).json({ message: "currentVideoId가 필요합니다." });
      }

      // 실제로는 사용자별 즐겨찾기 목록을 데이터베이스에서 가져와야 함
      const mockFavorites = [
        "dQw4w9WgXcQ", "3JZ_D3ELwOQ", "oHg5SJYRHA0", "ZZ5LpwO-An4",
        "9bZkp7q19f0", "2vjPBrBU-TM", "kJQP7kiw5Fk", "L_jWHffIx5E",
        "fJ9rUzIMcZQ", "QtXby3twMmI"
      ];

      const filteredFavorites = mockFavorites.filter(id => id !== currentVideoId).slice(0, count);
      
      if (!apiKey) {
        // 목업 데이터 반환
        const mockVideos = filteredFavorites.map((id, index) => ({
          videoId: id,
          title: `즐겨찾기 영상 ${index + 1} (목업)`,
          thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
          channelTitle: `즐겨찾기 채널 ${index + 1}`
        }));
        return res.json({ videos: mockVideos });
      }

      // 실제 영상 정보들 일괄 가져오기
      const videoIds = filteredFavorites.join(',');
      const videoInfoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds}&key=${apiKey}`;
      const response = await fetch(videoInfoUrl);
      const data = await response.json() as any;
      
      const videos = data.items?.map((video: any) => ({
        videoId: video.id,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.medium.url,
        channelTitle: video.snippet.channelTitle
      })) || [];

      return res.json({ videos });
    } catch (error) {
      console.error("즐겨찾기 목록 API 에러:", error);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
