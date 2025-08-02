import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export interface DebugData {
  originalText: string;
  detectedPatterns: string[];
  patternLengths: Record<string, number>;
  processedLines: string[];
  alignedText: string;
  hasChanged: boolean;
}

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  debugData: DebugData | null;
}

export default function DebugModal({ isOpen, onClose, debugData }: DebugModalProps) {
  if (!debugData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            코드 정렬 디버그 정보
            <Badge variant="outline" className="ml-2">
              {debugData.hasChanged ? '변경됨' : '변경 없음'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            코드 정렬 과정에서 수집된 정보를 확인합니다. 정렬 알고리즘의 동작 방식을 이해하는 데 도움이 됩니다.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="patterns" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="patterns">감지된 패턴</TabsTrigger>
            <TabsTrigger value="lengths">패턴 길이</TabsTrigger>
            <TabsTrigger value="processed">처리된 라인</TabsTrigger>
            <TabsTrigger value="result">최종 결과</TabsTrigger>
          </TabsList>
          
          <TabsContent value="patterns" className="space-y-4">
            <div className="text-sm text-neutral-700 mb-2">
              텍스트에서 자동으로 감지된 패턴 목록입니다. 이 패턴들을 기준으로 정렬이 수행됩니다.
            </div>
            <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200 overflow-x-auto">
              <pre className="text-xs font-mono">
                {debugData.detectedPatterns.map((pattern, index) => (
                  <div key={index} className="py-1">
                    <Badge variant="secondary" className="mr-2 font-mono">
                      {index + 1}
                    </Badge>
                    <span>{pattern}</span>
                  </div>
                ))}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="lengths" className="space-y-4">
            <div className="text-sm text-neutral-700 mb-2">
              각 패턴별 최대 길이 정보입니다. 이 길이에 맞추어 텍스트가 정렬됩니다.
            </div>
            <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200 overflow-x-auto">
              <table className="min-w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 px-4">패턴</th>
                    <th className="text-left py-2 px-4">최대 길이</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(debugData.patternLengths).map(([pattern, length], index) => (
                    <tr key={index} className="border-b border-neutral-200">
                      <td className="py-1 px-4">{pattern}</td>
                      <td className="py-1 px-4">{length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="processed" className="space-y-4">
            <div className="text-sm text-neutral-700 mb-2">
              정렬 과정에서 처리된 각 라인의 상태입니다.
            </div>
            <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200 overflow-x-auto">
              <pre className="text-xs font-mono">
                {debugData.processedLines.map((line, index) => (
                  <div key={index} className="py-1">
                    <Badge variant="secondary" className="mr-2 font-mono">
                      {index + 1}
                    </Badge>
                    <span>{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="result" className="space-y-4">
            <div className="text-sm text-neutral-700 mb-2">
              정렬 전후 비교 결과입니다.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">정렬 전</h3>
                <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200 h-[300px] overflow-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {debugData.originalText}
                  </pre>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">정렬 후</h3>
                <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200 h-[300px] overflow-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {debugData.alignedText}
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}