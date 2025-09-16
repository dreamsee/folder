import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface DiffResultProps {
  diffResult: string;
}

export default function DiffResult({ diffResult }: DiffResultProps) {
  // 라인 수 계산 및 diffResult 처리
  const lineCount = (diffResult.match(/<div class="diff-line">/g) || []).length;
  const [processedLines, setProcessedLines] = useState<string[]>([]);
  
  // diffResult를 처리하여 각 라인을 배열로 변환
  useEffect(() => {
    if (!diffResult) {
      setProcessedLines([]);
      return;
    }
    
    // diff-line 태그로 분할
    const htmlLines = diffResult.split('<div class="diff-line">');
    // 첫 번째 빈 요소 제거
    htmlLines.shift();
    // 닫는 태그 제거
    const cleanedLines = htmlLines.map(line => 
      line.replace('</div>', '')
    );
    
    setProcessedLines(cleanedLines);
  }, [diffResult]);
  
  return (
    <Card className="mt-6">
      <CardHeader className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
        <CardTitle className="text-sm font-medium text-neutral-800">변경사항 인라인 비교</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="border rounded border-neutral-200 overflow-x-auto">
          <table className="w-full table-fixed">
            <tbody>
              {processedLines.length > 0 ? (
                processedLines.map((line, index) => (
                  <tr key={index} className="border-b border-neutral-100 last:border-b-0">
                    <td className="w-12 py-1 px-2 text-right font-mono text-xs text-neutral-400 select-none bg-neutral-100 border-r border-neutral-200">
                      {index + 1}
                    </td>
                    <td className="py-1 px-4 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: line }} />
                  </tr>
                ))
              ) : (
                Array.from({ length: lineCount }, (_, i) => (
                  <tr key={i} className="border-b border-neutral-100 last:border-b-0">
                    <td className="w-12 py-1 px-2 text-right font-mono text-xs text-neutral-400 select-none bg-neutral-100 border-r border-neutral-200">
                      {i + 1}
                    </td>
                    <td className="py-1 px-4 whitespace-pre-wrap">
                      {i === 0 && diffResult ? (
                        <div dangerouslySetInnerHTML={{ __html: diffResult }} />
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-3 p-4 flex items-center text-sm">
          <div className="mr-4 flex items-center">
            <div className="w-3 h-3 bg-green-100 border-b-2 border-green-400 mr-1"></div>
            <span className="text-neutral-600">추가된 부분</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 border-b-2 border-red-400 mr-1 line-through opacity-80"></div>
            <span className="text-neutral-600">삭제된 부분</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
