import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 수정된문서추가하기, 원본ID로수정된문서찾기, 수정된문서수정하기, 수정된문서 } from "@/lib/localStorageUtils";

interface SaveModifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentSaved: () => void;
  originalId: number;
  content: string;
  regionData?: {
    categories: any[];
    regions: any[];
    lineGroups?: any[];
  };
}

export default function SaveModifiedModal({
  isOpen,
  onClose,
  onDocumentSaved,
  originalId,
  content,
  regionData
}: SaveModifiedModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState<string>("");
  const [modifiedDocuments, setModifiedDocuments] = useState<수정된문서[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [isOverwriteMode, setIsOverwriteMode] = useState(false);
  
  // 기존 수정된 문서 목록 가져오기
  useEffect(() => {
    const loadDocuments = async () => {
      if (isOpen && originalId > 0) {
        const documents = await 원본ID로수정된문서찾기(originalId);
        setModifiedDocuments(documents);
        // 모달이 열릴 때 상태 초기화
        setSelectedDocumentId(null);
        setIsOverwriteMode(false);
        setTitle("");
      }
    };
    loadDocuments();
  }, [isOpen, originalId]);

  // 기존 문서 선택 함수
  const handleSelectExistingDocument = (document: 수정된문서) => {
    setSelectedDocumentId(document.id);
    setIsOverwriteMode(true);
    setTitle(document.title);
  };

  // 새로 만들기 모드로 전환
  const handleCreateNew = () => {
    setSelectedDocumentId(null);
    setIsOverwriteMode(false);
    setTitle("");
  };

  // 덮어쓰기 함수
  const handleOverwrite = async () => {
    if (!selectedDocumentId) return;

    try {
      setIsLoading(true);

      console.log('[DEBUG] 덮어쓰기 시작');
      console.log('[DEBUG] 문서 ID:', selectedDocumentId);
      console.log('[DEBUG] 새 내용 길이:', content.length);
      console.log('[DEBUG] 영역 데이터:', regionData);

      const 업데이트된문서 = await 수정된문서수정하기(selectedDocumentId, {
        content,
        regionData
      });

      console.log('[DEBUG] 덮어쓰기 완료:', 업데이트된문서);

      toast({
        title: "성공",
        description: `"${title}" 문서가 덮어쓰기되었습니다`,
      });

      onDocumentSaved();
      onClose();
    } catch (error) {
      toast({
        title: "오류",
        description: "덮어쓰기 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 새 문서 저장
  const handleSaveNew = async () => {
    if (!title.trim()) {
      toast({
        title: "입력 오류",
        description: "제목을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      console.log('[DEBUG] 수정된 문서 저장 시작');
      console.log('[DEBUG] 제목:', title.trim());
      console.log('[DEBUG] 원본ID:', originalId);
      console.log('[DEBUG] 내용 길이:', content.length);
      console.log('[DEBUG] 영역 데이터:', regionData);
      console.log('[DEBUG] 줄 그룹 개수:', regionData?.lineGroups?.length || 0);

      const 저장된문서 = await 수정된문서추가하기({
        title: title.trim(),
        content,
        originalId,
        regionData
      });

      console.log('[DEBUG] 저장된 문서:', 저장된문서);

      toast({
        title: "성공",
        description: "수정된 문서가 저장되었습니다",
      });

      setTitle("");
      onClose();
      onDocumentSaved();
    } catch (error) {
      toast({
        title: "오류",
        description: "문서 저장에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-neutral-800">
            수정된 메모 저장
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-600">
            현재 수정된 내용을 새로운 메모로 저장합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 모드 선택 영역 */}
          {modifiedDocuments.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-neutral-600">
                <p className="font-medium mb-2">기존 수정된 문서:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {modifiedDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectExistingDocument(doc)}
                      className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                        selectedDocumentId === doc.id
                          ? 'bg-blue-50 border-blue-300 text-blue-800'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      • {doc.title}
                      {selectedDocumentId === doc.id && (
                        <span className="ml-2 text-xs text-blue-600">(덮어쓰기 선택됨)</span>
                      )}
                    </button>
                  ))}
                </div>
                
                {isOverwriteMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateNew}
                    className="mt-2 text-xs"
                  >
                    새로 만들기로 변경
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 제목 입력 영역 */}
          {!isOverwriteMode && (
            <div>
              <Label htmlFor="modifiedTitle" className="text-sm font-medium text-neutral-700">
                제목
              </Label>
              <Input
                id="modifiedTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="수정된 메모의 제목을 입력하세요"
                className="mt-1"
              />
            </div>
          )}

          {/* 덮어쓰기 모드일 때 선택된 문서 정보 */}
          {isOverwriteMode && selectedDocumentId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>덮어쓰기 모드:</strong> "{title}" 문서의 내용이 현재 수정된 내용으로 대체됩니다.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            취소
          </Button>
          {isOverwriteMode ? (
            <Button
              onClick={handleOverwrite}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isLoading ? "덮어쓰는 중..." : "덮어쓰기"}
            </Button>
          ) : (
            <Button
              onClick={handleSaveNew}
              disabled={isLoading || !title.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}