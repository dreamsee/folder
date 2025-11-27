import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 원본문서추가하기 } from "@/lib/localStorageUtils";

interface NewOriginalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentAdded: () => void;
}

export default function NewOriginalModal({
  isOpen,
  onClose,
  onDocumentAdded,
}: NewOriginalModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "입력 오류",
        description: "파일 이름을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "입력 오류",
        description: "내용을 입력해주세요",
        variant: "destructive",
      });
      return;
    }
    
    // 크기 제한 확인 (클라이언트 측에서도 검사)
    if (content.length > 5000000) {
      toast({
        title: "입력 오류",
        description: "내용이 너무 깁니다. 5MB 이하로 작성해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await 원본문서추가하기({ title, content });

      toast({
        title: "성공",
        description: "원본 문서가 추가되었습니다",
      });

      resetForm();
      onClose();
      onDocumentAdded();
    } catch (error) {
      toast({
        title: "오류",
        description: "원본 문서 추가에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-neutral-800">새 원본 파일 추가</DialogTitle>
        </DialogHeader>
        
        <div className="p-1">
          <div className="mb-4">
            <Label htmlFor="originalTitle" className="block text-sm font-medium text-neutral-700 mb-1">
              파일 이름
            </Label>
            <Input
              id="originalTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="원본 파일의 이름을 입력하세요"
              className="w-full px-3 py-2"
            />
          </div>
          
          <div className="mb-6">
            <Label htmlFor="originalContent" className="block text-sm font-medium text-neutral-700 mb-1">
              내용
            </Label>
            <Textarea
              id="originalContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="원본 파일의 내용을 입력하세요"
              className="w-full px-3 py-2 h-40"
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "추가 중..." : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
