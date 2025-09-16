import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { originalDocumentValidationSchema, modifiedDocumentValidationSchema } from "@shared/schema";
// import { fromZodError } from "zod-validation-error"; // 로컬 전용이므로 사용 안함

export async function registerRoutes(app: Express): Promise<Server> {
  // API 엔드포인트들은 /api 접두사를 사용합니다
  
  // 모든 원본 문서 가져오기
  app.get("/api/original-documents", async (_req, res) => {
    try {
      const documents = await storage.getAllOriginalDocuments();
      return res.json(documents);
    } catch (error) {
      console.error("원본 문서 조회 오류:", error);
      return res.status(500).json({ message: "원본 문서를 가져오는 중 오류가 발생했습니다" });
    }
  });

  // ID로 특정 원본 문서 가져오기
  app.get("/api/original-documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "유효하지 않은 ID입니다" });
      }

      const document = await storage.getOriginalDocumentById(id);
      if (!document) {
        return res.status(404).json({ message: "문서를 찾을 수 없습니다" });
      }

      return res.json(document);
    } catch (error) {
      console.error("원본 문서 조회 오류:", error);
      return res.status(500).json({ message: "원본 문서를 가져오는 중 오류가 발생했습니다" });
    }
  });

  // 새 원본 문서 추가
  app.post("/api/original-documents", async (req, res) => {
    try {
      // 요청 본문 검증
      const validationResult = originalDocumentValidationSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.message;
        return res.status(400).json({ message: errorMessage });
      }

      // 제목 중복 확인
      const existingDocument = await storage.getOriginalDocumentByTitle(validationResult.data.title);
      if (existingDocument) {
        return res.status(409).json({ message: "이미 같은 제목의 문서가 존재합니다" });
      }

      // 요청 본문 크기 검사
      if (validationResult.data.content && validationResult.data.content.length > 5000000) {
        return res.status(413).json({ message: "콘텐츠 크기가 너무 큽니다. 5MB 이하로 제한해주세요." });
      }

      // 문서 생성
      const newDocument = await storage.createOriginalDocument(validationResult.data);
      return res.status(201).json(newDocument);
    } catch (error) {
      console.error("원본 문서 생성 오류:", error);
      return res.status(500).json({ message: "원본 문서를 생성하는 중 오류가 발생했습니다" });
    }
  });

  // 두 텍스트 비교 API
  app.post("/api/compare", (req, res) => {
    try {
      const { original, modified } = req.body;
      
      if (typeof original !== "string" || typeof modified !== "string") {
        return res.status(400).json({ message: "원본 텍스트와 수정된 텍스트는 문자열이어야 합니다" });
      }

      // 비교 로직은 클라이언트 측에서 처리하므로 단순히 두 텍스트를 반환
      return res.json({ original, modified });
    } catch (error) {
      console.error("텍스트 비교 오류:", error);
      return res.status(500).json({ message: "텍스트를 비교하는 중 오류가 발생했습니다" });
    }
  });

  // 모든 수정된 문서 가져오기
  app.get("/api/modified-documents", async (_req, res) => {
    try {
      const documents = await storage.getAllModifiedDocuments();
      return res.json(documents);
    } catch (error) {
      console.error("수정된 문서 조회 오류:", error);
      return res.status(500).json({ message: "수정된 문서를 가져오는 중 오류가 발생했습니다" });
    }
  });

  // 원본 ID별로 수정된 문서 가져오기
  app.get("/api/modified-documents/original/:originalId", async (req, res) => {
    try {
      const originalId = parseInt(req.params.originalId);
      if (isNaN(originalId)) {
        return res.status(400).json({ message: "유효하지 않은 원본 ID입니다" });
      }

      const documents = await storage.getModifiedDocumentsByOriginalId(originalId);
      return res.json(documents);
    } catch (error) {
      console.error("수정된 문서 조회 오류:", error);
      return res.status(500).json({ message: "수정된 문서를 가져오는 중 오류가 발생했습니다" });
    }
  });

  // ID로 특정 수정된 문서 가져오기
  app.get("/api/modified-documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "유효하지 않은 ID입니다" });
      }

      const document = await storage.getModifiedDocumentById(id);
      if (!document) {
        return res.status(404).json({ message: "문서를 찾을 수 없습니다" });
      }

      return res.json(document);
    } catch (error) {
      console.error("수정된 문서 조회 오류:", error);
      return res.status(500).json({ message: "수정된 문서를 가져오는 중 오류가 발생했습니다" });
    }
  });

  // 새 수정된 문서 추가
  app.post("/api/modified-documents", async (req, res) => {
    try {
      // 요청 본문 검증
      const validationResult = modifiedDocumentValidationSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.message;
        return res.status(400).json({ message: errorMessage });
      }

      // 원본 문서 존재 확인
      const originalDocument = await storage.getOriginalDocumentById(validationResult.data.originalId);
      if (!originalDocument) {
        return res.status(404).json({ message: "원본 문서를 찾을 수 없습니다" });
      }

      // 같은 이름의 수정된 문서 확인 (덮어쓰기 로직을 위함)
      const existingDocument = await storage.getModifiedDocumentByTitleAndOriginalId(
        validationResult.data.title, 
        validationResult.data.originalId
      );

      // 요청 본문 크기 검사
      if (validationResult.data.content && validationResult.data.content.length > 5000000) {
        return res.status(413).json({ message: "콘텐츠 크기가 너무 큽니다. 5MB 이하로 제한해주세요." });
      }

      // 덮어쓰기 모드일 경우
      if (req.query.mode === 'overwrite' && existingDocument) {
        // 수정된 문서 삭제하고 새로 생성 (실제 구현에서는 UPDATE 쿼리 사용 가능)
        // 여기서는 삭제 후 새로 생성하는 방식 사용
        
        // 문서 생성
        const newDocument = await storage.createModifiedDocument(validationResult.data);
        return res.status(201).json(newDocument);
      } 
      // 새 문서 생성
      else {
        // 기존 문서와 제목이 같을 경우 오류 반환 (추가 모드)
        if (existingDocument && req.query.mode !== 'overwrite') {
          return res.status(409).json({ 
            message: "이미 같은 제목의 수정된 문서가 존재합니다. 덮어쓰기를 원하시면 mode=overwrite 파라미터를 추가하세요." 
          });
        }

        // 문서 생성
        const newDocument = await storage.createModifiedDocument(validationResult.data);
        return res.status(201).json(newDocument);
      }
    } catch (error) {
      console.error("수정된 문서 생성 오류:", error);
      return res.status(500).json({ message: "수정된 문서를 생성하는 중 오류가 발생했습니다" });
    }
  });

  // 수정된 문서 업데이트 (덮어쓰기용)
  app.put("/api/modified-documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "유효하지 않은 ID입니다" });
      }

      // 요청 본문 검증
      const validationResult = modifiedDocumentValidationSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.message;
        return res.status(400).json({ message: errorMessage });
      }

      // 기존 문서 존재 확인
      const existingDocument = await storage.getModifiedDocumentById(id);
      if (!existingDocument) {
        return res.status(404).json({ message: "수정된 문서를 찾을 수 없습니다" });
      }

      // 문서 업데이트 (실제 업데이트)
      const updatedDocument = await storage.updateModifiedDocument(id, validationResult.data);
      return res.json(updatedDocument);
    } catch (error) {
      console.error("수정된 문서 업데이트 오류:", error);
      return res.status(500).json({ message: "수정된 문서를 업데이트하는 중 오류가 발생했습니다" });
    }
  });

  // 수정된 문서의 영역 관리 정보 저장 API (JSON 방식) - v2
  console.log(`🔧 [ROUTE DEBUG] POST /api/modified-documents/:id/region-data 라우트 등록됨 - v2`);
  app.post("/api/modified-documents/:id/region-data", async (req, res) => {
    console.log(`🚨 [SERVER DEBUG] POST 핸들러 실행됨!!! URL: ${req.url}`);
    try {
      const modifiedDocumentId = parseInt(req.params.id);
      console.log(`💾 [SERVER DEBUG] 영역 데이터 저장 요청: ID = ${modifiedDocumentId}`);
      console.log(`💾 [SERVER DEBUG] 받은 영역 데이터:`, req.body);
      
      if (isNaN(modifiedDocumentId)) {
        return res.status(400).json({ message: "유효하지 않은 수정된 문서 ID입니다" });
      }

      // 기존 문서 확인
      const existingDocument = await storage.getModifiedDocumentById(modifiedDocumentId);
      if (!existingDocument) {
        console.log(`💾 [SERVER DEBUG] 문서를 찾을 수 없음: ID = ${modifiedDocumentId}`);
        return res.status(404).json({ message: "수정된 문서를 찾을 수 없습니다" });
      }

      // 영역 관리 데이터를 문서의 regionData 필드에 저장
      const updateData = {
        title: existingDocument.title,
        content: existingDocument.content,
        originalId: existingDocument.originalId,
        regionData: req.body // 영역 관리 데이터를 JSON으로 저장
      };

      console.log(`💾 [SERVER DEBUG] 데이터베이스에 저장할 데이터:`, {
        id: modifiedDocumentId,
        regionData: updateData.regionData
      });

      const updatedDocument = await storage.updateModifiedDocument(modifiedDocumentId, updateData);
      console.log(`💾 [SERVER DEBUG] 저장 완료, 업데이트된 문서:`, {
        id: updatedDocument.id,
        regionData: updatedDocument.regionData
      });

      return res.json({ success: true, regionData: updatedDocument.regionData });
    } catch (error) {
      console.error("💾 [SERVER DEBUG] 영역 관리 데이터 저장 오류:", error);
      return res.status(500).json({ message: "영역 관리 데이터를 저장하는 중 오류가 발생했습니다" });
    }
  });

  // 수정된 문서의 영역 관리 정보 불러오기 API (JSON 방식)
  app.get("/api/modified-documents/:id/region-data", async (req, res) => {
    try {
      const modifiedDocumentId = parseInt(req.params.id);
      console.log(`📖 [SERVER DEBUG] 영역 데이터 조회 요청: ID = ${modifiedDocumentId}`);
      
      if (isNaN(modifiedDocumentId)) {
        return res.status(400).json({ message: "유효하지 않은 수정된 문서 ID입니다" });
      }

      const document = await storage.getModifiedDocumentById(modifiedDocumentId);
      console.log(`📖 [SERVER DEBUG] 데이터베이스에서 조회된 문서:`, {
        id: document?.id,
        title: document?.title,
        regionData: document?.regionData,
        regionDataType: typeof document?.regionData
      });
      
      if (!document) {
        console.log(`📖 [SERVER DEBUG] 문서를 찾을 수 없음`);
        return res.status(404).json({ message: "수정된 문서를 찾을 수 없습니다" });
      }

      // regionData가 있으면 반환, 없으면 빈 데이터 반환
      const regionData = document.regionData || { categories: [], regions: [], lineGroups: [] };
      console.log(`📖 [SERVER DEBUG] 클라이언트로 반환할 영역 데이터:`, regionData);
      return res.json(regionData);
    } catch (error) {
      console.error("영역 관리 데이터 조회 오류:", error);
      return res.status(500).json({ message: "영역 관리 데이터를 가져오는 중 오류가 발생했습니다" });
    }
  });

  // 특정 원본 문서의 백업 목록 가져오기
  app.get("/api/original-documents/:id/backups", async (req, res) => {
    try {
      const parentId = parseInt(req.params.id);
      if (isNaN(parentId)) {
        return res.status(400).json({ message: "유효하지 않은 원본 문서 ID입니다" });
      }

      const backups = await storage.getBackupsByParentId(parentId);
      return res.json(backups);
    } catch (error) {
      console.error("백업 목록 조회 오류:", error);
      return res.status(500).json({ message: "백업 목록을 가져오는 중 오류가 발생했습니다" });
    }
  });

  // 수정본을 원본에 적용하기 (백업 생성 후 덮어씌우기)
  app.post("/api/original-documents/:id/apply-modified", async (req, res) => {
    try {
      const originalId = parseInt(req.params.id);
      if (isNaN(originalId)) {
        return res.status(400).json({ message: "유효하지 않은 원본 문서 ID입니다" });
      }

      const { modifiedContent, backupName } = req.body;
      if (!modifiedContent) {
        return res.status(400).json({ message: "수정된 내용이 필요합니다" });
      }

      // 원본 문서 조회
      const originalDocument = await storage.getOriginalDocumentById(originalId);
      if (!originalDocument) {
        return res.status(404).json({ message: "원본 문서를 찾을 수 없습니다" });
      }

      // 백업 이름 생성 로직
      let finalBackupName = backupName;
      if (!backupName || backupName.trim() === '') {
        // 자동 백업 이름 생성 (v1, v2, v3...)
        const existingBackups = await storage.getBackupsByParentId(originalId);
        const versionNumbers = existingBackups
          .map(backup => backup.backupName)
          .filter(name => name && name.startsWith('v'))
          .map(name => name ? parseInt(name.substring(1)) : 0)
          .filter(num => !isNaN(num));
        
        const nextVersion = versionNumbers.length > 0 ? Math.max(...versionNumbers) + 1 : 1;
        finalBackupName = `v${nextVersion}`;
      } else {
        // 사용자 입력 이름에 날짜-시간 추가
        const now = new Date();
        const dateStr = now.toLocaleDateString('ko-KR');
        const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
        finalBackupName = `${backupName.trim()} (${dateStr} ${timeStr})`;
      }

      // 백업 생성
      await storage.createOriginalDocument({
        title: originalDocument.title,
        content: originalDocument.content,
        isBackup: true,
        backupName: finalBackupName,
        parentId: originalId
      });

      // 원본 문서 업데이트
      const updatedDocument = await storage.updateOriginalDocument(originalId, {
        content: modifiedContent
      });

      return res.json({
        success: true,
        backupName: finalBackupName,
        updatedDocument
      });
    } catch (error) {
      console.error("원본 문서 적용 오류:", error);
      return res.status(500).json({ message: "원본 문서에 적용하는 중 오류가 발생했습니다" });
    }
  });

  // 백업에서 원본 문서 복원하기
  app.post("/api/original-documents/:id/restore-backup", async (req, res) => {
    try {
      const originalId = parseInt(req.params.id);
      const { backupId } = req.body;
      
      if (isNaN(originalId) || isNaN(backupId)) {
        return res.status(400).json({ message: "유효하지 않은 ID입니다" });
      }

      // 백업 문서 조회
      const backupDocument = await storage.getOriginalDocumentById(backupId);
      if (!backupDocument || !backupDocument.isBackup || backupDocument.parentId !== originalId) {
        return res.status(404).json({ message: "유효한 백업 문서를 찾을 수 없습니다" });
      }

      // 원본 문서에 백업 내용 복원
      const restoredDocument = await storage.updateOriginalDocument(originalId, {
        content: backupDocument.content
      });

      return res.json({
        success: true,
        restoredDocument
      });
    } catch (error) {
      console.error("백업 복원 오류:", error);
      return res.status(500).json({ message: "백업을 복원하는 중 오류가 발생했습니다" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
