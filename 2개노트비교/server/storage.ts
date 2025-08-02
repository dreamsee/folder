import { 
  originalDocuments, 
  modifiedDocuments,
  type OriginalDocument, 
  type InsertOriginalDocument,
  type ModifiedDocument,
  type InsertModifiedDocument
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// 저장소 인터페이스 정의
export interface IStorage {
  // 원본 문서 관련 메소드
  getAllOriginalDocuments(): Promise<OriginalDocument[]>;
  getOriginalDocumentById(id: number): Promise<OriginalDocument | undefined>;
  getOriginalDocumentByTitle(title: string): Promise<OriginalDocument | undefined>;
  createOriginalDocument(document: InsertOriginalDocument): Promise<OriginalDocument>;
  updateOriginalDocument(id: number, document: Partial<InsertOriginalDocument>): Promise<OriginalDocument>;
  getBackupsByParentId(parentId: number): Promise<OriginalDocument[]>;
  deleteModifiedDocument(id: number): Promise<void>;
  
  // 수정된 문서 관련 메소드
  getAllModifiedDocuments(): Promise<ModifiedDocument[]>;
  getModifiedDocumentsByOriginalId(originalId: number): Promise<ModifiedDocument[]>;
  getModifiedDocumentById(id: number): Promise<ModifiedDocument | undefined>;
  createModifiedDocument(document: InsertModifiedDocument): Promise<ModifiedDocument>;
  updateModifiedDocument(id: number, document: InsertModifiedDocument): Promise<ModifiedDocument>;
  getModifiedDocumentByTitleAndOriginalId(title: string, originalId: number): Promise<ModifiedDocument | undefined>;
}

// 데이터베이스 저장소 구현
export class DatabaseStorage implements IStorage {
  // 수정된 문서 관련 메소드 구현
  async getAllModifiedDocuments(): Promise<ModifiedDocument[]> {
    try {
      const documents = await db.select().from(modifiedDocuments);
      return documents;
    } catch (error) {
      console.error("데이터베이스에서 모든 수정된 문서 조회 오류:", error);
      throw error;
    }
  }

  async getModifiedDocumentsByOriginalId(originalId: number): Promise<ModifiedDocument[]> {
    try {
      const documents = await db
        .select()
        .from(modifiedDocuments)
        .where(eq(modifiedDocuments.originalId, originalId));
      return documents;
    } catch (error) {
      console.error(`원본 ID ${originalId}에 대한 수정된 문서 조회 오류:`, error);
      throw error;
    }
  }

  async getModifiedDocumentById(id: number): Promise<ModifiedDocument | undefined> {
    try {
      const [document] = await db
        .select()
        .from(modifiedDocuments)
        .where(eq(modifiedDocuments.id, id));
      return document || undefined;
    } catch (error) {
      console.error(`ID ${id}로 수정된 문서 조회 오류:`, error);
      throw error;
    }
  }

  async getModifiedDocumentByTitleAndOriginalId(title: string, originalId: number): Promise<ModifiedDocument | undefined> {
    try {
      const [document] = await db
        .select()
        .from(modifiedDocuments)
        .where(
          and(
            eq(modifiedDocuments.title, title),
            eq(modifiedDocuments.originalId, originalId)
          )
        );
      return document || undefined;
    } catch (error) {
      console.error(`제목 '${title}'과 원본 ID ${originalId}로 수정된 문서 조회 오류:`, error);
      throw error;
    }
  }

  async createModifiedDocument(document: InsertModifiedDocument): Promise<ModifiedDocument> {
    try {
      const [newDocument] = await db
        .insert(modifiedDocuments)
        .values(document)
        .returning();
      return newDocument;
    } catch (error) {
      console.error("수정된 문서 생성 오류:", error);
      throw error;
    }
  }

  async updateModifiedDocument(id: number, document: InsertModifiedDocument): Promise<ModifiedDocument> {
    try {
      const [updatedDocument] = await db
        .update(modifiedDocuments)
        .set({
          title: document.title,
          content: document.content,
          originalId: document.originalId,
          regionData: document.regionData
        })
        .where(eq(modifiedDocuments.id, id))
        .returning();
      return updatedDocument;
    } catch (error) {
      console.error("수정된 문서 업데이트 오류:", error);
      throw error;
    }
  }
  async getAllOriginalDocuments(): Promise<OriginalDocument[]> {
    try {
      const documents = await db.select().from(originalDocuments);
      return documents;
    } catch (error) {
      console.error("데이터베이스에서 모든 문서 조회 오류:", error);
      throw error;
    }
  }

  async getOriginalDocumentById(id: number): Promise<OriginalDocument | undefined> {
    try {
      const [document] = await db
        .select()
        .from(originalDocuments)
        .where(eq(originalDocuments.id, id));
      return document || undefined;
    } catch (error) {
      console.error(`ID ${id}로 문서 조회 오류:`, error);
      throw error;
    }
  }

  async getOriginalDocumentByTitle(title: string): Promise<OriginalDocument | undefined> {
    try {
      const [document] = await db
        .select()
        .from(originalDocuments)
        .where(eq(originalDocuments.title, title));
      return document || undefined;
    } catch (error) {
      console.error(`제목 '${title}'로 문서 조회 오류:`, error);
      throw error;
    }
  }

  async createOriginalDocument(document: InsertOriginalDocument): Promise<OriginalDocument> {
    try {
      const [newDocument] = await db
        .insert(originalDocuments)
        .values(document)
        .returning();
      return newDocument;
    } catch (error) {
      console.error("문서 생성 오류:", error);
      throw error;
    }
  }

  async updateOriginalDocument(id: number, document: Partial<InsertOriginalDocument>): Promise<OriginalDocument> {
    try {
      const [updatedDocument] = await db
        .update(originalDocuments)
        .set(document)
        .where(eq(originalDocuments.id, id))
        .returning();
      if (!updatedDocument) {
        throw new Error(`ID ${id}인 문서를 찾을 수 없습니다`);
      }
      return updatedDocument;
    } catch (error) {
      console.error(`ID ${id} 문서 업데이트 오류:`, error);
      throw error;
    }
  }

  async getBackupsByParentId(parentId: number): Promise<OriginalDocument[]> {
    try {
      const backups = await db
        .select()
        .from(originalDocuments)
        .where(and(
          eq(originalDocuments.parentId, parentId),
          eq(originalDocuments.isBackup, true)
        ));
      return backups;
    } catch (error) {
      console.error(`부모 ID ${parentId}의 백업 조회 오류:`, error);
      throw error;
    }
  }

  async deleteModifiedDocument(id: number): Promise<void> {
    try {
      await db
        .delete(modifiedDocuments)
        .where(eq(modifiedDocuments.id, id));
    } catch (error) {
      console.error(`ID ${id} 수정 문서 삭제 오류:`, error);
      throw error;
    }
  }



  // 초기 샘플 데이터 추가
  async addInitialDataIfEmpty() {
    try {
      const existingDocuments = await this.getAllOriginalDocuments();
      if (existingDocuments.length === 0) {
        await this.createOriginalDocument({
          title: "기본 메모",
          content: "안녕하세요, 이것은 원본 메모입니다.\n\n이 프로젝트는 노트 비교 도구로서 두 개의 텍스트를 비교하여 차이점을 쉽게 확인할 수 있게 합니다.\n\n주요 기능으로는 다음과 같은 것들이 있습니다:\n- 텍스트 비교 및 차이점 하이라이트\n- 원본 파일 저장 및 관리\n- 좌우/상하 비교 모드 지원\n\n프로젝트 첫 단계에서는 기본 기능 구현에 집중하고, 추후 기능을 확장할 예정입니다.",
        });
      }
    } catch (error) {
      console.error("초기 데이터 추가 오류:", error);
    }
  }
}

// 저장소 인스턴스 생성
export const storage = new DatabaseStorage();
