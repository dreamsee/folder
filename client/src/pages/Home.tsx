import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ComparisonView from "@/components/ComparisonView";
import NewOriginalModal from "@/components/NewOriginalModal";
import SaveModifiedModal from "@/components/SaveModifiedModal";
import TextRegionManager from "@/components/TextRegionManager";
import DiffModal from "@/components/DiffModal";
import ApplyToOriginalModal from "@/components/ApplyToOriginalModal";
import { JsonFileManager } from "@/components/JsonFileManager";
import MultiFileCardManager from "@/components/MultiFileCardManager";
import { compareTexts, compareTextsInline } from "@/lib/diffUtils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OriginalDocument, ModifiedDocument, ComparisonMode } from "@/lib/types";
import {
  모든원본문서가져오기,
  ID로원본문서찾기,
  원본ID로수정된문서찾기,
  ID로수정된문서찾기
} from "@/lib/localStorageUtils";

export default function Home() {
  const { toast } = useToast();
  const [appMode, setAppMode] = useState<'comparison' | 'multifile'>('comparison');
  const [isNewOriginalModalOpen, setIsNewOriginalModalOpen] = useState(false);
  const [isSaveModifiedModalOpen, setIsSaveModifiedModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [selectedModifiedDocumentId, setSelectedModifiedDocumentId] = useState<string>("none");
  const [originalText, setOriginalText] = useState<string>("");
  const [modifiedText, setModifiedText] = useState<string>("");
  const [diffResult, setDiffResult] = useState<string>("");
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("side-by-side");
  const [lastComparisonMode, setLastComparisonMode] = useState<ComparisonMode>("side-by-side");
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [regionData, setRegionData] = useState<any>(null);
  const [hoveredOriginalId, setHoveredOriginalId] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [originalDocuments, setOriginalDocuments] = useState<OriginalDocument[]>([]);
  const [modifiedDocuments, setModifiedDocuments] = useState<ModifiedDocument[]>([]);
  const [hoveredModifiedDocuments, setHoveredModifiedDocuments] = useState<ModifiedDocument[]>([]);
  const [isLoading] = useState(false);

  // 원본 문서 목록 로드
  const loadOriginalDocuments = () => {
    const documents = 모든원본문서가져오기();
    setOriginalDocuments(documents);
    return documents;
  };

  // 수정된 문서 목록 로드
  const loadModifiedDocuments = (originalId: string) => {
    if (!originalId) return [];
    console.log('📋 [DEBUG] 수정된 문서 목록 로드, 원본ID:', originalId);
    const documents = 원본ID로수정된문서찾기(parseInt(originalId));
    console.log('📋 [DEBUG] 찾은 수정된 문서들:', documents);
    setModifiedDocuments(documents);
    return documents;
  };

  // 호버된 원본에 대한 수정된 문서 로드
  const loadHoveredModifiedDocuments = (originalId: string) => {
    if (!originalId) return [];
    const documents = 원본ID로수정된문서찾기(parseInt(originalId));
    setHoveredModifiedDocuments(documents);
    return documents;
  };

  // 특정 ID의 원본 문서 가져오기
  const getOriginalDocument = async (id: string) => {
    if (!id) return;
    try {
      const document = ID로원본문서찾기(parseInt(id));
      if (document) {
        setOriginalText(document.content);
        setModifiedText(document.content);
        // 수정된 문서 선택 초기화
        setSelectedModifiedDocumentId("none");
        // 해당 원본의 수정된 문서들 로드
        loadModifiedDocuments(id);
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "원본 문서를 가져오는 중 오류가 발생했습니다",
        variant: "destructive",
      });
    }
  };
  
  // 특정 ID의 수정된 문서 가져오기
  const getModifiedDocument = async (id: string) => {
    if (!id) return;
    try {
      console.log('🔍 [DEBUG] 수정된 문서 가져오기 시작, ID:', id);
      const document = ID로수정된문서찾기(parseInt(id));
      console.log('🔍 [DEBUG] 찾은 수정된 문서:', document);
      
      if (document) {
        // 수정된 문서의 내용만 업데이트 (원본은 그대로 유지)
        setModifiedText(document.content);
        console.log('🔍 [DEBUG] 수정된 텍스트 설정됨, 길이:', document.content.length);
      } else {
        console.log('🔍 [DEBUG] 수정된 문서를 찾지 못함');
      }
    } catch (error) {
      console.error('🔍 [DEBUG] 수정된 문서 가져오기 오류:', error);
      toast({
        title: "오류",
        description: "수정된 문서를 가져오는 중 오류가 발생했습니다",
        variant: "destructive",
      });
    }
  };

  // 비교 모드 상태 (라인 방식 또는 인라인 방식)
  const [diffMode, setDiffMode] = useState<'line' | 'inline'>('inline');

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setHoveredOriginalId("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // 비교 수행
  const performCompare = (mode?: 'line' | 'inline') => {
    if (!originalText || !modifiedText) {
      toast({
        title: "알림",
        description: "원본 문서와 수정된 문서가 필요합니다",
      });
      return;
    }

    // 대용량 텍스트 체크
    const totalChars = originalText.length + modifiedText.length;
    if (totalChars > 100000) {
      toast({
        title: "대용량 텍스트 감지",
        description: "diff 모드에서 안전하게 비교하세요",
      });
      setComparisonMode('diff');
      return;
    }

    try {
      // 전달받은 mode 또는 현재 diffMode 사용
      const compareMode = mode || diffMode;
      const result = compareMode === 'inline' 
        ? compareTextsInline(originalText, modifiedText)
        : compareTexts(originalText, modifiedText);
        
      setDiffResult(result);
      // 전달받은 mode가 있으면 상태도 업데이트
      if (mode) {
        setDiffMode(mode);
      }

    } catch (error) {
      console.error("비교 중 오류 발생:", error);
      toast({
        title: "오류",
        description: "텍스트 비교 중 오류가 발생했습니다",
        variant: "destructive",
      });
    }
  };

  // 원본 문서 ID가 변경되면 해당 문서 로드
  useEffect(() => {
    if (selectedDocumentId) {
      getOriginalDocument(selectedDocumentId);
    }
  }, [selectedDocumentId]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadOriginalDocuments();
  }, []);

  // 초기 문서가 로드되면 첫 번째 문서 선택
  useEffect(() => {
    if (Array.isArray(originalDocuments) && originalDocuments.length > 0 && !selectedDocumentId) {
      setSelectedDocumentId(originalDocuments[0].id.toString());
    }
  }, [originalDocuments, selectedDocumentId]);

  // 호버된 원본 ID가 변경되면 해당 수정된 문서들 로드
  useEffect(() => {
    if (hoveredOriginalId) {
      loadHoveredModifiedDocuments(hoveredOriginalId);
    } else {
      setHoveredModifiedDocuments([]);
    }
  }, [hoveredOriginalId]);

  // 모달 제어 함수
  const openNewOriginalModal = () => setIsNewOriginalModalOpen(true);
  const closeNewOriginalModal = () => setIsNewOriginalModalOpen(false);
  const openSaveModifiedModal = () => setIsSaveModifiedModalOpen(true);
  const closeSaveModifiedModal = () => setIsSaveModifiedModalOpen(false);

  // 새 원본 문서 추가 후 처리
  const handleNewOriginalAdded = async () => {
    loadOriginalDocuments();
    toast({
      title: "성공",
      description: "새 원본 문서가 추가되었습니다",
    });
  };
  
  // 수정된 문서 저장 후 처리
  const handleModifiedDocumentSaved = async () => {
    // 수정된 문서 목록 갱신
    if (selectedDocumentId) {
      loadModifiedDocuments(selectedDocumentId);
    }
    
    toast({
      title: "성공",
      description: "수정된 메모가 저장되었습니다",
    });
  };

  // regionData 변경 시 자동으로 수정된 문서 업데이트
  useEffect(() => {
    if (selectedModifiedDocumentId && selectedModifiedDocumentId !== "none" && regionData) {
      const modifiedDocs = JSON.parse(localStorage.getItem('modifiedDocuments') || '[]');
      const docIndex = modifiedDocs.findIndex((doc: any) => doc.id === parseInt(selectedModifiedDocumentId));
      
      if (docIndex !== -1) {
        // 기존 문서의 regionData 업데이트
        modifiedDocs[docIndex].regionData = regionData;
        localStorage.setItem('modifiedDocuments', JSON.stringify(modifiedDocs));
        
        console.log('🔄 [AUTO UPDATE] 수정된 문서의 regionData 자동 업데이트:', {
          documentId: selectedModifiedDocumentId,
          regionData: regionData
        });
      }
    }
  }, [regionData, selectedModifiedDocumentId]);

  // 모드 전환 함수
  const setModeToSideBySide = () => {
    if (comparisonMode === "side-by-side") {
      setComparisonMode("edit-only");
    } else {
      setLastComparisonMode("side-by-side");
      setComparisonMode("side-by-side");
      setIsPreviewMode(false);
    }
  };
  
  const setModeToTopBottom = () => {
    if (comparisonMode === "top-bottom") {
      setComparisonMode("edit-only");
    } else {
      setLastComparisonMode("top-bottom");
      setComparisonMode("top-bottom");
      setIsPreviewMode(false);
    }
  };

  // 리셋 함수 - 수정된 텍스트를 원본으로 복원
  const resetModifiedText = () => {
    if (window.confirm("수정된 내용을 원본으로 되돌리시겠습니까?")) {
      setModifiedText(originalText);
      toast({
        title: "초기화 완료",
        description: "수정된 내용이 원본으로 초기화되었습니다",
      });
    }
  };

  // 이전 상태로 복귀하는 함수
  const returnToPreviousMode = () => {
    console.log('returnToPreviousMode 호출됨');
    setIsPreviewMode(false);
    setComparisonMode(lastComparisonMode);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNewOriginalClick={openNewOriginalModal} />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 모드 선택 탭 */}
          <div className="mb-6">
            <div className="flex gap-2 border-b">
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  appMode === 'comparison'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setAppMode('comparison')}
              >
                2개 노트 비교
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  appMode === 'multifile'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setAppMode('multifile')}
              >
                3개 파일 매칭
              </button>
            </div>
          </div>

          {appMode === 'multifile' ? (
            <MultiFileCardManager />
          ) : (
            <>
              {/* JSON 파일 관리 */}
              <div className="mb-6">
                <JsonFileManager />
              </div>

              {/* 컨트롤 패널 */}
              <div className="bg-white rounded-lg shadow mb-6 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center relative">
                  <span className="text-sm font-medium text-neutral-700 mr-2">원본 파일:</span>
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      className="w-[180px] px-3 py-2 text-left border border-gray-300 rounded-md bg-white text-sm hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      {selectedDocumentId ? 
                        originalDocuments.find(doc => doc.id.toString() === selectedDocumentId)?.title || "원본 선택"
                        : "원본 선택"
                      }
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">▼</span>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                        {isLoading ? (
                          <div className="px-3 py-2 text-sm text-gray-500">로딩 중...</div>
                        ) : Array.isArray(originalDocuments) && originalDocuments.length > 0 ? (
                          originalDocuments.map((doc: OriginalDocument) => (
                            <div 
                              key={doc.id} 
                              className="relative group"
                              onMouseEnter={() => setHoveredOriginalId(doc.id.toString())}
                              onMouseLeave={() => setHoveredOriginalId("")}
                            >
                              <button
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                onClick={() => {
                                  setSelectedDocumentId(doc.id.toString());
                                  setIsDropdownOpen(false);
                                  getOriginalDocument(doc.id.toString());
                                }}
                              >
                                {doc.title}
                              </button>
                              
                              {/* 서브메뉴 - 수정본 목록 */}
                              {hoveredOriginalId === doc.id.toString() && hoveredModifiedDocuments.length > 0 && (
                                <div 
                                  className="absolute left-full top-0 bg-white border border-gray-200 rounded-md shadow-lg p-1 z-[100] min-w-[180px]"
                                  onMouseEnter={() => setHoveredOriginalId(doc.id.toString())}
                                  onMouseLeave={() => setHoveredOriginalId("")}
                                >
                                  {/* 연결 영역 (호버 안정성을 위한 투명 영역) */}
                                  <div className="absolute right-full top-0 w-1 h-full bg-transparent"></div>
                                  {hoveredModifiedDocuments.map((modDoc: ModifiedDocument) => (
                                    <button
                                      key={modDoc.id}
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        // 먼저 원본을 선택하여 수정본 목록을 업데이트 (수정된 텍스트 초기화 방지)
                                        setSelectedDocumentId(doc.id.toString());
                                        const originalDoc = ID로원본문서찾기(doc.id);
                                        if (originalDoc) {
                                          setOriginalText(originalDoc.content);
                                          // 수정된 텍스트는 초기화하지 않음
                                          setSelectedModifiedDocumentId("none");
                                          loadModifiedDocuments(doc.id.toString());
                                        }
                                        
                                        // 수정본을 선택하고 로드
                                        setSelectedModifiedDocumentId(modDoc.id.toString());
                                        await getModifiedDocument(modDoc.id.toString());
                                        
                                        setHoveredOriginalId("");
                                        setIsDropdownOpen(false);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                                    >
                                      {modDoc.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">원본 없음</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 수정된 메모 선택 */}
                {modifiedDocuments.length > 0 && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-neutral-700 mr-2">수정본:</span>
                    <Select
                      value={selectedModifiedDocumentId}
                      onValueChange={(value) => {
                        setSelectedModifiedDocumentId(value);
                        if (value && value !== "none") {
                          getModifiedDocument(value);
                        } else if (value === "none") {
                          // 원본 문서로 되돌리기
                          setModifiedText(originalText);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="수정본 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">선택 안함 (원본)</SelectItem>
                        {isLoading ? (
                          <SelectItem value="loading">로딩 중...</SelectItem>
                        ) : (
                          modifiedDocuments.map((doc: ModifiedDocument) => (
                            <SelectItem key={doc.id} value={doc.id.toString()}>
                              {doc.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={openSaveModifiedModal} 
                    className="flex items-center"
                  >
                    <span className="mr-1">💾</span> 수정본 저장
                  </Button>
                  
                  {selectedDocumentId && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsApplyModalOpen(true)}
                        className="flex items-center"
                      >
                        <span className="mr-1">📤</span> 원본에 적용
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">

                  <span className="text-sm font-medium text-neutral-700 mr-2">비교 방식:</span>
                  <div className="flex rounded-md p-0 inline-block">
                    <Button
                      variant={comparisonMode === "side-by-side" ? "default" : "ghost"}
                      size="sm"
                      onClick={setModeToSideBySide}
                      className="px-3 py-1 rounded border border-neutral-200 hover:border-neutral-300 mr-2"
                    >
                      ↔️ 좌우측
                    </Button>
                    <Button
                      variant={comparisonMode === "top-bottom" ? "default" : "ghost"}
                      size="sm"
                      onClick={setModeToTopBottom}
                      className="px-3 py-1 rounded border border-neutral-200 hover:border-neutral-300"
                    >
                      ↕️ 상하
                    </Button>
                  </div>


                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-700">차이점 표시:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      //setDiffMode();  라인 값을 계속 저장하기에 바꿈
                      performCompare("inline");
                      setIsDiffModalOpen(true);
                    }}
                    className="px-3 py-1 rounded border border-neutral-200 hover:border-neutral-300"
                  >
                    🔍 인라인
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      performCompare("line");
                      setIsDiffModalOpen(true);
                    }}
                    className="px-3 py-1 rounded border border-neutral-200 hover:border-neutral-300"
                  >
                    📋 라인
                  </Button>

                  {/* 구분선 */}
                  <div className="h-4 w-px bg-neutral-300 mx-1"></div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!isPreviewMode) {
                        // 미리보기 모드로 전환
                        setIsPreviewMode(true);
                        setComparisonMode("diff");
                        setDiffResult(""); // 빈 diff 결과로 초기화
                      } else {
                        // 이전 모드로 복귀
                        setIsPreviewMode(false);
                        setComparisonMode(lastComparisonMode);
                      }
                    }}
                    className={`px-3 py-1 rounded border ${
                      isPreviewMode
                        ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    📱 미리보기
                  </Button>
                </div>
              </div>
            </div>
              </div>

              {comparisonMode === "edit-only" ? (
                /* 편집 전용 모드 - 영역 관리만 표시 */
                <div className="mt-8">
                  <TextRegionManager
                    text={modifiedText}
                    onTextChange={setModifiedText}
                    modifiedDocumentId={selectedModifiedDocumentId !== "none" ? parseInt(selectedModifiedDocumentId) : undefined}
                    onRegionDataChange={setRegionData}
                    initialRegionData={regionData}
                  />
                </div>
              ) : (
                <>
                  {/* 비교 영역 */}
                  <div id="compareContainer" className={comparisonMode}>
                    <ComparisonView
                      key={`comparison-${comparisonMode}-${selectedDocumentId}`}
                      originalText={originalText}
                      modifiedText={modifiedText}
                      onModifiedChange={setModifiedText}
                      onReset={comparisonMode === "diff" && isPreviewMode ? returnToPreviousMode : resetModifiedText}
                      mode={comparisonMode}
                      originalDocumentId={selectedDocumentId ? parseInt(selectedDocumentId) : undefined}
                      onOriginalUpdated={() => {
                        if (selectedDocumentId) {
                          getOriginalDocument(selectedDocumentId);
                        }
                      }}
                    />
                  </div>

                  {/* 텍스트 영역 관리 시스템 */}
                  <div className="mt-8">
                    <TextRegionManager
                      text={modifiedText}
                      onTextChange={setModifiedText}
                      modifiedDocumentId={selectedModifiedDocumentId !== "none" ? parseInt(selectedModifiedDocumentId) : undefined}
                      onRegionDataChange={setRegionData}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* 새 원본 추가 모달 */}
      <NewOriginalModal
        isOpen={isNewOriginalModalOpen}
        onClose={closeNewOriginalModal}
        onDocumentAdded={handleNewOriginalAdded}
      />

      {/* 수정된 메모 저장 모달 */}
      <SaveModifiedModal
        isOpen={isSaveModifiedModalOpen}
        onClose={closeSaveModifiedModal}
        onDocumentSaved={handleModifiedDocumentSaved}
        originalId={parseInt(selectedDocumentId) || 0}
        content={modifiedText}
        regionData={regionData}
      />

      {/* 차이점 비교 모달 */}
      <DiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        diffResult={diffResult}
        diffMode={diffMode}
        originalText={originalText}
        modifiedText={modifiedText}
        onModifiedTextChange={setModifiedText}
      />

      {/* 원본에 적용 모달 */}
      {selectedDocumentId && (
        <ApplyToOriginalModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          originalId={parseInt(selectedDocumentId)}
          modifiedContent={modifiedText}
          onSuccess={() => {
            if (selectedDocumentId) {
              getOriginalDocument(selectedDocumentId);
            }
          }}
        />
      )}
    </div>
  );
}
